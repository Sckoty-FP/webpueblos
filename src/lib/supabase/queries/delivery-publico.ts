import { createClient } from '@/lib/supabase/server';
import type { DeliveryConfigDB, DeliveryHorarioDB, PedidoItemDB } from '@/types/delivery';
import type { HorarioDB, PrestadorDB } from '@/types';
import type { PlatoDB } from '@/types/pedidos';

// ─── Tipos para la vista pública ──────────────────────────────────────────────

export interface PrestadorDeliveryPublico {
  id:                          string;
  nombre:                      string;
  slug:                        string;
  descripcion_corta:           string | null;
  imagen_portada_url:          string | null;
  rating_promedio:             number;
  tipo_cocina:                 string | null;
  lat:                         number | null;
  lon:                         number | null;
  delivery_modo:               'plataforma' | 'propio' | 'desactivado' | null;
  horarios:                    HorarioDB[];
  delivery_config:             Pick<DeliveryConfigDB, 'tarifa_base' | 'pedido_minimo' | 'tiempo_preparacion_base_min' | 'acepta_efectivo' | 'acepta_transferencia' | 'acepta_bizum' | 'bizum_numero'> | null;
}

export interface PrestadorDeliveryDetalle extends PrestadorDeliveryPublico {
  telefono:          string;
  delivery_horarios: DeliveryHorarioDB[];
  config:            DeliveryConfigDB | null;
}

// ─── Listado ─────────────────────────────────────────────────────────────────

export async function getPrestadoresDelivery(
  puebloId: number,
): Promise<PrestadorDeliveryPublico[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prestadores')
    .select(`
      id, nombre, slug, descripcion_corta, imagen_portada_url,
      rating_promedio, tipo_cocina, lat:latitud, lon:longitud, delivery_modo,
      horarios(dia_semana, hora_apertura, hora_cierre, cerrado),
      delivery_config(tarifa_base, pedido_minimo, tiempo_preparacion_base_min, acepta_efectivo, acepta_transferencia)
    `)
    .eq('pueblo_id', puebloId)
    .eq('activo', true)
    .eq('delivery_activo', true)
    .order('destacado', { ascending: false })
    .order('rating_promedio', { ascending: false });

  if (error) {
    console.error('[getPrestadoresDelivery]', error);
    return [];
  }
  return (data ?? []) as unknown as PrestadorDeliveryPublico[];
}

// ─── Detalle de un negocio ───────────────────────────────────────────────────

export async function getPrestadorDeliveryBySlug(
  slug: string,
): Promise<PrestadorDeliveryDetalle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prestadores')
    .select(`
      id, nombre, slug, descripcion_corta, imagen_portada_url,
      telefono, rating_promedio, tipo_cocina, lat:latitud, lon:longitud, delivery_modo,
      horarios(dia_semana, hora_apertura, hora_cierre, cerrado),
      delivery_config(*)
    `)
    .eq('slug', slug)
    .eq('activo', true)
    .eq('delivery_activo', true)
    .maybeSingle();

  if (error || !data) return null;

  const raw = data as Record<string, unknown>;
  const configRaw = Array.isArray(raw.delivery_config)
    ? (raw.delivery_config[0] ?? null)
    : (raw.delivery_config ?? null);

  return {
    ...raw,
    delivery_config: configRaw,
    config:          configRaw,
    delivery_horarios: [],
  } as unknown as PrestadorDeliveryDetalle;
}

// ─── Platos disponibles para delivery ───────────────────────────────────────

export async function getPlatosDelivery(
  prestadorId: string,
): Promise<PlatoDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('platos')
    .select('id, prestador_id, nombre, descripcion, categoria, precio, precio_oferta, imagen_url, alergenos, vegetariano, vegano, sin_gluten, picante, disponible_local, disponible_delivery, tiempo_preparacion_min, activo, orden, created_at, updated_at')
    .eq('prestador_id', prestadorId)
    .eq('activo', true)
    .eq('disponible_delivery', true)
    .order('categoria')
    .order('orden')
    .order('nombre');

  if (error) { console.error('[getPlatosDelivery]', error); return []; }
  return (data ?? []) as PlatoDB[];
}

// ─── Items de un pedido ──────────────────────────────────────────────────────

export async function getItemsDePedido(pedidoId: string): Promise<PedidoItemDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pedido_items')
    .select('*')
    .eq('pedido_id', pedidoId)
    .order('nombre');
  if (error) { console.error('[getItemsDePedido]', error); return []; }
  return (data ?? []) as PedidoItemDB[];
}

// ─── Historial de pedidos del usuario ────────────────────────────────────────

export interface PedidoUsuario {
  id:               string;
  numero_pedido:    string;
  estado:           import('@/types/delivery').EstadoPedidoDelivery;
  total:            number;
  created_at:       string;
  prestador_id:     string;
  prestador_nombre: string;
  prestador_slug:   string;
  pueblo_id:        number;
  pueblo_slug:      string;
  items:            PedidoItemDB[];
}

export async function getPedidosDelUsuario(
  userId: string,
): Promise<PedidoUsuario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pedidos_delivery')
    .select(`
      id, numero_pedido, estado, total, created_at, prestador_id, pueblo_id,
      prestador:prestadores!pedidos_delivery_prestador_id_fkey(nombre, slug),
      pueblo:pueblos!pedidos_delivery_pueblo_id_fkey(slug),
      pedido_items(id, pedido_id, plato_id, servicio_id, nombre, cantidad, precio_unitario, subtotal, notas)
    `)
    .eq('cliente_id', userId)
    .order('created_at', { ascending: false });

  if (error) { console.error('[getPedidosDelUsuario]', error); return []; }

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(row => {
    const prestadorRaw = row.prestador as { nombre: string; slug: string } | Array<{ nombre: string; slug: string }> | null;
    const prestador = Array.isArray(prestadorRaw) ? prestadorRaw[0] : prestadorRaw;
    const puebloRaw = row.pueblo as { slug: string } | Array<{ slug: string }> | null;
    const pueblo = Array.isArray(puebloRaw) ? puebloRaw[0] : puebloRaw;
    return {
      id:               row.id as string,
      numero_pedido:    row.numero_pedido as string,
      estado:           row.estado as import('@/types/delivery').EstadoPedidoDelivery,
      total:            row.total as number,
      created_at:       row.created_at as string,
      prestador_id:     row.prestador_id as string,
      prestador_nombre: prestador?.nombre ?? '',
      prestador_slug:   prestador?.slug ?? '',
      pueblo_id:        row.pueblo_id as number,
      pueblo_slug:      pueblo?.slug ?? '',
      items:            (row.pedido_items as PedidoItemDB[]) ?? [],
    };
  });
}
