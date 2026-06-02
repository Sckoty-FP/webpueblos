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
  const servicioId = formData.get("servicio_id") as string | null;
  const recursoId = formData.get("recurso_id") as string | null;
  const fecha = formData.get("fecha") as string;
  const hora = formData.get("hora") as string;
  const duracionHoras = parseInt(formData.get("duracion_horas") as string) || 1;

  if (!prestadorId || !fecha || !hora) {
    return { ok: false, error: "Faltan datos obligatorios." };
  }

  const { error } = await supabase.from("reservas").insert({
    usuario_id: user.id,
    prestador_id: prestadorId,
    servicio_id: servicioId || null,
    recurso_id: recursoId || null,
    fecha,
    hora,
    duracion_minutos: duracionHoras * 60,
    num_personas: 1,
    estado: "pendiente",
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
