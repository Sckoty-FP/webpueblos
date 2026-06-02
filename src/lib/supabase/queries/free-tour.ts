import { createClient } from '@/lib/supabase/server';
import type {
  FreeTourDB,
  FreeTourSesionDB,
  FreeTourInscripcionDB,
  ComisionAcumuladaDB,
  EstadoInscripcionFreeTour,
} from '@/types/free-tour';

// ═══════════════════════════════════════════════════════════════════════════
// PANEL — Tours
// ═══════════════════════════════════════════════════════════════════════════

export async function getToursDelPrestador(prestadorId: string): Promise<FreeTourDB[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('free_tours')
    .select('*')
    .eq('prestador_id', prestadorId)
    .order('created_at', { ascending: false });
  return (data ?? []) as FreeTourDB[];
}

export async function crearTour(
  prestadorId: string,
  puebloId: number,
  data: {
    titulo: string;
    slug: string;
    descripcion: string;
    descripcion_corta?: string | null;
    idiomas?: string[];
    duracion_minutos?: number;
    distancia_km?: number | null;
    dificultad?: string;
    punto_encuentro_nombre?: string | null;
    punto_encuentro_lat?: number | null;
    punto_encuentro_lon?: number | null;
    punto_final_nombre?: string | null;
    imagen_portada_url?: string | null;
    incluye?: string[];
    llevar?: string[];
    observaciones?: string | null;
    cupo_maximo?: number;
  },
): Promise<FreeTourDB> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from('free_tours')
    .insert({ prestador_id: prestadorId, pueblo_id: puebloId, ...data })
    .select()
    .single();
  if (error) throw error;
  return result as FreeTourDB;
}

export async function actualizarTour(
  tourId: string,
  data: Partial<Omit<FreeTourDB, 'id' | 'prestador_id' | 'pueblo_id' | 'created_at' | 'updated_at'>>,
): Promise<FreeTourDB> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from('free_tours')
    .update(data)
    .eq('id', tourId)
    .select()
    .single();
  if (error) throw error;
  return result as FreeTourDB;
}

export async function toggleTourActivo(tourId: string, activo: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('free_tours')
    .update({ activo })
    .eq('id', tourId);
  if (error) throw error;
}

export async function activarFreeTour(prestadorId: string, activo: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('prestadores')
    .update({ free_tour_activo: activo })
    .eq('id', prestadorId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════════════
// PANEL — Sesiones
// ═══════════════════════════════════════════════════════════════════════════

export type SesionConTour = FreeTourSesionDB & {
  tour: Pick<FreeTourDB, 'titulo' | 'cupo_maximo'>;
};

export async function getSesionesDelPrestador(
  prestadorId: string,
  desde?: string,
  hasta?: string,
): Promise<SesionConTour[]> {
  const supabase = await createClient();
  let q = supabase
    .from('free_tour_sesiones')
    .select(`*, tour:free_tours!free_tour_sesiones_tour_id_fkey(titulo, cupo_maximo)`)
    .eq('prestador_id', prestadorId)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });
  if (desde) q = q.gte('fecha', desde);
  if (hasta) q = q.lte('fecha', hasta);
  const { data } = await q;
  return (data ?? []) as unknown as SesionConTour[];
}

export async function getSesionesDelTour(tourId: string): Promise<FreeTourSesionDB[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('free_tour_sesiones')
    .select('*')
    .eq('tour_id', tourId)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });
  return (data ?? []) as FreeTourSesionDB[];
}

export async function crearSesion(data: {
  tour_id: string;
  prestador_id: string;
  pueblo_id: number;
  fecha: string;
  hora: string;
  cupo_sesion: number;
}): Promise<FreeTourSesionDB> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from('free_tour_sesiones')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as FreeTourSesionDB;
}

export async function crearSesionesBulk(
  sesiones: Array<{
    tour_id: string;
    prestador_id: string;
    pueblo_id: number;
    fecha: string;
    hora: string;
    cupo_sesion: number;
  }>,
): Promise<FreeTourSesionDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('free_tour_sesiones')
    .insert(sesiones)
    .select();
  if (error) throw error;
  return (data ?? []) as FreeTourSesionDB[];
}

export async function cancelarSesion(sesionId: string, motivo?: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('free_tour_sesiones')
    .update({ cancelada: true, motivo_cancelacion: motivo ?? null })
    .eq('id', sesionId);
  if (error) throw error;
  // Cascade: cancelar inscripciones confirmadas de esta sesión
  await supabase
    .from('free_tour_inscripciones')
    .update({ estado: 'cancelada_guia' })
    .eq('sesion_id', sesionId)
    .eq('estado', 'confirmada');
}

// ═══════════════════════════════════════════════════════════════════════════
// PANEL — Inscripciones
// ═══════════════════════════════════════════════════════════════════════════

