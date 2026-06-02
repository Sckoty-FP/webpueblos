export type TipoRecurso =
  | 'moto_agua'
  | 'kayak'
  | 'paddle_surf'
  | 'bici'
  | 'barco'
  | 'otro';

export type EstadoRecurso = 'disponible' | 'mantenimiento' | 'inactivo';

export interface RecursoActividadDB {
  id:              string;
  prestador_id:    string;
  servicio_id:     string | null;

  tipo:            TipoRecurso;
  nombre:          string;
  identificador:   string | null;
  capacidad:       number;

  precio_hora:     number | null;
  precio_dia:      number | null;

  caracteristicas: Record<string, string>;

  estado:          EstadoRecurso;
  activo:          boolean;
  orden:           number;

  created_at:      string;
  updated_at:      string;
}

export const TIPO_RECURSO_LABEL: Record<TipoRecurso, string> = {
  moto_agua:    'Moto de agua',
  kayak:        'Kayak',
  paddle_surf:  'Paddle surf',
  bici:         'Bicicleta',
  barco:        'Barco',
  otro:         'Otro',
};

export const TIPO_RECURSO_EMOJI: Record<TipoRecurso, string> = {
  moto_agua:    '🚤',
  kayak:        '🛶',
  paddle_surf:  '🏄',
  bici:         '🚲',
  barco:        '⛵',
  otro:         '📦',
};

export const TIPOS_RECURSO = Object.keys(TIPO_RECURSO_LABEL) as TipoRecurso[];

/** Categorías de servicios que usan el módulo de recursos */
export const CATS_ACTIVIDADES_SET = new Set([
  'alquiler_bicis', 'alquiler_barcos', 'escuela_nautica',
  'actividades_aventura', 'tour_guiado',
]);
