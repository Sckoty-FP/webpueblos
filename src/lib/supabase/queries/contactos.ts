// web/src/lib/supabase/queries/contactos.ts
import { createClient } from "@/lib/supabase/server";
import type { ContactoInput } from "@/types/contacto";

/**
 * Inserta un contacto en la tabla `contactos_recibidos`.
 * La RLS de la tabla permite INSERT anónimo (usada desde server actions).
 */
export async function registrarContacto(
  data: ContactoInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("contactos_recibidos")
    .insert({
      tipo: data.tipo,
      nombre: data.nombre || null,
      email: data.email,
      telefono: data.telefono || null,
      pueblo_interes: data.pueblo_interes || null,
      mensaje: data.mensaje,
    });

  if (error) {
    console.error("[registrarContacto]", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
