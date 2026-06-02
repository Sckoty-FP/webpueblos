"use server";

import { contactoSchema } from "@/types/contacto";
import { registrarContacto } from "@/lib/supabase/queries/contactos";
import { rateLimit } from "@/lib/rate-limit";
import { PUBLIC_FORM } from "@/lib/rate-limit/policies";

export type ContactoResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function enviarContacto(formData: FormData): Promise<ContactoResult> {
  const rl = await rateLimit("contacto", PUBLIC_FORM);
  if (!rl.ok) {
    return { ok: false, error: `Demasiados envíos. Probá de nuevo en ${rl.resetSec}s.` };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = contactoSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisá los campos marcados",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Honeypot anti-spam: si el campo oculto llega rellenado, simular éxito
  if (parsed.data.website) {
    return { ok: true };
  }

  const result = await registrarContacto(parsed.data);

  if (!result.ok) {
    return {
      ok: false,
      error: "No pudimos guardar tu mensaje. Probá de nuevo en un momento.",
    };
  }

  return { ok: true };
}
