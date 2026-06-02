import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Test de INTEGRACIÓN del CICLO DE VIDA de un pedido contra Supabase real.
 *
 * Complementa al de RLS (`rls-pedido.test.ts`): aquel cubre QUIÉN ve qué; este
 * cubre que la MÁQUINA DE ESTADOS y los TRIGGERS de la base funcionen de punta
 * a punta — la clase de cosa donde vivieron los bugs 6 (trigger de caja sin
 * SECURITY DEFINER) y la lógica de transiciones.
 *
 * Estrategia: una sesión del NEGOCIO (que tiene ALL sobre sus pedidos) crea un
 * pedido fresco, lo conduce por todo el flujo feliz y verifica:
 *   - el trigger `generar_numero_pedido` asigna número,
 *   - el trigger `log_pedido_estado` registra cada cambio en `pedido_estados`,
 *   - el trigger `ingreso_pedido_entregado` crea el ingreso en `movimientos_caja`.
 * Al terminar borra todo lo que creó (idempotente: se puede correr N veces).
 *
 * NOTA: este test ejercita la persistencia y los triggers a nivel de DATOS, no
 * la validación de transiciones del server action (`esTransicionValida`), que
 * vive en la capa de aplicación y está cubierta por los tests unitarios. La DB
 * no tiene constraint de transición; el único camino de escritura de la app es
 * el server action, que sí valida.
 *
 * Variables de entorno requeridas (en web/.env.test.local):
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   TEST_NEGOCIO_EMAIL      propietario de un prestador con delivery (p.ej. Chiofi)
 *   TEST_NEGOCIO_PASSWORD
 *
 * Ejemplo:
 *   TEST_NEGOCIO_EMAIL=eventizalo@gmail.com
 *   TEST_NEGOCIO_PASSWORD=f11d1c95
 */

const env = process.env;
const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "TEST_NEGOCIO_EMAIL",
  "TEST_NEGOCIO_PASSWORD",
] as const;

const faltantes = REQUIRED.filter((k) => !env[k]);
const habilitado = faltantes.length === 0;

async function clienteAutenticado(email: string, password: string): Promise<SupabaseClient> {
  const sb = createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login falló para ${email}: ${error.message}`);
  return sb;
}

describe.skipIf(!habilitado)("Ciclo de vida del pedido — máquina de estados + triggers", () => {
  if (!habilitado) {
    console.warn(`[ciclo-vida] SKIP — faltan env vars: ${faltantes.join(", ")}`);
  }

  let negocio: SupabaseClient;
  let prestadorId: string;
  let puebloId: number;
  let modo: string;
  let platoId: string;
  let pedidoId: string;

  beforeAll(async () => {
    negocio = await clienteAutenticado(env.TEST_NEGOCIO_EMAIL!, env.TEST_NEGOCIO_PASSWORD!);
    const { data: { user } } = await negocio.auth.getUser();
    const { data: prestador, error } = await negocio
      .from("prestadores")
      .select("id, pueblo_id, delivery_modo")
      .eq("propietario_id", user!.id)
      .limit(1)
      .single();
    if (error || !prestador) throw new Error(`No se encontró prestador del negocio: ${error?.message}`);
    prestadorId = prestador.id;
    puebloId    = prestador.pueblo_id;
    modo        = prestador.delivery_modo ?? "plataforma";

    // Un plato real de la carta: `pedido_items` exige plato_id o servicio_id
    // (constraint item_debe_tener_origen).
    const { data: plato } = await negocio
      .from("platos").select("id").eq("prestador_id", prestadorId).limit(1).single();
    if (!plato) throw new Error("El negocio de prueba no tiene platos en su carta.");
    platoId = plato.id;
  });

  afterAll(async () => {
    if (!pedidoId || !negocio) return;
    // El FK caja→pedido es ON DELETE SET NULL, así que borramos el movimiento
    // primero (mientras conserva el pedido_delivery_id), luego el pedido (que
    // cascadea items y estados).
    await negocio.from("movimientos_caja").delete().eq("pedido_delivery_id", pedidoId);
    await negocio.from("pedidos_delivery").delete().eq("id", pedidoId);
  });

  it("crea un pedido: el trigger asigna número y registra el estado inicial", async () => {
    const { data, error } = await negocio
      .from("pedidos_delivery")
      .insert({
        pueblo_id:           puebloId,
        prestador_id:        prestadorId,
        delivery_modo:       modo,
        nombre_cliente:      "Test Ciclo Vida",
        telefono_cliente:    "600000000",
        direccion:           "Calle de Prueba 1, Alcossebre",
        latitud:             40.2400,
        longitud:            0.2700,
        subtotal:            18.0,
        coste_envio:         2.0,
        total:               20.0,
        comision_porcentaje: 0,
        comision_importe:    0,
        metodo_pago:         "efectivo",
        distancia_km:        1.5,
        preparacion_min:     15,
        trayecto_min:        5,
        eta_minutos:         20,
      })
      .select()
      .single();

    expect(error, error?.message).toBeNull();
    expect(data).not.toBeNull();
    pedidoId = data!.id;

    expect(data!.numero_pedido).toMatch(/^PED-\d{4}-\d{6}$/);
    expect(data!.estado).toBe("pendiente_pago");

    const { data: estados } = await negocio
      .from("pedido_estados").select("estado").eq("pedido_id", pedidoId);
    expect((estados ?? []).map((e) => e.estado)).toContain("pendiente_pago");

    // 1 item, para que el pedido sea realista y el de RLS tenga datos análogos.
    const { error: errItem } = await negocio.from("pedido_items").insert({
      pedido_id:       pedidoId,
      plato_id:        platoId,
      nombre:          "Hamburguesa de Prueba",
      cantidad:        2,
      precio_unitario: 9.0,
      subtotal:        18.0,
    });
    expect(errItem, errItem?.message).toBeNull();
  });

  it("recorre el flujo feliz y cada transición queda en el historial", async () => {
    const flujo = ["aceptado", "preparando", "listo", "en_camino", "entregado"] as const;
    for (const estado of flujo) {
      const { error } = await negocio
        .from("pedidos_delivery")
        .update({ estado })
        .eq("id", pedidoId)
        .eq("prestador_id", prestadorId);
      expect(error, `update a ${estado}: ${error?.message}`).toBeNull();
    }

    const { data: estados } = await negocio
      .from("pedido_estados").select("estado").eq("pedido_id", pedidoId);
    const registrados = (estados ?? []).map((e) => e.estado);
    // El historial debe contener el estado inicial + las 5 transiciones.
    for (const estado of ["pendiente_pago", ...flujo]) {
      expect(registrados, `falta ${estado} en el historial`).toContain(estado);
    }
  });

  it("al entregar, el trigger crea el ingreso automático en la caja del negocio", async () => {
    const { data: movs, error } = await negocio
      .from("movimientos_caja")
      .select("tipo, categoria, importe, pedido_delivery_id")
      .eq("pedido_delivery_id", pedidoId);

    expect(error, error?.message).toBeNull();
    expect((movs ?? []).length, "debería haber 1 ingreso por el pedido entregado").toBe(1);

    const mov = movs![0];
    expect(mov.tipo).toBe("ingreso");
    expect(mov.categoria).toBe("delivery");
    expect(Number(mov.importe)).toBeCloseTo(18.0, 2); // subtotal, sin envío
  });
});
