// web/src/lib/supabase/queries/pueblo-home.ts
import { createClient } from "@/lib/supabase/server";
import type { PrestadorCard, PrestadorDB } from "@/types";
import type {
  DestacadoHome,
  ActividadPreview,
  FiltrosGastronomia,
  FiltrosServicios,
  OpcionesListado,
} from "@/types/pueblo-home";
import type { EventoDB, EventoCard, CategoriaEvento } from "@/types/eventos";
import { CATEGORIA_EVENTO_LABEL } from "@/types/eventos";
import type { PlatoDB } from "@/types/pedidos";
import type { CategoriaServicio } from "@/types/business-category";
import { CATS_GASTRONOMIA, CATS_ACTIVIDADES } from "@/types/business-category";

/** Expande group keys de chips UI a valores reales del enum categoria_servicio. */
const GRUPO_A_CATEGORIAS: Record<string, string[]> = {
  servicios_pro: ["fontaneria", "electricidad", "taller_mecanico", "limpieza", "jardineria"],
  hospedaje:     ["hotel", "apartamento_turistico", "camping", "hostal"],
  comercio:      ["supermercado", "farmacia", "tienda_ropa", "comercio_general"],
  salud:         ["clinica", "fisioterapia", "veterinario"],
  otros:         ["otro"],
};
import {
  getCatFromServicios,
  isOpenNow,
  getPrecioDisplay,
} from "@/lib/utils/prestadores";
import { shuffleWeighted } from "@/lib/utils/shuffle-weighted";

// ═════════════════════════════════════════════════════════════════════
// Mapper común
// ═════════════════════════════════════════════════════════════════════

function getTags(p: PrestadorDB): string[] {
  const tags: string[] = [];
  if (p.servicios.some(s => s.reservable)) tags.push("Reservas");
  if (p.whatsapp) tags.push("WhatsApp");
  if (p.web) tags.push("Sitio web");
  if (p.verificado) tags.push("Verificado");
  p.servicios.filter(s => s.activo).slice(0, 2).forEach(s => tags.push(s.nombre));
  return tags.slice(0, 5);
}

function mapToCard(p: PrestadorDB): PrestadorCard & { deliveryActivo?: boolean } {
  const cat = getCatFromServicios(p.servicios);
  return {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    descripcionCorta: p.descripcion_corta ?? p.descripcion ?? "",
    catLabel: cat.label,
    catId: cat.id,
    imagenUrl: p.imagen_portada_url,
    rating: Number(p.rating_promedio),
    totalReviews: p.total_reviews,
    precioDisplay: getPrecioDisplay(p.servicios),
    telefono: p.telefono,
    tags: getTags(p),
    isOpen: isOpenNow(p.horarios),
    isDestacado: p.destacado,
    tipoCocina: p.tipo_cocina ?? null,
    createdAt: p.created_at,
    deliveryActivo: !!p.delivery_activo,
  };
}

export function weightForPrestador(c: PrestadorCard & { createdAt: string }): number {
  let peso = 10;
  if (c.isDestacado) peso *= 0.6;
  peso += Math.min(c.rating, 5) * 1.5;
  const ageDays = (Date.now() - new Date(c.createdAt).getTime()) / 86400000;
  if (ageDays < 30) peso *= 1.4;
  return peso;
}

// ═════════════════════════════════════════════════════════════════════
// 1. PRESTADORES — Gastronomía
// ═════════════════════════════════════════════════════════════════════

export async function getPrestadoresGastronomia(
  puebloId: number,
  filtros: FiltrosGastronomia & OpcionesListado = {},
): Promise<Array<PrestadorCard & { deliveryActivo?: boolean }>> {
  const supabase = await createClient();

  let q = supabase
    .from("prestadores")
    .select(`
      id, nombre, slug, descripcion, descripcion_corta,
      telefono, whatsapp, web, verificado, activo, destacado,
      rating_promedio, total_reviews, imagen_portada_url, tipo_cocina,
      delivery_activo, created_at,
      servicios!inner (id, nombre, categoria, precio_desde, reservable, activo),
      horarios (dia_semana, hora_apertura, hora_cierre, cerrado)
    `)
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .in("servicios.categoria", Array.from(CATS_GASTRONOMIA));

  if (filtros.tipoCocina) {
    q = q.eq("tipo_cocina", filtros.tipoCocina);
  }
  if (filtros.soloDelivery) {
    q = q.eq("delivery_activo", true);
  }
  if (filtros.busqueda) {
    q = q.ilike("nombre", `%${filtros.busqueda}%`);
  }

  q = q
    .order("destacado", { ascending: false })
    .order("rating_promedio", { ascending: false });

  const { data, error } = await q;
  if (error) {
    console.error("[getPrestadoresGastronomia]", error);
    return [];
  }

  let cards = (data as unknown as PrestadorDB[]).map(mapToCard);

  if (filtros.abiertoAhora) {
    cards = cards.filter(c => c.isOpen);
  }
  if (filtros.shuffle) {
    cards = shuffleWeighted(cards, c => weightForPrestador(c), {
      scope: `pueblo:${puebloId}:gastronomia`,
      bucketMs: 60 * 60 * 1000,
    });
  }
  if (filtros.limit && filtros.limit > 0) {
    cards = cards.slice(0, filtros.limit);
  }

  return cards;
}

