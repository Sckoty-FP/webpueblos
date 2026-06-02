import { createClient } from '@/lib/supabase/server';
import type {
  DeliveryConfigDB,
  DeliveryHorarioDB,
  PedidoDeliveryDB,
  PedidoItemDB,
  PedidoEstadoDB,
  PedidoConItems,
  RepartidorDB,
  RepartidorUbicacionDB,
  EstadoPedidoDelivery,
  ModoDelivery,
} from '@/types/delivery';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG DE DELIVERY
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna la config de delivery de un prestador, o null si no la ha configurado. */
export async function getDeliveryConfig(
  prestadorId: string,
): Promise<DeliveryConfigDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('delivery_config')
    .select('*')
    .eq('prestador_id', prestadorId)
    .maybeSingle();
  return (data ?? null) as DeliveryConfigDB | null;
}

/**
 * Crea o actualiza la config de delivery de un prestador.
 * Se llama al guardar el formulario en /panel/delivery/config.
 */
export async function upsertDeliveryConfig(
  prestadorId: string,
  config: Partial<Omit<DeliveryConfigDB, 'prestador_id' | 'created_at' | 'updated_at'>>,
): Promise<DeliveryConfigDB> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('delivery_config')
    .upsert({ prestador_id: prestadorId, ...config }, { onConflict: 'prestador_id' })
    .select()
    .single();
  if (error) throw error;
  return data as DeliveryConfigDB;
}

/**
 * Activa o desactiva el delivery en la tabla prestadores.
 * También actualiza el modo (plataforma | propio | desactivado).
 */
export async function setDeliveryActivo(
  prestadorId:   string,
  activo:        boolean,
  modo:          ModoDelivery,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('prestadores')
    .update({ delivery_activo: activo, delivery_modo: modo })
    .eq('id', prestadorId);
  if (error) throw error;
}

// ─── Horarios ─────────────────────────────────────────────────────────────

/** Devuelve los horarios de delivery ordenados por día de la semana. */
export async function getDeliveryHorarios(
  prestadorId: string,
): Promise<DeliveryHorarioDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('delivery_horarios')
    .select('*')
    .eq('prestador_id', prestadorId)
    .order('dia_semana');
  if (error) throw error;
  return (data ?? []) as DeliveryHorarioDB[];
}

/**
 * Reemplaza todos los horarios de delivery de un prestador.
 * Estrategia delete + insert: más simple que upsert con constraint compuesta.
 */
export async function setDeliveryHorarios(
  prestadorId: string,
  horarios:    { dia_semana: number; hora_apertura: string; hora_cierre: string }[],
): Promise<void> {
  const supabase = await createClient();

  const { error: errDel } = await supabase
    .from('delivery_horarios')
    .delete()
    .eq('prestador_id', prestadorId);
  if (errDel) throw errDel;

  if (horarios.length === 0) return;

  const { error: errIns } = await supabase
    .from('delivery_horarios')
    .insert(horarios.map((h) => ({ ...h, prestador_id: prestadorId })));
  if (errIns) throw errIns;
}

// ═══════════════════════════════════════════════════════════════════════════
// PEDIDOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lista pedidos de un prestador, opcionalmente filtrados por estado.
 * Ordenados del más reciente al más antiguo.
 */
export async function getPedidosDelPrestador(
  prestadorId: string,
  estado?:     EstadoPedidoDelivery,
): Promise<PedidoDeliveryDB[]> {
  const supabase = await createClient();
  let q = supabase
    .from('pedidos_delivery')
    .select('*')
    .eq('prestador_id', prestadorId)
    .order('created_at', { ascending: false });

  if (estado) q = q.eq('estado', estado);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PedidoDeliveryDB[];
}

/** Retorna un pedido por su UUID, o null si no existe / no hay acceso. */
export async function getPedido(id: string): Promise<PedidoDeliveryDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pedidos_delivery')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data ?? null) as PedidoDeliveryDB | null;
}

/**
 * Retorna un pedido por su número (PED-2026-000123).
 * Usado en la página pública de seguimiento /[pueblo]/delivery/pedido/[numero].
 */
export async function getPedidoPorNumero(
  numeroPedido: string,
): Promise<PedidoDeliveryDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pedidos_delivery')
    .select('*')
    .eq('numero_pedido', numeroPedido)
    .maybeSingle();
  return (data ?? null) as PedidoDeliveryDB | null;
}

