"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

/**
 * "Elimina" la dirección por defecto del usuario.
 *
 * No existe una tabla `usuario_direccion_default`: la dirección vive como columnas
 * en `usuarios` (`direccion_default`, `lat_default`, `lon_default`, migración 023).
 * Por eso eliminar = poner esas columnas en NULL en la fila del propio usuario.
 * El `direccionId` que llega del cliente es el `userId` (ver getDireccionesUsuario),
 * pero no lo usamos para el WHERE: filtramos por el usuario autenticado.
 */
export async function eliminarDireccion(_direccionId: string) {
  const user = await requireUser("/perfil");
  const supabase = await createClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ direccion_default: null, lat_default: null, lon_default: null })
    .eq("id", user.id);

  if (error) {
    console.error("[eliminarDireccion]", error);
    throw new Error("No se pudo eliminar la dirección");
  }

  revalidatePath("/perfil");
}
