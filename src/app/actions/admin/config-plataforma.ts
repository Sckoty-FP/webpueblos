"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export async function actualizarConfig(
  clave: string,
  valorRaw: string,
  tipo: "string" | "number" | "boolean" | "json",
) {
  const user = await requireUser("/admin/config");

  const supabase = await createClient();
  const { data: uRow } = await supabase
    .from("usuarios")
    .select("tipo")
    .eq("id", user.id)
    .single();

  if (uRow?.tipo !== "super_admin") throw new Error("Permiso denegado");

  let valor: unknown;
  switch (tipo) {
    case "number":
      valor = Number(valorRaw);
      if (Number.isNaN(valor)) throw new Error("Número inválido");
      break;
    case "boolean":
      valor = valorRaw === "true";
      break;
    case "string":
      valor = valorRaw;
      break;
    case "json":
      valor = JSON.parse(valorRaw);
      break;
  }

  const { error } = await supabase
    .from("config_plataforma")
    .update({ valor, actualizada_por: user.id })
    .eq("clave", clave);

  if (error) {
    console.error("[actualizarConfig]", error);
    throw new Error("No se pudo actualizar la configuración");
  }

  revalidateTag("config-plataforma", {});
  revalidatePath("/admin/config");
}