/** Retorna el pedido con sus items. Útil para el panel del negocio y la vista de repartidor. */
export async function getPedidoConItems(id: string): Promise<PedidoConItems | null> {
  const supabase = await createClient();
  const [pedRes, itemsRes] = await Promise.all([
    supabase.from('pedidos_delivery').select('*').eq('id', id).maybeSingle(),
    supabase.from('pedido_items').select('*').eq('pedido_id', id).order('nombre'),
  ]);

  if (pedRes.error || !pedRes.data) return null;
  return {
    ...(pedRes.data as PedidoDeliveryDB),
    items: (itemsRes.data ?? []) as PedidoItemDB[],
  };
}

/**
 * Crea un pedido completo (cabecera + items) en dos pasos secuenciales.
 *
 * El número de pedido lo genera el trigger `generar_numero_pedido` en la DB.
 * El estado inicial siempre es 'pendiente_pago' — la DB lo ignora si se pasa otro.
 *
 * No es una transacción real (Supabase JS no expone BEGIN/COMMIT).
 * Si el insert de items falla, el pedido queda huérfano — aceptable para MVP,
 * ya que el panel del negocio puede ver y cancelar pedidos sin items.
 */
export async function crearPedido(
  pedido: Omit<
    PedidoDeliveryDB,
    | 'id'
    | 'numero_pedido'
    | 'estado'
    | 'created_at'
    | 'updated_at'
    | 'aceptado_en'
    | 'listo_en'
    | 'en_camino_en'
    | 'entregado_en'
    | 'cancelado_en'
  >,
  items: Omit<PedidoItemDB, 'id' | 'pedido_id'>[],
): Promise<PedidoDeliveryDB> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pedidos_delivery')
    .insert({
      ...pedido,
      numero_pedido: '',         // el trigger lo reemplaza antes del insert
      estado:        'pendiente_pago' as EstadoPedidoDelivery,
    })
    .select()
    .single();

  if (error) throw error;
  const creado = data as PedidoDeliveryDB;

  if (items.length > 0) {
    const { error: errItems } = await supabase
      .from('pedido_items')
      .insert(items.map((i) => ({ ...i, pedido_id: creado.id })));
    if (errItems) throw errItems;
  }

  return creado;
}

/**
 * Cambia el estado de un pedido.
 * Si se cancela o rechaza, se puede pasar una observación (motivo_cancelacion).
 */
export async function cambiarEstadoPedido(
  pedidoId:    string,
  nuevoEstado: EstadoPedidoDelivery,
  observacion?: string,
): Promise<PedidoDeliveryDB> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { estado: nuevoEstado };

  if (observacion && (nuevoEstado === 'cancelado' || nuevoEstado === 'rechazado')) {
    updates.motivo_cancelacion = observacion;
  }

  const { data, error } = await supabase
    .from('pedidos_delivery')
    .update(updates)
    .eq('id', pedidoId)
    .select()
    .single();

  if (error) throw error;
  return data as PedidoDeliveryDB;
}

/**
 * Asigna un repartidor a un pedido usando compare-and-set.
 *
 * Solo actualiza si `repartidor_id IS NULL` — evita asignar dos veces
 * si dos miembros del equipo pulsan "Asignar" simultáneamente.
 *
 * Lanza si el update afecta 0 filas (pedido ya asignado por otro usuario).
 */
export async function asignarRepartidor(
  pedidoId:     string,
  repartidorId: string,
): Promise<PedidoDeliveryDB> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pedidos_delivery')
    .update({ repartidor_id: repartidorId })
    .eq('id', pedidoId)
    .is('repartidor_id', null)   // compare-and-set: solo si aún no tiene repartidor
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('El pedido ya fue asignado a otro repartidor. Recarga el panel.');
  }

  return data as PedidoDeliveryDB;
}

/** Devuelve el historial completo de cambios de estado de un pedido (del más antiguo al más nuevo). */
export async function getPedidoHistorial(pedidoId: string): Promise<PedidoEstadoDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pedido_estados')
    .select('*')
    .eq('pedido_id', pedidoId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PedidoEstadoDB[];
}

