import { createClient } from "@/lib/supabase/server";
import type { RecursoActividadDB, EstadoRecurso, TipoRecurso } from "@/types/actividades";

// ─── Lectura ──────────────────────────────────────────────────────────────────

export async function getRecursosDelPrestador(
  prestadorId: string,
): Promise<RecursoActividadDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("actividades_recursos")
    .select("*")
    .eq("prestador_id", prestadorId)
    .order("tipo")
    .order("orden")
    .order("nombre");
  if (error) throw error;
  return (data ?? []) as RecursoActividadDB[];
}

export async function getRecursosActivos(
  prestadorId: string,
  servicioId?: string,
): Promise<RecursoActividadDB[]> {
  const supabase = await createClient();
  let q = supabase
    .from("actividades_recursos")
    .select("*")
    .eq("prestador_id", prestadorId)
    .eq("activo", true)
    .order("tipo")
    .order("orden")
    .order("nombre");
  if (servicioId) q = q.eq("servicio_id", servicioId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RecursoActividadDB[];
}

/**
 * Retorna los recursos disponibles para la franja dada.
 * Excluye recursos que ya tienen una reserva confirmada/pendiente solapando.
 */
export async function getRecursosDisponibles(params: {
  prestadorId:    string;
  servicioId?:    string;
  fecha:          string;    // YYYY-MM-DD
  horaInicio:     string;    // HH:MM
  duracionHoras:  number;
}): Promise<RecursoActividadDB[]> {
  const supabase = await createClient();

  const activos = await getRecursosActivos(params.prestadorId, params.servicioId);
  const disponibles = activos.filter(r => r.estado === 'disponible');
  if (disponibles.length === 0) return [];

  const [h, m] = params.horaInicio.split(":").map(Number);
  const startMin = h * 60 + m;
  const endMin   = startMin + Math.round(params.duracionHoras * 60);

  const recursoIds = disponibles.map(r => r.id);

  const { data: reservas } = await supabase
    .from("reservas")
    .select("recurso_id, hora, duracion_minutos")
    .eq("fecha", params.fecha)
    .in("estado", ["pendiente", "confirmada"])
    .in("recurso_id", recursoIds);

  const ocupados = new Set<string>();
  for (const r of reservas ?? []) {
    if (!r.recurso_id) continue;
    const [rH, rM] = (r.hora as string).split(":").map(Number);
    const rStart = rH * 60 + rM;
    const rEnd   = rStart + (r.duracion_minutos || 60);
    if (startMin < rEnd && endMin > rStart) ocupados.add(r.recurso_id);
  }

  return disponibles.filter(r => !ocupados.has(r.id));
}

// ─── Escritura ────────────────────────────────────────────────────────────────

export async function crearRecurso(data: {
  prestador_id:    string;
  tipo:            TipoRecurso;
  nombre:          string;
  identificador?:  string;
  capacidad?:      number;
  precio_hora?:    number;
  precio_dia?:     number;
  caracteristicas?: Record<string, string>;
  estado?:         EstadoRecurso;
  servicio_id?:    string;
}): Promise<RecursoActividadDB> {
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("actividades_recursos")
    .insert({
      prestador_id:    data.prestador_id,
      tipo:            data.tipo,
      nombre:          data.nombre,
      identificador:   data.identificador  ?? null,
      capacidad:       data.capacidad      ?? 1,
      precio_hora:     data.precio_hora    ?? null,
      precio_dia:      data.precio_dia     ?? null,
      caracteristicas: data.caracteristicas ?? {},
      estado:          data.estado         ?? 'disponible',
      servicio_id:     data.servicio_id    ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return created as RecursoActividadDB;
}

export async function actualizarRecurso(
  id:   string,
  data: Partial<{
    tipo:            TipoRecurso;
    nombre:          string;
    identificador:   string;
    capacidad:       number;
    precio_hora:     number;
    precio_dia:      number;
    caracteristicas: Record<string, string>;
    estado:          EstadoRecurso;
    servicio_id:     string;
    orden:           number;
  }>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("actividades_recursos")
    .update(data)
    .eq("id", id);
  if (error) throw error;
}

export async function toggleRecursoActivo(
  id:     string,
  activo: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("actividades_recursos")
    .update({ activo })
    .eq("id", id);
  if (error) throw error;
}

export async function cambiarEstadoRecurso(
  id:     string,
  estado: EstadoRecurso,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("actividades_recursos")
    .update({ estado })
    .eq("id", id);
  if (error) throw error;
}
