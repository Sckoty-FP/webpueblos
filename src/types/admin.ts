// ─── Configuración de plataforma ─────────────────────────────────────────

export interface PlataformaConfigDB {
  clave:       string;
  valor:       Record<string, unknown>;
  descripcion: string | null;
  updated_by:  string | null;
  updated_at:  string;
}

export interface MetodosPagoConfig {
  efectivo: boolean;
  bizum:    boolean;
  tarjeta:  boolean;
}

export interface DeliveryPricingConfig {
  tarifa_base:              number;  // € base
  precio_km:                number;  // €/km
  porcentaje_restaurante:   number;  // % del envío cedido al restaurante (0-100)
  pedido_minimo:            number;  // € mínimo de pedido (modo plataforma)
  radio_cobertura_km:       number;  // km de cobertura (modo plataforma)
}

// ─── Comisión por delivery propio ─────────────────────────────────────────

export interface ComisionConfigDB {
  id:           string;
  pueblo_id:    number | null;
  categoria:    string | null;
  porcentaje:   number;
  observaciones: string | null;
  activa:       boolean;
  created_at:   string;
  updated_at:   string;
}

// ─── Verificación de negocios ─────────────────────────────────────────────

export type EstadoVerificacion =
  | 'pendiente'
  | 'revisando'
  | 'aprobado'
  | 'rechazado'
  | 'requiere_mas';

export interface VerificacionNegociooDB {
  id:                      string;
  prestador_id:            string;
  cif_documento_url:       string | null;
  alta_iae_url:            string | null;
  responsable_civil_url:   string | null;
  otros_documentos_urls:   string[];
  estado:                  EstadoVerificacion;
  motivo_rechazo:          string | null;
  notas_internas:          string | null;
  revisado_por:            string | null;
  revisado_en:             string | null;
  created_at:              string;
  updated_at:              string;
}

export interface VerificacionConPrestador extends VerificacionNegociooDB {
  prestador: {
    nombre:   string;
    slug:     string;
    pueblo_id: number;
  };
}

// ─── Tickets de soporte ───────────────────────────────────────────────────

export type TicketPrioridad = 'baja' | 'media' | 'alta' | 'urgente';
export type TicketEstado    = 'abierto' | 'en_curso' | 'esperando_cliente' | 'resuelto' | 'cerrado';

export const TICKET_PRIORIDAD_LABEL: Record<TicketPrioridad, string> = {
  baja:    'Baja',
  media:   'Media',
  alta:    'Alta',
  urgente: 'Urgente',
};

export const TICKET_ESTADO_LABEL: Record<TicketEstado, string> = {
  abierto:            'Abierto',
  en_curso:           'En curso',
  esperando_cliente:  'Esperando cliente',
  resuelto:           'Resuelto',
  cerrado:            'Cerrado',
};

export interface TicketSoporteDB {
  id:          string;
  numero:      string;
  pueblo_id:   number | null;
  abierto_por: string;
  asunto:      string;
  descripcion: string;
  prioridad:   TicketPrioridad;
  estado:      TicketEstado;
  asignado_a:  string | null;
  prestador_id: string | null;
  pedido_id:   string | null;
  reserva_id:  string | null;
  created_at:  string;
  updated_at:  string;
  cerrado_en:  string | null;
}

export interface TicketConAutor extends TicketSoporteDB {
  autor: { email: string; nombre: string | null } | null;
  prestador: { nombre: string } | null;
}

export interface TicketMensajeDB {
  id:           string;
  ticket_id:    string;
  autor_id:     string;
  cuerpo:       string;
  adjuntos_urls: string[];
  interno:      boolean;
  created_at:   string;
  autor?:       { email: string; nombre: string | null };
}

// ─── Remesas ──────────────────────────────────────────────────────────────

export type EstadoRemesa = 'pendiente' | 'pagada' | 'fallida' | 'cancelada';

export interface RemesaDB {
  id:             string;
  numero:         string;
  prestador_id:   string;
  periodo_inicio: string;
  periodo_fin:    string;
  importe_total:  number;
  estado:         EstadoRemesa;
  pdf_url:        string | null;
  notas:          string | null;
  pagada_en:      string | null;
  created_at:     string;
  updated_at:     string;
}

export interface RemesaConPrestador extends RemesaDB {
  prestador: { nombre: string; slug: string };
}

// ─── KPIs ─────────────────────────────────────────────────────────────────

export interface AdminKpis {
  gmv_comida:          number;
  gmv_delivery:        number;
  gmv_total:           number;
  pedidos_delivery:    number;
  reservas_confirmadas: number;
  free_tour_inscritos: number;
  comision_free_tour:  number;
  tickets_abiertos:    number;
  tickets_urgentes:    number;
  negocios_activos:    number;
  repartidores_turno:  number;
  saldo_pendiente:     number;
}

export interface KpiPorPueblo {
  pueblo_id:     number;
  pueblo_nombre: string;
  pedidos:       number;
  gmv_comida:    number;
  gmv_delivery:  number;
  gmv_total:     number;
}

export interface SaldoPendiente {
  prestador_id:    string;
  negocio:         string;
  items_pendientes: number;
  saldo_total:     number;
  desde:           string;
}
