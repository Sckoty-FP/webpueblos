"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export async function eliminarDireccion(direccionId: string) {
  const user = await requireUser("/perfil");
  const supabase = await createClient();
  const { error } = await supabase
    .from("usuario_direccion_default")
    .delete()
    .eq("id", direccionId)
    .eq("usuario_id", user.id);

  if (error) {
    console.error("[eliminarDireccion]", error);
    throw new Error("No se pudo eliminar la dirección");
  }

  revalidatePath("/perfil");
}
