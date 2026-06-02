// web/src/lib/supabase/queries/config-plataforma.ts
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ConfigPlataformaItem } from "@/types/config-plataforma";

/**
 * Lee TODAS las claves en un round-trip. React.cache de-duplica dentro del render.
 */
export const getConfigCompleta = cache(async (): Promise<Record<string, unknown>> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("config_plataforma")
    .select("clave, valor");

  if (error) {
    console.error("[getConfigCompleta]", error);
    return {};
  }

  const map: Record<string, unknown> = {};
  for (const row of data ?? []) map[row.clave] = row.valor;
  return map;
});

export async function getPrecioPremiumEur(): Promise<number> {
  const cfg = await getConfigCompleta();
  const raw = cfg.precio_premium_eur;
  return typeof raw === "number" ? raw : 2;
}

export async function getPremiumActivo(): Promise<boolean> {
  const cfg = await getConfigCompleta();
  return cfg.premium_activo === true;
}

export async function getSoporteContacto(): Promise<{ email: string; whatsapp: string | null }> {
  const cfg = await getConfigCompleta();
  return {
    email: typeof cfg.soporte_email === "string" ? cfg.soporte_email : "hola@pueblo.app",
    whatsapp: typeof cfg.soporte_whatsapp === "string" ? cfg.soporte_whatsapp : null,
  };
}

export interface ConfigPlataforma {
  precio_suscripcion_mensual: number;
  comision_delivery_porcentaje: number;
  comision_free_tour_fija: number;
}

export async function getConfigPlataforma(): Promise<ConfigPlataforma> {
  const cfg = await getConfigCompleta();
  return {
    precio_suscripcion_mensual:
      typeof cfg.precio_suscripcion_mensual === "number"
        ? cfg.precio_suscripcion_mensual
        : typeof cfg.precio_premium_eur === "number"
          ? cfg.precio_premium_eur
          : 19,
    comision_delivery_porcentaje:
      typeof cfg.comision_delivery_porcentaje === "number"
        ? cfg.comision_delivery_porcentaje
        : 12,
    comision_free_tour_fija:
      typeof cfg.comision_free_tour_fija === "number"
        ? cfg.comision_free_tour_fija
        : 2,
  };
}

export async function getConfigConMetadata(): Promise<ConfigPlataformaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("config_plataforma")
    .select("clave, valor, descripcion, tipo, actualizada_en")
    .order("clave");

  if (error) {
    console.error("[getConfigConMetadata]", error);
    return [];
  }

  return (data ?? []).map(r => ({
    clave: r.clave,
    valor: r.valor,
    descripcion: r.descripcion ?? null,
    tipo: r.tipo as ConfigPlataformaItem["tipo"],
    actualizada_por: null,
    actualizada_en: r.actualizada_en,
  }));
}
