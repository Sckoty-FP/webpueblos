export type EstadoInscripcionFreeTour =
  | 'confirmada'
  | 'cancelada_cliente'
  | 'cancelada_guia'
  | 'no_show'
  | 'asistio';

export type DificultadFreeTour = 'facil' | 'media' | 'dificil';

export interface FreeTourDB {
  id: string;
  pueblo_id: number;
  prestador_id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  descripcion_corta: string | null;
  idiomas: string[];
  duracion_minutos: number;
  distancia_km: number | null;
  dificultad: DificultadFreeTour;
  punto_encuentro_nombre: string | null;
  punto_encuentro_lat: number | null;
  punto_encuentro_lon: number | null;
  punto_final_nombre: string | null;
  imagen_portada_url: string | null;
  galeria_urls: string[];
  recorrido_geojson: Record<string, unknown> | null;
  incluye: string[];
  llevar: string[];
  observaciones: string | null;
  cupo_maximo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FreeTourSesionDB {
  id: string;
  tour_id: string;
  prestador_id: string;
  pueblo_id: number;
  fecha: string;
  hora: string;
  cupo_sesion: number;
  inscritos_count: number;
  cancelada: boolean;
  motivo_cancelacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface FreeTourInscripcionDB {
  id: string;
  numero: string;
  sesion_id: string;
  tour_id: string;
  prestador_id: string;
  cliente_id: string | null;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string | null;
  num_personas: number;
  notas: string | null;
  estado: EstadoInscripcionFreeTour;
  comision_aplicada: number;
  comision_facturada: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComisionAcumuladaDB {
  id: string;
  prestador_id: string;
  origen: 'free_tour' | 'delivery';
  origen_id: string;
  concepto: string;
  importe: number;
  facturado: boolean;
  remesa_id: string | null;
  created_at: string;
}

export const DIFICULTAD_LABEL: Record<DificultadFreeTour, string> = {
  facil:  'Fácil',
  media:  'Media',
  dificil: 'Difícil',
};

export const ESTADO_INSCRIPCION_LABEL: Record<EstadoInscripcionFreeTour, string> = {
  confirmada:       'Confirmada',
  cancelada_cliente:'Cancelada cliente',
  cancelada_guia:   'Cancelada guía',
  no_show:          'No-show',
  asistio:          'Asistió',
};