export type InscripcionConSesion = FreeTourInscripcionDB & {
  sesion: Pick<FreeTourSesionDB, 'fecha' | 'hora'> & {
    tour: Pick<FreeTourDB, 'titulo'>;
  };
};

export async function getInscripcionesDelPrestador(
  prestadorId: string,
  filtros?: { sesionId?: string; estado?: EstadoInscripcionFreeTour },
): Promise<InscripcionConSesion[]> {
  const supabase = await createClient();
  let q = supabase
    .from('free_tour_inscripciones')
    .select(`
      *,
      sesion:free_tour_sesiones!free_tour_inscripciones_sesion_id_fkey(
        fecha, hora,
        tour:free_tours!free_tour_sesiones_tour_id_fkey(titulo)
      )
    `)
    .eq('prestador_id', prestadorId)
    .order('created_at', { ascending: false });
  if (filtros?.sesionId) q = q.eq('sesion_id', filtros.sesionId);
  if (filtros?.estado) q = q.eq('estado', filtros.estado);
  const { data } = await q;
  return (data ?? []) as unknown as InscripcionConSesion[];
}

export async function actualizarEstadoInscripcion(
  inscripcionId: string,
  estado: EstadoInscripcionFreeTour,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('free_tour_inscripciones')
    .update({ estado })
    .eq('id', inscripcionId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════════════
// PANEL — Comisiones
// ═══════════════════════════════════════════════════════════════════════════

export async function getComisionesDelPrestador(prestadorId: string): Promise<{
  pendientes: ComisionAcumuladaDB[];
  totalPendiente: number;
  totalFacturado: number;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('comision_acumulada')
    .select('*')
    .eq('prestador_id', prestadorId)
    .eq('origen', 'free_tour')
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as ComisionAcumuladaDB[];
  const pendientes = rows.filter((r) => !r.facturado && r.importe > 0);
  const totalPendiente = pendientes.reduce((sum, r) => sum + r.importe, 0);
  const totalFacturado = rows
    .filter((r) => r.facturado)
    .reduce((sum, r) => sum + r.importe, 0);
  return { pendientes, totalPendiente, totalFacturado };
}

// ═══════════════════════════════════════════════════════════════════════════
// PÚBLICO — Listado y detalle
// ═══════════════════════════════════════════════════════════════════════════

export type TourConProximasSesiones = FreeTourDB & {
  proximas_sesiones: FreeTourSesionDB[];
};

export async function getToursPublicosPorPueblo(
  puebloId: number,
): Promise<TourConProximasSesiones[]> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().split('T')[0];
  const { data: tours } = await supabase
    .from('free_tours')
    .select('*')
    .eq('pueblo_id', puebloId)
    .eq('activo', true)
    .order('created_at', { ascending: false });
  if (!tours?.length) return [];

  const tourIds = tours.map((t) => t.id);
  const { data: sesiones } = await supabase
    .from('free_tour_sesiones')
    .select('*')
    .in('tour_id', tourIds)
    .eq('cancelada', false)
    .gte('fecha', hoy)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });

  const sesionesPorTour: Record<string, FreeTourSesionDB[]> = {};
  for (const s of sesiones ?? []) {
    if (!sesionesPorTour[s.tour_id]) sesionesPorTour[s.tour_id] = [];
    sesionesPorTour[s.tour_id].push(s as FreeTourSesionDB);
  }

  return tours.map((t) => ({
    ...(t as FreeTourDB),
    proximas_sesiones: (sesionesPorTour[t.id] ?? []).slice(0, 3),
  }));
}

export async function getTourPublicoPorSlug(
  slug: string,
  puebloId: number,
): Promise<FreeTourDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('free_tours')
    .select('*')
    .eq('slug', slug)
    .eq('pueblo_id', puebloId)
    .eq('activo', true)
    .maybeSingle();
  return (data ?? null) as FreeTourDB | null;
}

export async function getSesionesDisponibles(tourId: string): Promise<FreeTourSesionDB[]> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('free_tour_sesiones')
    .select('*')
    .eq('tour_id', tourId)
    .eq('cancelada', false)
    .gte('fecha', hoy)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true });
  return (data ?? []) as FreeTourSesionDB[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PÚBLICO — Inscripción
// ═══════════════════════════════════════════════════════════════════════════

export async function crearInscripcionPublica(data: {
  sesion_id: string;
  tour_id: string;
  prestador_id: string;
  cliente_id?: string | null;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string | null;
  num_personas: number;
  notas?: string | null;
}): Promise<FreeTourInscripcionDB> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from('free_tour_inscripciones')
    .insert({ ...data, numero: '' })
    .select()
    .single();
  if (error) throw error;
  return result as FreeTourInscripcionDB;
}
