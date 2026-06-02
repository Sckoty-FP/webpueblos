import { fetchOSRM, haversine }  from '@/lib/osrm/client';
import { createClient }          from '@/lib/supabase/server';
import { getDeliveryPricingConfig } from '@/lib/supabase/queries/admin';
import {
  PedidoMinimoError,
  FueraDeRadioError,
} from '@/types/delivery';
import type {
  CalcPedidoInput,
  CalcPedidoResult,
  DeliveryConfigDB,
  OSRMRoute,
} from '@/types/delivery';
import type { DeliveryPricingConfig } from '@/types/admin';

// ─── Tipos internos ───────────────────────────────────────────────────────

interface PlatoCalc {
  id:                     string;
  precio:                 number;
  tiempo_preparacion_min: number | null;
}

interface ZonaCalc {
  tarifa_fija: number;
}

// ─── Interfaz de dependencias (para dependency injection en tests) ─────────

/**
 * Dependencias inyectables de calcularPedido.
 * En producción se usan los defaults que llaman a supabase y OSRM reales.
 * En tests se pasan mocks para aislar la lógica de cálculo.
 */
export interface CalcDeps {
  fetchOSRM:         (from: { lat: number; lon: number }, to: { lat: number; lon: number }) => Promise<OSRMRoute | null>;
  getDeliveryConfig: (prestadorId: string)                                                   => Promise<DeliveryConfigDB>;
  getPlatos:         (ids: string[])                                                          => Promise<PlatoCalc[]>;
  getZonaContiene:   (prestadorId: string, cliente: { lat: number; lon: number })             => Promise<ZonaCalc | null>;
  /** Precios globales del admin para modo 'plataforma'. */
  getPlataformaPricing: ()                                                                    => Promise<DeliveryPricingConfig>;
}

// ─── Implementaciones reales (usadas en producción) ───────────────────────

async function getDeliveryConfigReal(prestadorId: string): Promise<DeliveryConfigDB> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('delivery_config')
    .select('*')
    .eq('prestador_id', prestadorId)
    .single();

  if (error || !data) {
    throw new Error(`Sin configuración de delivery para el prestador ${prestadorId}`);
  }
  return data as DeliveryConfigDB;
}

async function getPlatosReal(platoIds: string[]): Promise<PlatoCalc[]> {
  if (platoIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('platos')
    .select('id, precio, tiempo_preparacion_min')
    .in('id', platoIds);

  if (error) throw error;
  return (data ?? []) as PlatoCalc[];
}

/**
 * Consulta via RPC si el punto del cliente cae en alguna zona de tarifa fija.
 * La función SQL `delivery_zona_para_punto` se define en migración 017.
 * Retorna null si no hay zona, si falla la query, o si no hay polígonos definidos.
 */
async function getZonaContieneReal(
  prestadorId: string,
  cliente:     { lat: number; lon: number },
): Promise<ZonaCalc | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('delivery_zona_para_punto', {
      p_prestador_id: prestadorId,
      p_lat:          cliente.lat,
      p_lon:          cliente.lon,
    });

    if (error || data == null) return null;
    return { tarifa_fija: data as number };
  } catch {
    return null;
  }
}

/** Dependencias por defecto para uso en Server Actions y Server Components */
export const defaultCalcDeps: CalcDeps = {
  fetchOSRM,
  getDeliveryConfig: getDeliveryConfigReal,
  getPlatos:         getPlatosReal,
  getZonaContiene:   getZonaContieneReal,
  getPlataformaPricing: getDeliveryPricingConfig,
};

// ─── Función principal ────────────────────────────────────────────────────

/**
 * Calcula el coste de envío, ETA y totales de un pedido de delivery.
 *
 * Algoritmo:
 *   1. Obtiene la configuración de delivery del negocio.
 *   2. Consulta OSRM para distancia y tiempo real por carretera.
 *      Si OSRM falla → fallback a haversine + velocidad media de la config.
 *   3. Valida radio de cobertura.
 *   4. Obtiene precios y tiempos de preparación de los platos.
 *   5. Valida pedido mínimo.
 *   6. Consulta zona con tarifa fija (PostGIS). Si no hay zona → base + €/km.
 *   7. Retorna breakdown completo.
 *
 * Lanza:
 *   - `FueraDeRadioError`  si la distancia supera radio_cobertura_km.
 *   - `PedidoMinimoError`  si el subtotal es menor que pedido_minimo.
 *   - `Error`              si el prestador no tiene delivery_config.
 *
 * @param input  Datos del prestador, cliente e items del carrito.
 * @param deps   Dependencias inyectables (por defecto: implementaciones reales).
 */