// ═════════════════════════════════════════════════════════════════════
// 2. PRESTADORES — Servicios
// ═════════════════════════════════════════════════════════════════════

export async function getPrestadoresServicios(
  puebloId: number,
  filtros: FiltrosServicios & OpcionesListado = {},
): Promise<PrestadorCard[]> {
  const supabase = await createClient();

  const categoriasExcluidas = [
    ...Array.from(CATS_GASTRONOMIA),
    ...Array.from(CATS_ACTIVIDADES),
  ];

  let q = supabase
    .from("prestadores")
    .select(`
      id, nombre, slug, descripcion, descripcion_corta,
      telefono, whatsapp, web, verificado, activo, destacado,
      rating_promedio, total_reviews, imagen_portada_url, tipo_cocina,
      delivery_activo, created_at,
      servicios!inner (id, nombre, categoria, precio_desde, reservable, activo),
      horarios (dia_semana, hora_apertura, hora_cierre, cerrado)
    `)
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .not("servicios.categoria", "in", `(${categoriasExcluidas.join(",")})`);

  if (filtros.categoria) {
    const cats = GRUPO_A_CATEGORIAS[filtros.categoria] ?? [filtros.categoria];
    if (cats.length === 1) {
      q = q.eq("servicios.categoria", cats[0]);
    } else {
      q = q.in("servicios.categoria", cats);
    }
  }
  if (filtros.conReserva) {
    q = q.eq("servicios.reservable", true);
  }
  if (filtros.busqueda) {
    q = q.ilike("nombre", `%${filtros.busqueda}%`);
  }

  q = q
    .order("destacado", { ascending: false })
    .order("rating_promedio", { ascending: false });

  const { data, error } = await q;
  if (error) {
    console.error("[getPrestadoresServicios]", error);
    return [];
  }

  let cards = (data as unknown as PrestadorDB[]).map(mapToCard);

  if (filtros.abiertoAhora) {
    cards = cards.filter(c => c.isOpen);
  }
  if (filtros.shuffle) {
    cards = shuffleWeighted(cards, c => weightForPrestador(c), {
      scope: `pueblo:${puebloId}:servicios`,
      bucketMs: 60 * 60 * 1000,
    });
  }
  if (filtros.limit && filtros.limit > 0) {
    cards = cards.slice(0, filtros.limit);
  }

  return cards;
}

// ═════════════════════════════════════════════════════════════════════
// 3. ACTIVIDADES PREVIEW
// ═════════════════════════════════════════════════════════════════════

function labelForCategoriaActividad(cat: string): string {
  switch (cat) {
    case "alquiler_bicis":       return "Alquiler de bicis";
    case "alquiler_barcos":      return "Alquiler de barcos";
    case "escuela_nautica":      return "Escuela náutica";
    case "actividades_aventura": return "Aventura";
    case "tour_guiado":          return "Tour guiado";
    default:                     return "Actividad";
  }
}

