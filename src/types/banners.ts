// web/src/types/banners.ts
// Shape de la tabla banners_publicidad (migración 029).
// AdSlotKey debe estar sincronizado con el CHECK constraint de DB.

/**
 * Slots disponibles. Para añadir uno nuevo:
 * 1. Añadir aquí (TS).
 * 2. Añadir al CHECK constraint de DB en banners_publicidad.slot.
 * 3. Añadir `<AdSlot slot="..." />` en el lugar correspondiente del front.
 * 4. Añadir a AD_SLOT_LABEL para la UI admin.
 */
export type AdSlotKey =
  | "landing-mid"
  | "landing-pre-footer"
  | "pueblo-home-mid"
  | "pueblo-home-pre-footer"
  | "pueblo-listado-mid"
  | "pueblo-detalle-sidebar"
  | "muro-feed-mid";

export const AD_SLOT_LABEL: Record<AdSlotKey, string> = {
  "landing-mid":            "Landing institucional · entre pueblos y verticales",
  "landing-pre-footer":     "Landing institucional · antes del footer",
  "pueblo-home-mid":        "Pueblo home · mitad del feed",
  "pueblo-home-pre-footer": "Pueblo home · antes del footer",
  "pueblo-listado-mid":     "Pueblo listados · a mitad (servicios, actividades)",
  "pueblo-detalle-sidebar": "Pueblo detalle · sidebar desktop",
  "muro-feed-mid":          "Muro · entre posts del feed",
};

/** Shape exacto de la tabla `banners_publicidad` en DB. */
export interface BannerDB {
  id: string;
  slot: AdSlotKey;
  pueblo_id: number | null;       // null = global (todos los pueblos)
  titulo: string;
  imagen_url: string;
  imagen_alt: string;
  link_url: string;
  abrir_nueva_pestana: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  prioridad: number;              // 0-100
  impresiones: number;
  clicks: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}
