import { createClient } from "@/lib/supabase/server";
import type { ProfesionalDB, ProfesionalConServiciosDB } from "@/types/profesionales";

// ─── Lectura ──────────────────────────────────────────────────────────────────

export async function getProfesionalesDelPrestador(
  prestadorId: string,
): Promise<ProfesionalConServiciosDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profesionales")
    .select(`
      *,
      servicio_profesionales(
        servicios(id, nombre, duracion_minutos, precio_desde)
      )
    `, { count: "exact" })
    .eq("prestador_id", prestadorId)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProfesionalConServiciosDB[];
}

export async function getProfesionalesPublicos(
  prestadorId: string,
): Promise<ProfesionalDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profesionales")
    .select("*")
    .eq("prestador_id", prestadorId)
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProfesionalDB[];
}

/** Para el calendario: trae solo los activos con id, nombre, color. */
export async function getProfesionalesActivos(
  prestadorId: string,
): Promise<Pick<ProfesionalDB, "id" | "nombre" | "apellidos" | "color" | "foto_url">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profesionales")
    .select("id, nombre, apellidos, color, foto_url")
    .eq("prestador_id", prestadorId)
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ─── Escritura ────────────────────────────────────────────────────────────────

export async function crearProfesional(
  data: Pick<ProfesionalDB, "prestador_id" | "nombre" | "apellidos" | "especialidad" | "bio" | "color" | "foto_url">,
): Promise<ProfesionalDB> {
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("profesionales")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return created as ProfesionalDB;
}

export async function actualizarProfesional(
  id: string,
  updates: Partial<Pick<ProfesionalDB, "nombre" | "apellidos" | "especialidad" | "bio" | "color" | "foto_url" | "orden">>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profesionales")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function toggleProfesionalActivo(
  id: string,
  activo: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profesionales")
    .update({ activo })
    .eq("id", id);

  if (error) throw error;
}

// ─── Servicios asignados ──────────────────────────────────────────────────────

export async function asignarServiciosAProfesional(
  profesionalId: string,
  servicioIds: string[],
): Promise<void> {
  const supabase = await createClient();
  // Borrar asignaciones previas y reinsertar
  const { error: delError } = await supabase
    .from("servicio_profesionales")
    .delete()
    .eq("profesional_id", profesionalId);
  if (delError) throw delError;

  if (servicioIds.length === 0) return;

  const { error: insError } = await supabase
    .from("servicio_profesionales")
    .insert(servicioIds.map((sid) => ({ servicio_id: sid, profesional_id: profesionalId })));
  if (insError) throw insError;
}

export async function getProfesionalesDeServicio(
  servicioId: string,
): Promise<ProfesionalDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicio_profesionales")
    .select("profesionales(*)")
    .eq("servicio_id", servicioId);

  if (error) throw error;
  return (data ?? []).map((r) => (r as unknown as { profesionales: ProfesionalDB }).profesionales);
}
