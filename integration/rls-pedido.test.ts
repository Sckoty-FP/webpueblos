import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Test de INTEGRACIÓN de RLS contra una base de datos Supabase real.
 *
 * Es la red de seguridad definitiva del refactor 038: comprueba, con sesiones
 * autenticadas reales (no mocks), que la visibilidad de un pedido y sus tablas
 * hijas (pedido_items, pedido_estados) es correcta por rol.
 *
 * NO corre con `pnpm test:unit` (vive fuera de src/__tests__). Se ejecuta con
 * `pnpm test:integration` y SOLO si están definidas las variables de entorno
 * de abajo; si falta alguna, la suite se salta (skip) en lugar de fallar, para
 * no bloquear CI en entornos sin credenciales.
 *
 * Variables de entorno requeridas (en web/.env.test.local o el entorno):
 *   SUPABASE_URL                 URL del proyecto Supabase
 *   SUPABASE_ANON_KEY            anon key (las sesiones de usuario respetan RLS)
 *   TEST_REPARTIDOR_EMAIL        repartidor ASIGNADO al pedido de prueba
 *   TEST_REPARTIDOR_PASSWORD
 *   TEST_PEDIDO_ID               uuid de un pedido asignado a ese repartidor,
 *                                con al menos 1 item y 1 fila de historial
 *   TEST_AJENO_EMAIL             usuario NO relacionado con el pedido
 *   TEST_AJENO_PASSWORD
 *
 * Ejemplo (datos de prueba ya existentes en el proyecto):
 *   TEST_REPARTIDOR_EMAIL=belzamar@gmail.com
 *   TEST_REPARTIDOR_PASSWORD=pueblo2026
 *   TEST_PEDIDO_ID=0e0a9eb8-86a0-4a11-95e8-4182de07755c   # PED-2026-000012
 *   TEST_AJENO_EMAIL=marina3.delivery@pueblo.app
 *   TEST_AJENO_PASSWORD=pueblo2026
 */

const env = process.env;
const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "TEST_REPARTIDOR_EMAIL",
  "TEST_REPARTIDOR_PASSWORD",
  "TEST_PEDIDO_ID",
  "TEST_AJENO_EMAIL",
  "TEST_AJENO_PASSWORD",
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

describe.skipIf(!habilitado)("RLS integración — visibilidad del pedido por rol", () => {
  if (!habilitado) {
    // Mensaje visible al correr la suite sin configurar.
    console.warn(`[rls-integracion] SKIP — faltan env vars: ${faltantes.join(", ")}`);
  }

  const pedidoId = env.TEST_PEDIDO_ID!;
  let repartidor: SupabaseClient;
  let ajeno: SupabaseClient;

  beforeAll(async () => {
    repartidor = await clienteAutenticado(env.TEST_REPARTIDOR_EMAIL!, env.TEST_REPARTIDOR_PASSWORD!);
    ajeno      = await clienteAutenticado(env.TEST_AJENO_EMAIL!, env.TEST_AJENO_PASSWORD!);
  });

  // ── El repartidor asignado SÍ ve todo el pedido ──────────────────────────
  it("el repartidor asignado lee la cabecera del pedido", async () => {
    const { data } = await repartidor.from("pedidos_delivery").select("*").eq("id", pedidoId).maybeSingle();
    expect(data, "el repartidor debería ver la cabecera de su pedido").not.toBeNull();
  });

  it("el repartidor asignado lee los items del pedido (bug 11 / refactor 038)", async () => {
    const { data } = await repartidor.from("pedido_items").select("*").eq("pedido_id", pedidoId);
    expect((data ?? []).length, "el repartidor debería ver los items").toBeGreaterThan(0);
  });

  it("el repartidor asignado lee el historial de estados (bug latente / refactor 038)", async () => {
    const { data } = await repartidor.from("pedido_estados").select("*").eq("pedido_id", pedidoId);
    expect((data ?? []).length, "el repartidor debería ver el historial").toBeGreaterThan(0);
  });

  // ── Un usuario ajeno NO ve nada del pedido ───────────────────────────────
  it("un usuario ajeno NO ve la cabecera del pedido", async () => {
    const { data } = await ajeno.from("pedidos_delivery").select("*").eq("id", pedidoId).maybeSingle();
    expect(data, "un ajeno no debería ver el pedido").toBeNull();
  });

  it("un usuario ajeno NO ve los items (RLS devuelve vacío, no error)", async () => {
    const { data } = await ajeno.from("pedido_items").select("*").eq("pedido_id", pedidoId);
    expect((data ?? []).length, "un ajeno no debería ver items").toBe(0);
  });

  it("un usuario ajeno NO ve el historial de estados", async () => {
    const { data } = await ajeno.from("pedido_estados").select("*").eq("pedido_id", pedidoId);
    expect((data ?? []).length, "un ajeno no debería ver el historial").toBe(0);
  });
});