/** Pedidos activos de un repartidor (estados que todavía necesitan acción). */
export async function getPedidosActivosRepartidor(
  repartidorId: string,
): Promise<PedidoDeliveryDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pedidos_delivery')
    .select('*')
    .eq('repartidor_id', repartidorId)
    .in('estado', ['aceptado', 'preparando', 'listo', 'en_camino'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PedidoDeliveryDB[];
}

// ═══════════════════════════════════════════════════════════════════════════
// REPARTIDORES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lista repartidores disponibles (activo=true, en_turno=true) en un pueblo.
 * Incluye datos del usuario (nombre, email) para mostrar en el modal de asignación.
 * Ordenados por rating_promedio descendente (el mejor primero).
 */
export async function getRepartidoresDisponibles(
  puebloId: number,
): Promise<RepartidorDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('repartidores')
    .select('*, usuario:usuarios!repartidores_usuario_id_fkey(nombre, email)')
    .eq('pueblo_id', puebloId)
    .eq('activo', true)
    .eq('en_turno', true)
    .order('rating_promedio', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RepartidorDB[];
}

/** Retorna el perfil de repartidor asociado a un usuario, o null si no existe. */
export async function getRepartidorDelUsuario(
  usuarioId: string,
): Promise<RepartidorDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('repartidores')
    .select('*, usuario:usuarios!repartidores_usuario_id_fkey(nombre, email)')
    .eq('usuario_id', usuarioId)
    .maybeSingle();
  return (data ?? null) as RepartidorDB | null;
}

/** Activa o desactiva el turno de un repartidor. */
export async function toggleEnTurno(
  repartidorId: string,
  enTurno:      boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('repartidores')
    .update({ en_turno: enTurno })
    .eq('id', repartidorId);
  if (error) throw error;
}

/**
 * Publica o actualiza la ubicación del repartidor (UPSERT).
 * Se llama cada 30-60 s desde el portal del repartidor mientras está en turno.
 * El trigger `trigger_rep_ubic_geo` actualiza geo_point automáticamente.
 */
export async function upsertUbicacion(
  repartidorId: string,
  lat:          number,
  lon:          number,
  bateria?:     number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('repartidor_ubicacion')
    .upsert(
      {
        repartidor_id:  repartidorId,
        latitud:        lat,
        longitud:       lon,
        bateria:        bateria ?? null,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'repartidor_id' },
    );
  if (error) throw error;
}

/** Retorna la última ubicación conocida de un repartidor. */
export async function getRepartidorUbicacion(
  repartidorId: string,
): Promise<RepartidorUbicacionDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('repartidor_ubicacion')
    .select('*')
    .eq('repartidor_id', repartidorId)
    .maybeSingle();
  return (data ?? null) as RepartidorUbicacionDB | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PORTAL DEL REPARTIDOR
// ═══════════════════════════════════════════════════════════════════════════

/** Pedido con items y datos del prestador (para el portal repartidor). */
export interface PedidoConItemsYPrestador extends PedidoConItems {
  prestador_nombre: string;
  prestador_lat:    number | null;
  prestador_lon:    number | null;
  prestador_dir:    string;
}

export async function getPedidoConItemsYPrestador(
  id: string,
): Promise<PedidoConItemsYPrestador | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pedidos_delivery')
    .select(`
      *,
      prestador:prestadores!pedidos_delivery_prestador_id_fkey(nombre, lat:latitud, lon:longitud, direccion),
      pedido_items(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;

  const raw = data as Record<string, unknown>;
  const prRaw = raw.prestador as { nombre: string; lat: number | null; lon: number | null; direccion: string } | Array<{ nombre: string; lat: number | null; lon: number | null; direccion: string }> | null;
  const pr = Array.isArray(prRaw) ? prRaw[0] : prRaw;

  return {
    ...(raw as unknown as PedidoDeliveryDB),
    items:            (raw.pedido_items as PedidoItemDB[]) ?? [],
    prestador_nombre: pr?.nombre ?? '',
    prestador_lat:    pr?.lat ?? null,
    prestador_lon:    pr?.lon ?? null,
    prestador_dir:    pr?.direccion ?? '',
  };
}

/** Estadísticas del día actual del repartidor (pedidos entregados hoy). */
export async function getStatsHoyRepartidor(
  repartidorId: string,
): Promise<{ pedidos_hoy: number }> {
  const supabase = await createClient();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const { count } = await supabase
    .from('pedidos_delivery')
    .select('id', { count: 'exact', head: true })
    .eq('repartidor_id', repartidorId)
    .eq('estado', 'entregado')
    .gte('entregado_en', hoy.toISOString())
    .lt('entregado_en', manana.toISOString());

  return { pedidos_hoy: count ?? 0 };
}
