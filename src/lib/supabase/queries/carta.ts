import { createClient } from "@/lib/supabase/server";
import type { PlatoDB } from "@/types/pedidos";

export async function getPlatosDelPrestador(prestadorId: string): Promise<PlatoDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platos")
    .select("*")
    .eq("prestador_id", prestadorId)
    .order("categoria", { ascending: true })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) { console.error("[getPlatosDelPrestador]", error); return []; }
  return (data ?? []) as PlatoDB[];
}

export async function getPlatosPublicos(prestadorId: string): Promise<PlatoDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platos")
    .select("id, prestador_id, nombre, descripcion, categoria, precio, precio_oferta, imagen_url, alergenos, vegetariano, vegano, sin_gluten, picante, disponible_local, disponible_delivery, tiempo_preparacion_min, activo, orden, created_at, updated_at")
    .eq("prestador_id", prestadorId)
    .eq("activo", true)
    .order("categoria", { ascending: true })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) { console.error("[getPlatosPublicos]", error); return []; }
  return (data ?? []) as PlatoDB[];
}

export async function crearPlato(
  prestadorId: string,
  data: {
    nombre: string;
    descripcion?: string;
    categoria: string;
    precio: number;
    precio_oferta?: number;
    imagen_url?: string;
    alergenos?: string[];
    vegetariano?: boolean;
    vegano?: boolean;
    sin_gluten?: boolean;
    picante?: number;
    disponible_local?: boolean;
    disponible_delivery?: boolean;
    tiempo_preparacion_min?: number;
    orden?: number;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("platos").insert({
    prestador_id: prestadorId,
    nombre: data.nombre,
    descripcion: data.descripcion ?? null,
    categoria: data.categoria,
    precio: data.precio,
    precio_oferta: data.precio_oferta ?? null,
    imagen_url: data.imagen_url ?? null,
    alergenos: data.alergenos ?? [],
    vegetariano: data.vegetariano ?? false,
    vegano: data.vegano ?? false,
    sin_gluten: data.sin_gluten ?? false,
    picante: data.picante ?? null,
    disponible_local: data.disponible_local ?? true,
    disponible_delivery: data.disponible_delivery ?? false,
    tiempo_preparacion_min: data.tiempo_preparacion_min ?? 15,
    orden: data.orden ?? 0,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function actualizarPlato(
  id: string,
  data: Partial<Omit<PlatoDB, "id" | "prestador_id" | "created_at" | "updated_at">>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("platos").update(data).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function togglePlatoDisponibilidad(
  id: string,
  campo: "disponible_local" | "disponible_delivery" | "activo",
  valor: boolean
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("platos").update({ [campo]: valor }).eq("id", id);
  return { ok: !error };
}

export async function eliminarPlato(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("platos").update({ activo: false }).eq("id", id);
  return { ok: !error };
}
