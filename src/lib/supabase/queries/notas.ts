import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { NotaNegocioDB } from "@/types/notas";

export const getNotasNegocio = cache(async (prestadorId: string): Promise<NotaNegocioDB[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notas_negocio")
    .select("*, autor:usuarios!autor_id(nombre)")
    .eq("prestador_id", prestadorId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[notas] getNotasNegocio:", error.message); return []; }
  return data ?? [];
});

export async function getNota(id: string): Promise<NotaNegocioDB | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notas_negocio")
    .select("*, autor:usuarios!autor_id(nombre)")
    .eq("id", id)
    .single();
  if (error) { console.error("[notas] getNota:", error.message); return null; }
  return data;
}

export async function getRecordatoriosProximos(
  prestadorId: string,
  ventanaMs: number = 24 * 60 * 60 * 1000
): Promise<NotaNegocioDB[]> {
  const supabase = await createClient();
  const ahora = new Date();
  const hasta = new Date(ahora.getTime() + ventanaMs);

  const { data, error } = await supabase
    .from("notas_negocio")
    .select("*, autor:usuarios!autor_id(nombre)")
    .eq("prestador_id", prestadorId)
    .eq("recordatorio_completado", false)
    .gte("recordatorio_fecha", ahora.toISOString())
    .lte("recordatorio_fecha", hasta.toISOString())
    .order("recordatorio_fecha");

  if (error) { console.error("[notas] getRecordatoriosProximos:", error.message); return []; }
  return data ?? [];
}

export async function crearNota(data: {
  prestador_id: string;
  titulo: string;
  contenido?: string;
  importante?: boolean;
  recordatorio_fecha?: string;
}): Promise<{ ok: boolean; data?: NotaNegocioDB; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: nota, error } = await supabase
    .from("notas_negocio")
    .insert({ ...data, contenido: data.contenido ?? "", autor_id: user.id })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: nota };
}

export async function actualizarNota(
  id: string,
  data: Partial<Omit<NotaNegocioDB, "id" | "prestador_id" | "autor_id" | "created_at" | "updated_at" | "autor">>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notas_negocio")
    .update(data)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function marcarRecordatorioCompletado(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notas_negocio")
    .update({ recordatorio_completado: true })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function posponerRecordatorio(id: string, dias = 1): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  // Usamos rpc para hacer el +interval sin traer la fila al cliente
  const { error } = await supabase.rpc("posponer_recordatorio", { nota_id: id, dias_extra: dias });
  if (error) {
    // Fallback: traer la nota, sumar días, actualizar
    const { data: nota } = await supabase
      .from("notas_negocio")
      .select("recordatorio_fecha")
      .eq("id", id)
      .single();
    if (!nota?.recordatorio_fecha) return { ok: false, error: "Sin fecha de recordatorio" };
    const nuevaFecha = new Date(nota.recordatorio_fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    const { error: upErr } = await supabase
      .from("notas_negocio")
      .update({ recordatorio_fecha: nuevaFecha.toISOString() })
      .eq("id", id);
    if (upErr) return { ok: false, error: upErr.message };
  }
  return { ok: true };
}

export async function eliminarNota(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notas_negocio")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
