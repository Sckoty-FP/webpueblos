// ─── DB types ────────────────────────────────────────────────────────────────

export interface HorarioDB {
  dia_semana: number;
  hora_apertura: string | null;
  hora_cierre: string | null;
  cerrado: boolean;
  notas?: string | null;
}

export interface ServicioDB {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  categoria: string;
  precio_desde: number | null;
  precio_hasta: number | null;
  precio_unidad: string | null;
  reservable: boolean;
  duracion_minutos: number | null;
  capacidad_maxima: number | null;
  descuento_premium_porcentaje: number;
  descuento_premium_descripcion: string | null;
  activo: boolean;
  orden_visualizacion: number;
}

export interface PropiedadDB {
  id: string;
  prestador_id: string;
  pueblo_id: number;
  nombre: string;
  tipo: string;
  capacidad: number;
  precio_noche: number | null;
  descripcion: string | null;
  fotos_urls: string[];
  activo: boolean;
  created_at: string;
}

export interface PrestadorDB {
  id: string;
  pueblo_id?: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  descripcion_corta: string | null;
  email: string;
  telefono: string;
  whatsapp: string | null;
  web: string | null;
  instagram: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  direccion: string;
  imagen_portada_url: string | null;
  galeria_urls: string[];
  verificado: boolean;
  activo: boolean;
  destacado: boolean;
  rating_promedio: number;
  total_reviews: number;
  suscripcion_plan: string | null;
  tipo_cocina?: string | null;
  lat?: number | null;
  lon?: number | null;
  delivery_activo?: boolean;
  delivery_modo?: 'plataforma' | 'propio' | 'desactivado';
  free_tour_activo?: boolean;
  created_at: string;
  servicios: ServicioDB[];
  horarios: HorarioDB[];
}

export interface PrestadorCard {
  id: string;
  slug: string;
  nombre: string;
  descripcionCorta: string;
  catLabel: string;
  catId: string;
  imagenUrl: string | null;
  rating: number;
  totalReviews: number;
  precioDisplay: string;
  telefono: string;
  tags: string[];
  isOpen: boolean;
  isDestacado: boolean;
  tipoCocina: string | null;
  createdAt: string;
}

export interface MuroPostDB {
  id: string;
  pueblo_id: number;
  autor_id: string;
  tipo: "general" | "pregunta" | "recomendacion" | "evento" | "aviso";
  contenido: string;
  imagenes_urls: string[];
  total_likes: number;
  total_comentarios: number;
  created_at: string;
  autor: { nombre: string } | null;
}

export interface MuroComentarioDB {
  id: string;
  post_id: string;
  autor_id: string;
  contenido: string;
  created_at: string;
  autor: { nombre: string } | null;
}

export interface ClasificadoDB {
  id: string;
  pueblo_id: number;
  autor_id: string;
  tipo: "venta" | "alquiler" | "busco" | "regalo" | "servicio";
  categoria: "inmobiliaria" | "vehiculos" | "electronica" | "hogar" | "moda" | "deporte" | "trabajo" | "servicios" | "otros";
  titulo: string;
  descripcion: string;
  precio: number | null;
  moneda: string;
  imagenes_urls: string[];
  telefono_contacto: string | null;
  email_contacto: string | null;
  activo: boolean;
  vendido: boolean;
  destacado: boolean;
  fecha_expiracion: string;
  created_at: string;
}

export interface RutaDB {
  id: string;
  pueblo_id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  descripcion_corta: string | null;
  tipo: "senderismo" | "ciclismo" | "btt" | "kayak" | "coche";
  dificultad: "facil" | "moderada" | "dificil" | "muy_dificil";
  distancia_km: number;
  duracion_estimada_minutos: number;
  circular: boolean;
  imagen_principal_url: string | null;
  apto_ninos: boolean;
  apto_perros: boolean;
  activo: boolean;
  destacado: boolean;
  created_at: string;
}

export interface ReservaUsuarioDB {
  id: string;
  numero_reserva: string;
  fecha: string;
  hora: string;
  num_personas: number;
  estado: string;
  precio_final: number;
  created_at: string;
  servicio: { nombre: string } | null;
  prestador: { nombre: string; slug: string } | null;
}

// ─── Legacy mock types ────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  cat: string;
  description: string;
  longDescription?: string;
  rating: number;
  reviews: number;
  price: string;
  priceLevel: number;
  dist: string;
  address: string;
  phone: string | null;
  photo: string;
  open: boolean;
  tags: string[];
  isNew: boolean;
  hours?: Record<string, string>;
}

export interface Review {
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
}

export interface MuroPost {
  author: string;
  time: string;
  exp: string;
  likes: number;
  comments: number;
  photo: string;
  text: string;
  liked: boolean;
}

export interface Actividad {
  id: string;
  photo: string;
  cat: string;
  catColor: string;
  name: string;
  level: "Fácil" | "Moderada" | "Difícil";
  duration: string;
  dist: string;
  desc: string;
  price: string;
  featured: boolean;
}

export interface Clasificado {
  id: string;
  tipo: "Alquiler" | "Venta";
  photo: string;
  precio: string;
  titulo: string;
  zona: string;
  m2: number;
  habitaciones: number;
  banos: number;
  planta: string;
  tags: string[];
  temporada: string | null;
}

export interface Evento {
  date: string;
  month: string;
  title: string;
  desc: string;
  cat: string;
  catColor: string;
}

// ─── Tipos nuevos para el rediseño (BLOQUE 2) ────────────────────────────────
export type { Vertical, CategoriaServicio } from "./business-category";
export {
  CATEGORIA_VERTICAL,
  CATEGORIA_LABEL,
  CATS_GASTRONOMIA,
  CATS_ACTIVIDADES,
} from "./business-category";

export type { CategoriaEvento, EventoDB, EventoCard } from "./eventos";
export { CATEGORIA_EVENTO_LABEL, CATEGORIA_EVENTO_COLOR } from "./eventos";

export type { ConfigTipo, ConfigPlataformaItem, ConfigPlataformaMap } from "./config-plataforma";
export { CLAVES_CONFIG_CONOCIDAS } from "./config-plataforma";

export type { AdSlotKey, BannerDB } from "./banners";
export { AD_SLOT_LABEL } from "./banners";

export type { TipoContacto, ContactoInput, ContactoRecibidoDB } from "./contacto";
export { TIPO_CONTACTO_VALUES, TIPO_CONTACTO_LABEL, contactoSchema } from "./contacto";

export type {
  DestacadoHome,
  ActividadPreview,
  FiltrosGastronomia,
  FiltrosServicios,
  OpcionesListado,
} from "./pueblo-home";
