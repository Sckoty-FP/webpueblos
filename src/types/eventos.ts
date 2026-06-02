// web/src/types/eventos.ts
// Columnas reales tras migración 005 (tabla base) + 030 (extensión).

/**
 * Categorías del CHECK constraint en DB (migración 030).
 * Mantener sincronizado con: `'general','musica','gastronomia','cultura','deporte','fiesta','feria','otros'`
 */
export type CategoriaEvento =
  | "general" | "musica" | "gastronomia" | "cultura"
  | "deporte" | "fiesta" | "feria" | "otros";

/** Shape exacto de la tabla `eventos` en DB. */
export interface EventoDB {
  id: string;
  pueblo_id: number;
  prestador_id: string | null;
  titulo: string;
  slug: string;
  descripcion: string;
  descripcion_corta: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  todo_el_dia: boolean;
  lugar: string | null;
  direccion: string | null;
  lat: number | null;
  lon: number | null;
  imagen_url: string | null;
  galeria_urls: string[];
  precio: number | null;
  url_externa: string | null;
  organizador: string | null;
  categoria: CategoriaEvento;
  publico_objetivo: string | null;
  recurrente: boolean;
  gratis: boolean;
  cupo: number | null;
  activo: boolean;
  destacado: boolean;
  total_visualizaciones: number;
  created_at: string;
  updated_at: string;
}

/** Shape limpio para cards y previews (sin campos internos pesados). */
export interface EventoCard {
  id: string;
  slug: string;
  titulo: string;
  descripcionCorta: string | null;
  categoria: CategoriaEvento;
  categoriaLabel: string;
  diaNumero: string;      // "23"
  diaMesAbrev: string;    // "MAY"
  horaInicio: string | null;
  lugar: string | null;
  gratis: boolean;
  precio: number | null;
  precioDisplay: string;  // "Gratis" | "12€" | "Consultar"
  imagenUrl: string | null;
  esDestacado: boolean;
}

export const CATEGORIA_EVENTO_LABEL: Record<CategoriaEvento, string> = {
  general: "General",
  musica: "Música",
  gastronomia: "Gastronomía",
  cultura: "Cultura",
  deporte: "Deporte",
  fiesta: "Fiesta",
  feria: "Feria",
  otros: "Otros",
};

export const CATEGORIA_EVENTO_COLOR: Record<CategoriaEvento, string> = {
  general:    "#6b7280",
  musica:     "#a855f7",
  gastronomia:"#f59e0b",
  cultura:    "#0ea5e9",
  deporte:    "#22c55e",
  fiesta:     "#f43f5e",
  feria:      "#14b8a6",
  otros:      "#9ca3af",
};
