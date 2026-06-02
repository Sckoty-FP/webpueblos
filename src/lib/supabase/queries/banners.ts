// web/src/lib/supabase/queries/banners.ts
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { BannerDB, AdSlotKey } from "@/types/banners";

/**
 * Devuelve EL banner activo para un slot.
 * Lógica: slot + activo + fechas vigentes. Si hay banners global y específico, gana el específico.
 * React.cache evita queries duplicadas cuando dos <AdSlot /> del mismo render comparten slot.
 */
export const getBannerParaSlot = cache(async (
  slot: AdSlotKey,
  puebloId: number | null,
): Promise<BannerDB | null> => {
  const supabase = await createClient();
  const now = new Date().toISOString();

  let q = supabase
    .from("banners_publicidad")
    .select("*")
    .eq("slot", slot)
    .eq("activo", true)
    .or(`fecha_inicio.is.null,fecha_inicio.lte.${now}`)
    .or(`fecha_fin.is.null,fecha_fin.gte.${now}`);

  if (puebloId !== null) {
    q = q.or(`pueblo_id.is.null,pueblo_id.eq.${puebloId}`);
  } else {
    q = q.is("pueblo_id", null);
  }

  const { data, error } = await q
    .order("prioridad", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[getBannerParaSlot]", error);
    return null;
  }
  if (!data || data.length === 0) return null;

  if (puebloId !== null) {
    const especifico = (data as BannerDB[]).find(b => b.pueblo_id === puebloId);
    if (especifico) return especifico;
  }
  return data[0] as BannerDB;
});

/** Listado completo para el panel admin (incluye inactivos). */
export async function getBannersAdmin(): Promise<BannerDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("banners_publicidad")
    .select("*")
    .order("slot")
    .order("prioridad", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getBannersAdmin]", error);
    return [];
  }
  return (data ?? []) as BannerDB[];
}