export async function getActividadesPreview(
  puebloId: number,
  opts: OpcionesListado = {},
): Promise<ActividadPreview[]> {
  const supabase = await createClient();

  const { data: prestadores, error } = await supabase
    .from("prestadores")
    .select(`
      id, nombre, slug, descripcion_corta, imagen_portada_url,
      servicios!inner (id, nombre, categoria, precio_desde, capacidad_maxima, activo)
    `)
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .in("servicios.categoria", Array.from(CATS_ACTIVIDADES));

  if (error) {
    console.error("[getActividadesPreview]", error);
    return [];
  }

  // Una tarjeta por prestador (no por servicio). El detalle de actividad
  // (`/[pueblo]/actividades/[id]` → getActividadCompleta) resuelve SIEMPRE por
  // `prestadores.id`, así que el `id` del item DEBE ser el del prestador. Antes se
  // usaba `s.id` (id del servicio) y el link generaba un 404 (el listado y el detalle
  // usan prestador.id). Emitir una sola card por prestador también evita keys de React
  // duplicadas cuando un negocio tiene varios servicios de actividad.
  const items: ActividadPreview[] = (prestadores ?? []).flatMap((p: Record<string, unknown>) => {
    const serviciosActividad = ((p.servicios as Array<Record<string, unknown>>) ?? [])
      .filter(s => s.activo && CATS_ACTIVIDADES.has(s.categoria as CategoriaServicio));
    if (serviciosActividad.length === 0) return [];

    const principal = serviciosActividad[0];
    return [{
      id: p.id as string,
      slug: p.slug as string,
      nombre: (p.nombre as string) || (principal.nombre as string),
      descripcionCorta: (p.descripcion_corta as string | null) ?? null,
      imagenUrl: (p.imagen_portada_url as string | null) ?? null,
      tipoRecursoLabel: labelForCategoriaActividad(principal.categoria as string),
      precioDesdeEur: (principal.precio_desde as number | null) ?? null,
      capacidadMaxima: (principal.capacidad_maxima as number | null) ?? null,
    }];
  });

  if (opts.limit && opts.limit > 0) {
    return items.slice(0, opts.limit);
  }
  return items;
}

