import { createClient } from "@/lib/supabase/server";
import type { MuroPostDB, ClasificadoDB, RutaDB } from "@/types";

export async function getMuroPosts(puebloId: number): Promise<MuroPostDB[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("muro_posts")
    .select("id, pueblo_id, autor_id, tipo, contenido, imagenes_urls, total_likes, total_comentarios, created_at, autor:usuarios!muro_posts_autor_id_fkey(nombre)")
    .eq("pueblo_id", puebloId)
    .eq("aprobado", true)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as MuroPostDB[];
}

export async function getClasificados(puebloId: number): Promise<ClasificadoDB[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("clasificados")
    .select("id, pueblo_id, autor_id, tipo, categoria, titulo, descripcion, precio, moneda, imagenes_urls, telefono_contacto, email_contacto, activo, vendido, destacado, fecha_expiracion, created_at")
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .eq("vendido", false)
    .gte("fecha_expiracion", now)
    .order("destacado", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as ClasificadoDB[];
}

export async function getRutaById(id: string): Promise<RutaDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rutas")
    .select("id, pueblo_id, nombre, slug, descripcion, descripcion_corta, tipo, dificultad, distancia_km, duracion_estimada_minutos, circular, imagen_principal_url, apto_ninos, apto_perros, activo, destacado, created_at")
    .eq("id", id)
    .eq("activo", true)
    .single();
  return (data ?? null) as RutaDB | null;
}

export async function getClasificadoById(id: string): Promise<ClasificadoDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clasificados")
    .select("id, pueblo_id, autor_id, tipo, categoria, titulo, descripcion, precio, moneda, imagenes_urls, telefono_contacto, email_contacto, activo, vendido, destacado, fecha_expiracion, created_at")
    .eq("id", id)
    .eq("activo", true)
    .single();
  return (data ?? null) as ClasificadoDB | null;
}

export async function getRutas(puebloId: number): Promise<RutaDB[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rutas")
    .select("id, pueblo_id, nombre, slug, descripcion, descripcion_corta, tipo, dificultad, distancia_km, duracion_estimada_minutos, circular, imagen_principal_url, apto_ninos, apto_perros, activo, destacado, created_at")
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .order("destacado", { ascending: false })
    .order("nombre");
  return (data ?? []) as RutaDB[];
}
