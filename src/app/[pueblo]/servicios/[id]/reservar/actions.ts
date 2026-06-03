"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Resultado de intentar crear una reserva de servicio.
 * `needsLogin` separa el caso "no hay sesión" del error genérico, igual que en
 * el flujo de actividades (`crearReservaActividad`), para que el cliente decida
 * si redirige a login o muestra un mensaje.
 */
type ReservaResult =
  | { ok: true }
  | { ok: false; needsLogin: true }
  | { ok: false; needsLogin?: false; error: string };

/**
 * Crea una reserva pública de un servicio (peluquería, estética, hospedaje…).
 *
 * La reserva nace en estado `pendiente`: el negocio la confirma o rechaza desde
 * `/panel/reservas`. No hay validación de solapamiento aquí (el público no elige
 * profesional/recurso; el negocio resuelve conflictos al confirmar).
 *
 * `reservas` tiene varias columnas NOT NULL (ver migración 004): además de
 * usuario/prestador/servicio/fecha/hora, exige `pueblo_id`, datos de contacto del
 * cliente y precios. Los que NO vienen del cliente los resolvemos server-side y
 * trusted: `pueblo_id` y el precio se leen de la DB (no se confían al formulario);
 * el email sale de la sesión; `numero_reserva` lo genera un trigger.
 */
export async function crearReservaServicio(formData: FormData): Promise<ReservaResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, needsLogin: true };

  const prestadorId = formData.get("prestador_id") as string;
  const servicioId = formData.get("servicio_id") as string;
  const fecha = formData.get("fecha") as string;
  const hora = formData.get("hora") as string;
  const duracionMinutos = parseInt(formData.get("duracion_minutos") as string) || 30;
  const personas = parseInt(formData.get("num_personas") as string) || 1;
  const nombreCliente = ((formData.get("nombre_cliente") as string) || "").trim();
  const telefonoCliente = ((formData.get("telefono_cliente") as string) || "").trim();

  if (!prestadorId || !servicioId || !fecha || !hora) {
    return { ok: false, error: "Faltan datos obligatorios." };
  }
  if (!nombreCliente || !telefonoCliente) {
    return { ok: false, error: "Indicá tu nombre y un teléfono de contacto." };
  }

  // Datos trusted desde la DB (no se confían al formulario):
  // pueblo_id del prestador y precio base del servicio.
  const [{ data: prestador }, { data: servicio }] = await Promise.all([
    supabase.from("prestadores").select("pueblo_id").eq("id", prestadorId).single(),
    supabase.from("servicios").select("precio_desde").eq("id", servicioId).single(),
  ]);

  if (!prestador) {
    return { ok: false, error: "No encontramos el negocio." };
  }

  const precioBase = Number(servicio?.precio_desde ?? 0);

  const { error } = await supabase.from("reservas").insert({
    pueblo_id: prestador.pueblo_id,
    usuario_id: user.id,
    prestador_id: prestadorId,
    servicio_id: servicioId,
    fecha,
    hora,
    duracion_minutos: duracionMinutos,
    num_personas: personas,
    estado: "pendiente",
    nombre_cliente: nombreCliente,
    email_cliente: user.email ?? "",
    telefono_cliente: telefonoCliente,
    precio_base: precioBase,
    precio_final: precioBase, // sin descuento Premium en la reserva pública (fase 1)
    // numero_reserva lo genera el trigger generar_numero_reserva.
  });

  if (error) {
    console.error("[crearReservaServicio]", error);
    return { ok: false, error: "No se pudo crear la reserva. Intentá de nuevo." };
  }

  return { ok: true };
}
