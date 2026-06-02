import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MovimientoCajaDB, ResumenCajaMes } from "@/types/caja";

export const getMovimientosCaja = cache(async (
  prestadorId: string,
  year: number,
  month: number
): Promise<MovimientoCajaDB[]> => {
  const supabase = await createClient();
  const desde = `${year}-${String(month).padStart(2, "0")}-01`;
  const hasta = new Date(year, month, 0).toISOString().slice(0, 10); // último día del mes

  const { data, error } = await supabase
    .from("movimientos_caja")
    .select("*")
    .eq("prestador_id", prestadorId)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: false });

  if (error) { console.error("[caja] getMovimientosCaja:", error.message); return []; }
  return data ?? [];
});

export async function getResumenCajaMes(
  prestadorId: string,
  year: number,
  month: number
): Promise<ResumenCajaMes> {
  const movimientos = await getMovimientosCaja(prestadorId, year, month);

  const ingresos = movimientos.filter(m => m.tipo === "ingreso");
  const egresos  = movimientos.filter(m => m.tipo === "egreso");

  const totalIngresos = ingresos.reduce((s, m) => s + Number(m.importe), 0);
  const totalEgresos  = egresos.reduce((s, m) => s + Number(m.importe), 0);

  // Desglose por categoría
  const porCategoria: Record<string, number> = {};
  for (const m of movimientos) {
    porCategoria[m.categoria] = (porCategoria[m.categoria] ?? 0) + Number(m.importe);
  }

  return {
    year,
    month,
    total_ingresos: totalIngresos,
    total_egresos: totalEgresos,
    balance: totalIngresos - totalEgresos,
    total_movimientos: movimientos.length,
    por_categoria: porCategoria,
  };
}

export async function crearMovimientoCaja(data: {
  prestador_id: string;
  tipo: "ingreso" | "egreso";
  categoria: string;
  concepto: string;
  importe: number;
  metodo: "efectivo" | "tarjeta" | "transferencia" | "bizum" | "otro";
  fecha?: string;
  notas?: string;
  es_automatico?: boolean;
  pedido_delivery_id?: string;
  reserva_id?: string;
}): Promise<{ ok: boolean; data?: MovimientoCajaDB; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: mov, error } = await supabase
    .from("movimientos_caja")
    .insert({ ...data, registrado_por: user.id })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: mov };
}

export async function getMovimientosDia(
  prestadorId: string,
  fecha: string
): Promise<MovimientoCajaDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movimientos_caja")
    .select("*")
    .eq("prestador_id", prestadorId)
    .eq("fecha", fecha)
    .order("created_at", { ascending: false });
  if (error) { console.error("[caja] getMovimientosDia:", error.message); return []; }
  return data ?? [];
}
