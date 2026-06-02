// web/src/types/business-category.ts
// Taxonomía centralizada. Source of truth: enum categoria_servicio en migración 003.

export type Vertical = "gastronomia" | "servicios" | "actividades" | "free-tour";

/**
 * Categorías del enum DB `categoria_servicio` (migración 003).
 * Si la DB añade valores nuevos, añadirlos aquí también.
 */
export type CategoriaServicio =
  // Hostelería
  | "restaurante" | "bar" | "cafeteria" | "heladeria" | "panaderia"
  // Hospedaje
  | "hotel" | "apartamento_turistico" | "camping" | "hostal"
  // Comercio
  | "supermercado" | "farmacia" | "tienda_ropa" | "comercio_general"
  // Servicios personales
  | "peluqueria" | "estetica" | "spa" | "gimnasio"
  // Profesionales
  | "fontaneria" | "electricidad" | "taller_mecanico" | "limpieza" | "jardineria"
  // Salud
  | "clinica" | "fisioterapia" | "veterinario"
  // Ocio / alquileres / actividades
  | "alquiler_bicis" | "alquiler_barcos" | "escuela_nautica"
  | "actividades_aventura" | "tour_guiado"
  // Otros
  | "otro";

/** Qué vertical pública le corresponde a cada categoría de prestador. */
export const CATEGORIA_VERTICAL: Record<CategoriaServicio, Vertical> = {
  // gastronomia
  restaurante: "gastronomia", bar: "gastronomia", cafeteria: "gastronomia",
  heladeria: "gastronomia", panaderia: "gastronomia",
  // actividades
  alquiler_bicis: "actividades", alquiler_barcos: "actividades",
  escuela_nautica: "actividades", actividades_aventura: "actividades", tour_guiado: "actividades",
  // servicios — todo lo demás
  hotel: "servicios", apartamento_turistico: "servicios", camping: "servicios", hostal: "servicios",
  supermercado: "servicios", farmacia: "servicios", tienda_ropa: "servicios", comercio_general: "servicios",
  peluqueria: "servicios", estetica: "servicios", spa: "servicios", gimnasio: "servicios",
  fontaneria: "servicios", electricidad: "servicios", taller_mecanico: "servicios",
  limpieza: "servicios", jardineria: "servicios",
  clinica: "servicios", fisioterapia: "servicios", veterinario: "servicios",
  otro: "servicios",
};

/** Etiquetas amigables para la UI. */
export const CATEGORIA_LABEL: Record<CategoriaServicio, string> = {
  restaurante: "Restaurante", bar: "Bar", cafeteria: "Cafetería",
  heladeria: "Heladería", panaderia: "Panadería",
  hotel: "Hotel", apartamento_turistico: "Apartamento turístico",
  camping: "Camping", hostal: "Hostal",
  supermercado: "Supermercado", farmacia: "Farmacia",
  tienda_ropa: "Tienda de ropa", comercio_general: "Comercio",
  peluqueria: "Peluquería", estetica: "Estética", spa: "Spa", gimnasio: "Gimnasio",
  fontaneria: "Fontanería", electricidad: "Electricidad", taller_mecanico: "Taller mecánico",
  limpieza: "Limpieza", jardineria: "Jardinería",
  clinica: "Clínica", fisioterapia: "Fisioterapia", veterinario: "Veterinario",
  alquiler_bicis: "Alquiler de bicis", alquiler_barcos: "Alquiler de barcos",
  escuela_nautica: "Escuela náutica", actividades_aventura: "Actividades de aventura",
  tour_guiado: "Tour guiado",
  otro: "Otros",
};

/** Sets para filtrar rápido por vertical. */
export const CATS_GASTRONOMIA = new Set<CategoriaServicio>([
  "restaurante", "bar", "cafeteria", "heladeria", "panaderia",
]);

export const CATS_ACTIVIDADES = new Set<CategoriaServicio>([
  "alquiler_bicis", "alquiler_barcos", "escuela_nautica",
  "actividades_aventura", "tour_guiado",
]);