// ═════════════════════════════════════════════════════════════════════
// 4. DESTACADOS HOME
// ═════════════════════════════════════════════════════════════════════

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function getDestacadosHome(puebloId: number): Promise<DestacadoHome> {
  const supabase = await createClient();

  const [
    { data: prestadores },
    { data: actividades },
    { data: tours },
    { count: deliveryCount },
  ] = await Promise.all([
    supabase
      .from("prestadores")
      .select("id, slug, nombre, rating_promedio, imagen_portada_url, servicios(categoria)")
      .eq("pueblo_id", puebloId)
      .eq("activo", true)
      .eq("destacado", true)
      .order("rating_promedio", { ascending: false })
      .limit(10),
    supabase
      .from("prestadores")
      .select(`
        id, slug, nombre, imagen_portada_url,
        servicios!inner (id, nombre, categoria)
      `)
      .eq("pueblo_id", puebloId)
      .eq("activo", true)
      .in("servicios.categoria", Array.from(CATS_ACTIVIDADES))
      .limit(10),
    supabase
      .from("free_tours")
      .select(`
        id, slug, titulo,
        proximas:free_tour_sesiones!free_tour_sesiones_tour_id_fkey (fecha, hora, cancelada)
      `)
      .eq("pueblo_id", puebloId)
      .eq("activo", true)
      .limit(10),
    supabase
      .from("prestadores")
      .select("id", { count: "exact", head: true })
      .eq("pueblo_id", puebloId)
      .eq("activo", true)
      .eq("delivery_activo", true),
  ]);

  const negocio = pickRandom(prestadores ?? []);
  const negocioCard = negocio ? {
    id: negocio.id as string,
    slug: negocio.slug as string,
    nombre: negocio.nombre as string,
    categoria: (negocio as Record<string, unknown> & { servicios?: Array<{ categoria?: string }> }).servicios?.[0]?.categoria ?? "Negocio",
    imagen: negocio.imagen_portada_url as string | null,
    rating: Number(negocio.rating_promedio ?? 0),
  } : null;

  const actividadRaw = pickRandom(actividades ?? []);
  const actividadCard = actividadRaw ? {
    id: actividadRaw.id as string,
    slug: actividadRaw.slug as string,
    nombre: ((actividadRaw as Record<string, unknown> & { servicios?: Array<{ nombre?: string }> }).servicios?.[0]?.nombre) ?? (actividadRaw.nombre as string),
    tipo: labelForCategoriaActividad((actividadRaw as Record<string, unknown> & { servicios?: Array<{ categoria?: string }> }).servicios?.[0]?.categoria ?? "otro"),
    imagen: actividadRaw.imagen_portada_url as string | null,
  } : null;

  const today = new Date().toISOString().split("T")[0];
  type TourRaw = { id: string; slug: string; titulo: string; proximas: Array<{ fecha: string; hora: string; cancelada: boolean }> };
  const tour = (tours ?? [])
    .map((t: TourRaw) => {
      const proximas = t.proximas ?? [];
      const proxima = proximas
        .filter(s => !s.cancelada && s.fecha >= today)
        .sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`))[0];
      return proxima ? { ...t, proxima } : null;
    })
    .filter(Boolean)[0];

  const freeTourCard = tour ? {
    id: tour.id,
    slug: tour.slug,
    titulo: tour.titulo,
    proxima_fecha: (tour!.proxima as { fecha: string }).fecha,
    proxima_hora: (tour!.proxima as { hora: string }).hora,
  } : null;

  return {
    hayDelivery: (deliveryCount ?? 0) > 0,
    negocio: negocioCard,
    actividad: actividadCard,
    freeTour: freeTourCard,
  };
}

// ═════════════════════════════════════════════════════════════════════
// 5. EVENTOS
// ═════════════════════════════════════════════════════════════════════

const MES_ABREV = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

function mapEventoToCard(e: EventoDB): EventoCard {
  const d = new Date(e.fecha_inicio);
  return {
    id: e.id,
    slug: e.slug,
    titulo: e.titulo,
    descripcionCorta: e.descripcion_corta ?? e.descripcion ?? null,
    categoria: e.categoria as CategoriaEvento,
    categoriaLabel: CATEGORIA_EVENTO_LABEL[e.categoria] ?? "Evento",
    diaNumero: String(d.getDate()).padStart(2, "0"),
    diaMesAbrev: MES_ABREV[d.getMonth()],
    horaInicio: e.todo_el_dia
      ? null
      : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    lugar: e.lugar,
    gratis: e.gratis,
    precio: e.precio,
    precioDisplay: e.gratis || e.precio == null || e.precio === 0 ? "Gratis" : `${e.precio}€`,
    imagenUrl: e.imagen_url,
    esDestacado: e.destacado,
  };
}

export async function getEventos(puebloId: number): Promise<EventoCard[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .gte("fecha_inicio", now)
    .order("fecha_inicio", { ascending: true });

  if (error) {
    console.error("[getEventos]", error);
    return [];
  }
  return (data ?? []).map(e => mapEventoToCard(e as unknown as EventoDB));
}

export async function getEventosProximos(puebloId: number, limit = 3): Promise<EventoCard[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .gte("fecha_inicio", now)
    .order("destacado", { ascending: false })
    .order("fecha_inicio", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[getEventosProximos]", error);
    return [];
  }
  return (data ?? []).map(e => mapEventoToCard(e as unknown as EventoDB));
}

export async function getEventoBySlug(puebloId: number, slug: string): Promise<EventoDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("eventos")
    .select("*")
    .eq("pueblo_id", puebloId)
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();
  return (data ?? null) as EventoDB | null;
}

// ═════════════════════════════════════════════════════════════════════
// 6. RESTAURANTE COMPLETO (prestador + carta)
// ═════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════
// 7. ACTIVIDADES PÚBLICAS (prestadores comerciales con recursos)
// ═════════════════════════════════════════════════════════════════════

export interface ActividadPublica {
  prestador_id: string;
  nombre: string;
  slug: string;
  imagen: string | null;
  rating: number;
  descripcion_corta: string | null;
  tipos_recursos: string[];
  precio_desde: number | null;
}

export interface ActividadCompleta {
  id: string;
  pueblo_id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  descripcion_corta: string | null;
  imagen_portada_url: string | null;
  direccion: string;
  telefono: string;
  whatsapp: string | null;
  rating_promedio: number;
  total_reviews: number;
  servicios: import("@/types").ServicioDB[];
  horarios: import("@/types").HorarioDB[];
  recursos: import("@/types/actividades").RecursoActividadDB[];
}

export async function getActividadesPublicas(
  puebloId: number,
  filtros: { tipo?: string } = {},
): Promise<ActividadPublica[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prestadores")
    .select(`
      id, nombre, slug, descripcion_corta, imagen_portada_url, rating_promedio,
      servicios!inner (id, categoria, activo),
      recursos:actividades_recursos(tipo, precio_hora, activo)
    `)
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .in("servicios.categoria", Array.from(CATS_ACTIVIDADES));

  if (error) {
    console.error("[getActividadesPublicas]", error);
    return [];
  }

  const items: ActividadPublica[] = [];
  for (const p of (data ?? []) as unknown as Array<{
    id: string; nombre: string; slug: string; descripcion_corta: string | null;
    imagen_portada_url: string | null; rating_promedio: number;
    recursos: Array<{ tipo: string; precio_hora: number | null; activo: boolean }>;
  }>) {
    const recursosActivos = (p.recursos ?? []).filter(r => r.activo);
    if (recursosActivos.length === 0) continue;

    const tiposUnicos = [...new Set(recursosActivos.map(r => r.tipo))];
    if (filtros.tipo && !tiposUnicos.includes(filtros.tipo)) continue;

    const precioDesde = recursosActivos
      .map(r => r.precio_hora)
      .filter((v): v is number => v != null)
      .reduce<number | null>((min, v) => (min === null || v < min ? v : min), null);

    items.push({
      prestador_id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      imagen: p.imagen_portada_url,
      rating: Number(p.rating_promedio ?? 0),
      descripcion_corta: p.descripcion_corta,
      tipos_recursos: tiposUnicos,
      precio_desde: precioDesde,
    });
  }

  return items;
}

export async function getActividadCompleta(
  prestadorId: string,
): Promise<ActividadCompleta | null> {
  const supabase = await createClient();

  const [{ data: prestador }, { data: recursos }] = await Promise.all([
    supabase
      .from("prestadores")
      .select(`
        id, pueblo_id, nombre, slug, descripcion, descripcion_corta,
        telefono, whatsapp, direccion, imagen_portada_url,
        rating_promedio, total_reviews, activo,
        servicios(id, nombre, slug, descripcion, categoria, precio_desde, precio_hasta, precio_unidad, reservable, duracion_minutos, capacidad_maxima, descuento_premium_porcentaje, descuento_premium_descripcion, activo, orden_visualizacion),
        horarios(dia_semana, hora_apertura, hora_cierre, cerrado, notas)
      `)
      .eq("id", prestadorId)
      .eq("activo", true)
      .single(),
    supabase
      .from("actividades_recursos")
      .select("*")
      .eq("prestador_id", prestadorId)
      .eq("activo", true)
      .order("tipo")
      .order("orden"),
  ]);

  if (!prestador) return null;

  return {
    ...(prestador as unknown as ActividadCompleta),
    recursos: (recursos ?? []) as unknown as import("@/types/actividades").RecursoActividadDB[],
  };
}

// ═════════════════════════════════════════════════════════════════════

export interface RestauranteCompleto {
  prestador: PrestadorDB;
  platos: PlatoDB[];
}

export async function getRestauranteCompleto(
  puebloId: number,
  slug: string,
): Promise<RestauranteCompleto | null> {
  const supabase = await createClient();

  const { data: prestador, error } = await supabase
    .from("prestadores")
    .select(`
      id, pueblo_id, nombre, slug, descripcion, descripcion_corta,
      email, telefono, whatsapp, web, instagram, facebook, tiktok,
      direccion, imagen_portada_url, galeria_urls,
      verificado, activo, destacado, rating_promedio, total_reviews,
      suscripcion_plan, tipo_cocina, delivery_activo, lat:latitud, lon:longitud,
      created_at,
      servicios (
        id, nombre, slug, descripcion, categoria,
        precio_desde, precio_hasta, precio_unidad,
        reservable, duracion_minutos, capacidad_maxima,
        descuento_premium_porcentaje, descuento_premium_descripcion,
        activo, orden_visualizacion
      ),
      horarios (dia_semana, hora_apertura, hora_cierre, cerrado, notas)
    `)
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (error || !prestador) return null;
  if ((prestador as Record<string, unknown>).pueblo_id !== puebloId) return null;

  const { data: platos } = await supabase
    .from("platos")
    .select("id, prestador_id, nombre, descripcion, categoria, precio, precio_oferta, imagen_url, alergenos, vegetariano, vegano, sin_gluten, picante, disponible_local, disponible_delivery, tiempo_preparacion_min, activo, orden, created_at, updated_at")
    .eq("prestador_id", (prestador as Record<string, unknown>).id as string)
    .eq("activo", true)
    .order("categoria")
    .order("orden", { ascending: true })
    .order("nombre");

  return {
    prestador: prestador as unknown as PrestadorDB,
    platos: (platos ?? []) as PlatoDB[],
  };
}
