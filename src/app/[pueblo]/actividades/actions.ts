"use server";

import { createClient } from "@/lib/supabase/server";
import { getRecursosDisponibles } from "@/lib/supabase/queries/actividades";
import type { RecursoActividadDB } from "@/types/actividades";

type ReservaResult =
  | { ok: true }
  | { ok: false; needsLogin: true }
  | { ok: false; needsLogin?: false; error: string };

export async function crearReservaActividad(formData: FormData): Promise<ReservaResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, needsLogin: true };

  const prestadorId = formData.get("prestador_id") as string;
  const servicioId = formData.get("servicio_id") as string;
  const recursoId = (formData.get("recurso_id") as string) || null;
  const fecha = formData.get("fecha") as string;
  const hora = formData.get("hora") as string;
  const duracionHoras = parseInt(formData.get("duracion_horas") as string) || 1;
  const nombreCliente = ((formData.get("nombre_cliente") as string) || "").trim();
  const telefonoCliente = ((formData.get("telefono_cliente") as string) || "").trim();

  // servicio_id es NOT NULL en `reservas` (mig 004): sin él el insert falla.
  if (!prestadorId || !servicioId || !fecha || !hora) {
    return { ok: false, error: "Faltan datos obligatorios." };
  }
  if (!nombreCliente || !telefonoCliente) {
    return { ok: false, error: "Indicá tu nombre y un teléfono de contacto." };
  }

  // `reservas` exige varias columnas NOT NULL que no vienen del cliente
  // (pueblo_id, contacto, precios). Las resolvemos trusted desde la DB:
  // pueblo_id del prestador y el precio del recurso elegido (precio_hora × horas).
  const [{ data: prestador }, { data: recurso }] = await Promise.all([
    supabase.from("prestadores").select("pueblo_id").eq("id", prestadorId).single(),
    recursoId
      ? supabase.from("actividades_recursos").select("precio_hora").eq("id", recursoId).single()
      : Promise.resolve({ data: null as { precio_hora: number | null } | null }),
  ]);

  if (!prestador) {
    return { ok: false, error: "No encontramos la actividad." };
  }

  const precioBase = Number(recurso?.precio_hora ?? 0) * duracionHoras;

  const { error } = await supabase.from("reservas").insert({
    pueblo_id: prestador.pueblo_id,
    usuario_id: user.id,
    prestador_id: prestadorId,
    servicio_id: servicioId,
    recurso_id: recursoId,
    fecha,
    hora,
    duracion_minutos: duracionHoras * 60,
    num_personas: 1,
    estado: "pendiente",
    nombre_cliente: nombreCliente,
    email_cliente: user.email ?? "",
    telefono_cliente: telefonoCliente,
    precio_base: precioBase,
    precio_final: precioBase,
    // numero_reserva lo genera el trigger generar_numero_reserva (SECURITY DEFINER, mig 047).
  });

  if (error) {
    console.error("[crearReservaActividad]", error);
    return { ok: false, error: "No se pudo crear la reserva. Intentá de nuevo." };
  }

  return { ok: true };
}

export async function getRecursosDisponiblesAction(params: {
  prestadorId: string;
  servicioId?: string;
  fecha: string;
  horaInicio: string;
  duracionHoras: number;
}): Promise<RecursoActividadDB[]> {
  return getRecursosDisponibles(params);
}
