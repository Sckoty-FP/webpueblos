// web/src/types/pueblo-home.ts
// Tipos compuestos para la home del pueblo (/[pueblo]).
// Centraliza shapes que se usan en múltiples componentes de home.

export interface DestacadoHome {
  hayDelivery: boolean;
  negocio: {
    id: string;
    slug: string;
    nombre: string;
    categoria: string;
    imagen: string | null;
    rating: number;
  } | null;
  actividad: {
    id: string;
    slug: string;
    nombre: string;
    tipo: string;
    imagen: string | null;
  } | null;
  freeTour: {
    id: string;
    slug: string;
    titulo: string;
    proxima_fecha: string | null;
    proxima_hora: string | null;
  } | null;
}

/** Preview de un prestador-actividad para el showcase de home. */
export interface ActividadPreview {
  id: string;
  slug: string;
  nombre: string;
  descripcionCorta: string | null;
  imagenUrl: string | null;
  tipoRecursoLabel: string | null;  // "Motos de agua", "Kayak", ...
  precioDesdeEur: number | null;
  capacidadMaxima: number | null;
}

/** Filtros para el listado de gastronomía. */
export interface FiltrosGastronomia {
  tipoCocina?: string;
  abiertoAhora?: boolean;
  soloDelivery?: boolean;
  busqueda?: string;
}

/** Filtros para el listado de servicios. */
export interface FiltrosServicios {
  categoria?: string;
  abiertoAhora?: boolean;
  conReserva?: boolean;
  busqueda?: string;
}

/** Opciones transversales para queries de listados. */
export interface OpcionesListado {
  limit?: number;
  shuffle?: boolean;  // si true, aplica rotación pesada (ver utils/shuffle-weighted)
}
