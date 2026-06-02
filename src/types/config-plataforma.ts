// web/src/types/config-plataforma.ts
// Shape de la tabla config_plataforma (migración 028).

export type ConfigTipo = "string" | "number" | "boolean" | "json";

export interface ConfigPlataformaItem {
  clave: string;
  valor: unknown;
  descripcion: string | null;
  tipo: ConfigTipo;
  actualizada_por: string | null;
  actualizada_en: string;
}

/**
 * Claves conocidas con sus tipos esperados.
 * Sincronizado con el SEED de migración 028.
 * Añadir aquí si se insertan claves nuevas en DB.
 */
export interface ConfigPlataformaMap {
  precio_premium_eur: number;
  comision_default_pct: number;
  min_pedido_delivery_eur: number;
  premium_activo: boolean;
  soporte_email: string;
  soporte_whatsapp: string;
}

export const CLAVES_CONFIG_CONOCIDAS = [
  "precio_premium_eur",
  "comision_default_pct",
  "min_pedido_delivery_eur",
  "premium_activo",
  "soporte_email",
  "soporte_whatsapp",
] as const satisfies ReadonlyArray<keyof ConfigPlataformaMap>;
