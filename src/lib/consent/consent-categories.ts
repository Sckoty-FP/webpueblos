// web/src/lib/consent/consent-categories.ts

export type ConsentCategory = "necessary" | "analytics" | "marketing";

/** Subir cuando cambien las categorías para forzar re-consent en usuarios existentes. */
export const CONSENT_VERSION = 1;

export interface CategoryInfo {
  id: ConsentCategory;
  label: string;
  description: string;
  required: boolean;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "necessary",
    label: "Estrictamente necesarias",
    description: "Cookies imprescindibles para que el sitio funcione: sesión, idioma, carrito de pedidos. No se pueden desactivar.",
    required: true,
  },
  {
    id: "analytics",
    label: "Analíticas",
    description: "Nos ayudan a entender cómo se usa el sitio para mejorarlo. Recopilamos datos agregados, no individuales.",
    required: false,
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Permiten mostrar publicidad relevante y medir su efectividad. Si las rechazás, igual verás banners — pero genéricos.",
    required: false,
  },
];

export const STORAGE_KEY = "pueblo_cookies_consent_v1";
