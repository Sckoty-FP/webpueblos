import { createClient } from "@/lib/supabase/server";
import type { MesaDB } from "@/types/carta";

export async function getMesasDelPrestador(prestadorId: string): Promise<MesaDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select("*")
    .eq("prestador_id", prestadorId)
    .order("numero", { ascending: true });
  if (error) { console.error("[getMesasDelPrestador]", error); return []; }
  return (data ?? []) as MesaDB[];
}

export async function getMesaById(id: string): Promise<MesaDB | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as MesaDB;
}

export async function crearMesa(
  prestadorId: string,
  data: { numero: number; nombre?: string; capacidad?: number; zona?: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("mesas").insert({
    prestador_id: prestadorId,
    numero: data.numero,
    nombre: data.nombre ?? null,
    capacidad: data.capacidad ?? 2,
    zona: data.zona ?? "interior",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function actualizarMesa(
  id: string,
  data: { nombre?: string; capacidad?: number; zona?: string; activa?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("mesas").update(data).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function eliminarMesa(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("mesas").delete().eq("id", id);
  return { ok: !error };
}
