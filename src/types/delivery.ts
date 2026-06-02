// ─── Enums / union types ──────────────────────────────────────────────────

export type EstadoPedidoDelivery =
  | 'pendiente_pago'
  | 'aceptado'
  | 'preparando'
  | 'listo'
  | 'en_camino'
  | 'entregado'
  | 'cancelado'
  | 'rechazado'
  | 'fallido';

export type ModoDelivery         = 'plataforma' | 'propio' | 'desactivado';
export type MetodoPagoDelivery   = 'efectivo' | 'transferencia' | 'tarjeta_local' | 'bizum';
export type VehiculoTipo         = 'moto' | 'bici' | 'coche' | 'a_pie' | 'patinete';

// ─── Tablas DB ────────────────────────────────────────────────────────────

/** Fila de delivery_config — una por prestador (1:1 con prestadores) */
export interface DeliveryConfigDB {
  prestador_id:                string;
  tarifa_base:                 number;
  precio_km:                   number;
  radio_cobertura_km:          number;
  pedido_minimo:               number;
  tiempo_preparacion_base_min: number;
  velocidad_media_kmh:         number;
  acepta_efectivo:             boolean;
  acepta_transferencia:        boolean;
  acepta_bizum:                boolean;
  bizum_numero:                string | null;
  acepta_tarjeta:              boolean;
  iban_negocio:                string | null;
  texto_transferencia:         string | null;
  pedidos_simultaneos_max:     number | null;
  notas_clientes:              string | null;
  created_at:                  string;
  updated_at:                  string;
}

/** Horario de delivery para un día de la semana */
export interface DeliveryHorarioDB {
  id:            string;
  prestador_id:  string;
  dia_semana:    number; // 0=Domingo … 6=Sábado (JS Date convention)
  hora_apertura: string; // "HH:MM:SS"
  hora_cierre:   string;
}

/** Zona geográfica con tarifa fija especial */
export interface DeliveryZonaDB {
  id:           string;
  prestador_id: string;
  nombre:       string;
  tarifa_fija:  number | null;
  activa:       boolean;
  created_at:   string;
}

/** Pedido de delivery — tabla principal */
export interface PedidoDeliveryDB {
  id:                  string;
  numero_pedido:       string;
  pueblo_id:           number;
  prestador_id:        string;
  cliente_id:          string | null;
  repartidor_id:       string | null;
  delivery_modo:       ModoDelivery;
  nombre_cliente:      string;
  telefono_cliente:    string;
  email_cliente:       string | null;
  direccion:           string;
  detalles_direccion:  string | null;
  latitud:             number;
  longitud:            number;
  subtotal:            number;
  coste_envio:         number;
  total:               number;
  comision_porcentaje: number;
  comision_importe:    number;
  metodo_pago:         MetodoPagoDelivery;
  pagado:              boolean;
  estado:              EstadoPedidoDelivery;
  motivo_cancelacion:  string | null;
  distancia_km:        number;
  preparacion_min:     number;
  trayecto_min:        number;
  eta_minutos:         number;
  aceptado_en:         string | null;
  listo_en:            string | null;
  en_camino_en:        string | null;
  entregado_en:            string | null;
  cancelado_en:            string | null;
  pago_confirmado_en:      string | null;
  pago_confirmado_por:     string | null;
  notas_cliente:           string | null;
  notas_negocio:           string | null;
  created_at:              string;
  updated_at:              string;
}

/** Item de un pedido (snapshot del plato/servicio al momento del pedido) */
export interface PedidoItemDB {
  id:              string;
  pedido_id:       string;
  plato_id:        string | null;
  servicio_id:     string | null;
  nombre:          string;
  cantidad:        number;
  precio_unitario: number;
  subtotal:        number;
  notas:           string | null;
}

/** Entrada del historial de estados de un pedido */
export interface PedidoEstadoDB {
  id:           string;
  pedido_id:    string;
  estado:       EstadoPedidoDelivery;
  cambiado_por: string | null;
  observacion:  string | null;
  created_at:   string;
}

/** Perfil de un repartidor de plataforma */
export interface RepartidorDB {
  id:                  string;
  usuario_id:          string;
  pueblo_id:           number;
  vehiculo:            VehiculoTipo;
  matricula:           string | null;
  telefono_emergencia: string | null;
  iban_pago:           string | null;
  dni_nif:             string | null;
  temporada_actual:    string | null;
  fecha_alta:          string;
  fecha_baja:          string | null;
  tarifa_por_pedido:   number;
  tarifa_por_km:       number;
  activo:              boolean;
  en_turno:            boolean;
  rating_promedio:     number | null;
  pedidos_completados: number;
  created_at:          string;
  updated_at:          string;
  // join opcional desde queries que hacen .select('*, usuario:usuarios!...(nombre, email)')
  usuario?: { nombre: string; email: string } | null;
}

/** Ubicación en tiempo real del repartidor (UPSERT, 1 fila por repartidor) */
export interface RepartidorUbicacionDB {
  repartidor_id:  string;
  latitud:        number | null;
  longitud:       number | null;
  bateria:        number | null;
  actualizado_en: string;
}

// ─── Tipos de negocio (cálculo, enriquecer) ───────────────────────────────

/** Input para calcularPedido */
export interface CalcPedidoInput {
  prestador: { lat: number; lon: number; id: string };
  cliente:   { lat: number; lon: number };
  items:     { plato_id: string; cantidad: number }[];
  /** Si es 'plataforma', el envío/mínimo/radio se toman de plataforma_config (admin). */
  modo?:     ModoDelivery;
}

/** Resultado de calcularPedido */
export interface CalcPedidoResult {
  subtotal:        number;
  distancia_km:    number;
  preparacion_min: number;
  trayecto_min:    number;
  eta_minutos:     number;
  coste_envio:     number;
  total:           number;
  osrm_usado:      boolean; // false = se usó haversine como fallback
  zona_aplicada:   boolean; // true = tarifa_fija de zona, false = base + km
}

/** Resultado de una llamada OSRM */
export interface OSRMRoute {
  distance_km:  number;
  duration_min: number;
}

/** Resultado de Nominatim search / reverse geocoding */
export interface NominatimResult {
  place_id:     number;
  display_name: string;
  lat:          string;
  lon:          string;
  address?: {
    road?:         string;
    house_number?: string;
    city?:         string;
    town?:         string;
    village?:      string;
    postcode?:     string;
  };
}

/** Pedido con sus items para el panel del negocio */
export interface PedidoConItems extends PedidoDeliveryDB {
  items: PedidoItemDB[];
}

// ─── Errores de dominio ───────────────────────────────────────────────────

/** Se lanza cuando el subtotal del pedido no alcanza el pedido mínimo configurado */
export class PedidoMinimoError extends Error {
  constructor(
    public readonly minimo:   number,
    public readonly subtotal: number,
  ) {
    super(`El pedido mínimo es ${minimo}€. Subtotal actual: ${subtotal}€`);
    this.name = 'PedidoMinimoError';
  }
}

/** Se lanza cuando la dirección del cliente está fuera del radio de cobertura */
export class FueraDeRadioError extends Error {
  constructor(
    public readonly distancia: number,
    public readonly radio:     number,
  ) {
    super(
      `Dirección a ${distancia.toFixed(1)} km, fuera del radio de cobertura (${radio} km)`,
    );
    this.name = 'FueraDeRadioError';
  }
}
