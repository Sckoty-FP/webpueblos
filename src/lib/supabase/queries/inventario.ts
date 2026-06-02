import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { InventarioItemDB, InventarioMovimientoDB } from "@/types/inventario";

export const getInventarioItems = cache(async (prestadorId: string): Promise<InventarioItemDB[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventario_items")
    .select("*")
    .eq("prestador_id", prestadorId)
    .order("nombre");
  if (error) { console.error("[inventario] getInventarioItems:", error.message); return []; }
  return data ?? [];
});

export const getInventarioItem = cache(async (id: string): Promise<InventarioItemDB | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventario_items")
    .select("*")
    .eq("id", id)
    .single();
  if (error) { console.error("[inventario] getInventarioItem:", error.message); return null; }
  return data;
});

export async function getInventarioMovimientos(itemId: string, limit = 20): Promise<InventarioMovimientoDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventario_movimientos")
    .select("*, hecho_por_usuario:usuarios!hecho_por(nombre)")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("[inventario] getMovimientos:", error.message); return []; }
  return data ?? [];
}

export async function getInventarioBajoMinimo(prestadorId: string): Promise<InventarioItemDB[]> {
  const supabase = await createClient();
  // Supabase JS no soporta filtro columna-a-columna — filtramos en memoria
  const { data, error } = await supabase
    .from("inventario_items")
    .select("*")
    .eq("prestador_id", prestadorId)
    .eq("activo", true);
  if (error) { console.error("[inventario] getInventarioBajoMinimo:", error.message); return []; }
  return (data ?? []).filter(item => Number(item.stock_actual) <= Number(item.stock_minimo));
}

export async function crearInventarioItem(
  prestadorId: string,
  data: {
    nombre: string;
    sku?: string;
    descripcion?: string;
    unidad?: string;
    stock_actual?: number;
    stock_minimo?: number;
    precio_compra?: number;
    precio_venta?: number;
  }
): Promise<{ ok: boolean; data?: InventarioItemDB; error?: string }> {
  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("inventario_items")
    .insert({ prestador_id: prestadorId, ...data })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: item };
}

export async function actualizarInventarioItem(
  id: string,
  data: Partial<InventarioItemDB>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("inventario_items")
    .update(data)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function ajustarStock(
  itemId: string,
  prestadorId: string,
  cantidad: number,
  tipo: "entrada" | "salida" | "ajuste" | "merma",
  motivo?: string
): Promise<{ ok: boolean; nuevoStock?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: item, error: fetchError } = await supabase
    .from("inventario_items")
    .select("stock_actual")
    .eq("id", itemId)
    .single();
  if (fetchError || !item) return { ok: false, error: "Item no encontrado" };

  const delta = tipo === "salida" || tipo === "merma" ? -Math.abs(cantidad) : Math.abs(cantidad);
  const nuevoStock = Number(item.stock_actual) + delta;

  const { error: updateError } = await supabase
    .from("inventario_items")
    .update({ stock_actual: nuevoStock })
    .eq("id", itemId);
  if (updateError) return { ok: false, error: updateError.message };

  const { error: movError } = await supabase
    .from("inventario_movimientos")
    .insert({
      item_id: itemId,
      prestador_id: prestadorId,
      tipo,
      cantidad,
      motivo: motivo ?? null,
      hecho_por: user.id,
    });
  if (movError) console.error("[inventario] movimiento insert:", movError.message);

  return { ok: true, nuevoStock };
}

export async function archivarInventarioItem(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("inventario_items")
    .update({ activo: false })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