export async function calcularPedido(
  input: CalcPedidoInput,
  deps:  CalcDeps = defaultCalcDeps,
): Promise<CalcPedidoResult> {

  // ── 1. Config de delivery ────────────────────────────────────────────────
  const configRestaurante = await deps.getDeliveryConfig(input.prestador.id);

  // En modo 'plataforma' el envío, el pedido mínimo y el radio los define el
  // admin (plataforma_config), no el restaurante. El tiempo de cocina y la
  // velocidad media (operativos del local) se mantienen del restaurante.
  let config = configRestaurante;
  if (input.modo === 'plataforma') {
    const p = await deps.getPlataformaPricing();
    config = {
      ...configRestaurante,
      tarifa_base:        p.tarifa_base,
      precio_km:          p.precio_km,
      pedido_minimo:      p.pedido_minimo,
      radio_cobertura_km: p.radio_cobertura_km,
    };
  }

  // ── 2. Routing ───────────────────────────────────────────────────────────
  const ruta = await deps.fetchOSRM(input.prestador, input.cliente).catch(() => null);
  const osrm_usado = ruta !== null;

  const distancia_km_raw = ruta?.distance_km ?? haversine(input.prestador, input.cliente);
  const distancia_km = parseFloat(distancia_km_raw.toFixed(3));

  // Tiempo de trayecto: real de OSRM o calculado con velocidad media
  const trayecto_min = ruta
    ? Math.ceil(ruta.duration_min)
    : Math.ceil((distancia_km / config.velocidad_media_kmh) * 60);

  // ── 3. Validación de radio ───────────────────────────────────────────────
  if (distancia_km > config.radio_cobertura_km) {
    throw new FueraDeRadioError(distancia_km, config.radio_cobertura_km);
  }

  // ── 4. Platos y tiempo de preparación ───────────────────────────────────
  const platoIds = input.items.map((i) => i.plato_id);
  const platos   = await deps.getPlatos(platoIds);

  // Si un plato no tiene tiempo definido (NULL), usar 15 min como estimación segura
  const tiempos      = platos.map((p) => p.tiempo_preparacion_min ?? 15);
  const max_prep_min = tiempos.length > 0 ? Math.max(...tiempos) : 15;
  const preparacion_min = max_prep_min + config.tiempo_preparacion_base_min;

  // ── 5. Subtotal ──────────────────────────────────────────────────────────
  const subtotal_raw = input.items.reduce((sum, item) => {
    const plato = platos.find((p) => p.id === item.plato_id);
    return sum + (plato ? plato.precio * item.cantidad : 0);
  }, 0);
  const subtotal = parseFloat(subtotal_raw.toFixed(2));

  // ── 6. Validación pedido mínimo ──────────────────────────────────────────
  if (subtotal < config.pedido_minimo) {
    throw new PedidoMinimoError(config.pedido_minimo, subtotal);
  }

  // ── 7. Coste de envío ────────────────────────────────────────────────────
  // Zona con tarifa_fija tiene precedencia sobre el cálculo base + km
  const zona         = await deps.getZonaContiene(input.prestador.id, input.cliente);
  const zona_aplicada = zona !== null;
  const coste_envio   = zona_aplicada
    ? zona!.tarifa_fija
    : parseFloat((config.tarifa_base + distancia_km * config.precio_km).toFixed(2));

  // ── 8. Resultado ─────────────────────────────────────────────────────────
  return {
    subtotal,
    distancia_km,
    preparacion_min,
    trayecto_min,
    eta_minutos: preparacion_min + trayecto_min,
    coste_envio,
    total:       parseFloat((subtotal + coste_envio).toFixed(2)),
    osrm_usado,
    zona_aplicada,
  };
}
