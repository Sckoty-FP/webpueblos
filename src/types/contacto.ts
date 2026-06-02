// web/src/types/contacto.ts
// Schema Zod + tipos para /contacto y tabla contactos_recibidos (migración 031).

import { z } from "zod";

/**
 * Valores del CHECK constraint en DB (migración 031).
 * Si se añade un tipo nuevo, actualizarlo también en el CHECK de la migración.
 */
export const TIPO_CONTACTO_VALUES = [
  "negocio",
  "ayuntamiento",
  "turista",
  "interesado_pueblo",
  "premium-interes",
  "otro",
] as const;

export type TipoContacto = (typeof TIPO_CONTACTO_VALUES)[number];

export const TIPO_CONTACTO_LABEL: Record<TipoContacto, string> = {
  negocio:            "Tengo un negocio",
  ayuntamiento:       "Soy del ayuntamiento",
  turista:            "Soy turista / vecino",
  interesado_pueblo:  "Quiero PUEBLO en mi pueblo",
  "premium-interes":  "Quiero saber cuándo está Premium",
  otro:               "Otro",
};

/** Schema usado en el form /contacto y re-validado en el server action. */
export const contactoSchema = z.object({
  tipo: z.enum(TIPO_CONTACTO_VALUES),
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(120),
  email: z.string().email("Email inválido").max(255),
  telefono: z.string().max(40).optional().or(z.literal("")),
  pueblo_interes: z.string().max(120).optional().or(z.literal("")),
  mensaje: z.string().min(10, "Contanos un poco más (mínimo 10 caracteres)").max(2000),
  // Honeypot anti-spam — debe llegar vacío; bots lo rellenan
  website: z.string().max(0).optional(),
});

export type ContactoInput = z.infer<typeof contactoSchema>;

/** Shape exacto de la tabla `contactos_recibidos` en DB. */
export interface ContactoRecibidoDB {
  id: string;
  tipo: TipoContacto;
  nombre: string | null;
  email: string;
  telefono: string | null;
  pueblo_interes: string | null;
  mensaje: string | null;
  metadata: Record<string, unknown> | null;
  leido: boolean;
  notas_internas: string | null;
  estado: "pendiente" | "en_proceso" | "respondido" | "spam" | "cerrado";
  created_at: string;
  updated_at: string;
}
