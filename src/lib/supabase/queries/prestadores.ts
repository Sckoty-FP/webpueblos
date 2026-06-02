import { createClient } from "@/lib/supabase/server";
import type { PrestadorDB, PrestadorCard } from "@/types";
import {
  getCatFromServicios,
  isOpenNow,
  getPrecioDisplay,
} from "@/lib/utils/prestadores";

export { getCatFromServicios, isOpenNow, getPrecioDisplay } from "@/lib/utils/prestadores";
export { horariosToDisplay } from "@/lib/utils/prestadores";

function getTags(p: PrestadorDB): string[] {
  const tags: string[] = [];
  if (p.servicios.some((s) => s.reservable)) tags.push("Reservas");
  if (p.whatsapp) tags.push("WhatsApp");
  if (p.web) tags.push("Sitio web");
  if (p.verificado) tags.push("Verificado");
  p.servicios.filter((s) => s.activo).slice(0, 2).forEach((s) => tags.push(s.nombre));
  return tags.slice(0, 5);
}

function mapToCard(p: PrestadorDB): PrestadorCard {
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
  };
}

export async function getPrestadores(puebloId: number): Promise<PrestadorCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestadores")
    .select(`
      id, nombre, slug, descripcion, descripcion_corta,
      telefono, whatsapp, web, verificado, activo, destacado,
      rating_promedio, total_reviews, imagen_portada_url, tipo_cocina, created_at,
      servicios(id, nombre, categoria, precio_desde, reservable, activo),
      horarios(dia_semana, hora_apertura, hora_cierre, cerrado)
    `)
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .order("destacado", { ascending: false })
    .order("rating_promedio", { ascending: false });

  if (error) {
    console.error("[getPrestadores] Supabase error:", error);
    return [];
  }
  if (!data) return [];
  return (data as unknown as PrestadorDB[]).map(mapToCard);
}

export async function getPrestadorBySlug(slug: string): Promise<PrestadorDB | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestadores")
    .select(`
      id, pueblo_id, nombre, slug, descripcion, descripcion_corta,
      email, telefono, whatsapp, web, instagram, facebook, tiktok,
      direccion, imagen_portada_url, galeria_urls,
      verificado, activo, destacado, rating_promedio, total_reviews,
      suscripcion_plan, tipo_cocina, delivery_activo, created_at,
      servicios(id, nombre, slug, descripcion, categoria, precio_desde, precio_hasta, precio_unidad, reservable, duracion_minutos, capacidad_maxima, descuento_premium_porcentaje, descuento_premium_descripcion, activo, orden_visualizacion),
      horarios(dia_semana, hora_apertura, hora_cierre, cerrado, notas)
    `)
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (error || !data) return null;
  return data as unknown as PrestadorDB;
}
