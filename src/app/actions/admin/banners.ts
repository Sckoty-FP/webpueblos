"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import type { AdSlotKey } from "@/types/banners";

async function assertSuperAdmin() {
  const user = await requireUser("/admin/publicidad");
  const supabase = await createClient();
  const { data } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
  if (data?.tipo !== "super_admin") throw new Error("Permiso denegado");
  return { user, supabase };
}

export interface BannerInput {
  slot: AdSlotKey;
  titulo: string;
  imagen_url: string;
  imagen_alt: string;
  link_url: string;
  abrir_nueva_pestana: boolean;
  prioridad: number;
  pueblo_id: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export async function crearBanner(input: BannerInput) {
  const { supabase } = await assertSuperAdmin();
  const { error } = await supabase.from("banners_publicidad").insert({ ...input, activo: true });
  if (error) { console.error("[crearBanner]", error); throw new Error("No se pudo crear el banner"); }
  revalidateTag("banners", {});
  revalidatePath("/admin/publicidad");
}

export async function actualizarBanner(id: string, input: Partial<BannerInput>) {
  const { supabase } = await assertSuperAdmin();
  const { error } = await supabase.from("banners_publicidad").update(input).eq("id", id);
  if (error) { console.error("[actualizarBanner]", error); throw new Error("No se pudo actualizar el banner"); }
  revalidateTag("banners", {});
  revalidatePath("/admin/publicidad");
}

export async function eliminarBanner(id: string) {
  const { supabase } = await assertSuperAdmin();
  const { error } = await supabase.from("banners_publicidad").delete().eq("id", id);
  if (error) { console.error("[eliminarBanner]", error); throw new Error("No se pudo eliminar el banner"); }
  revalidateTag("banners", {});
  revalidatePath("/admin/publicidad");
}

export async function toggleBannerActivo(id: string, activo: boolean) {
  const { supabase } = await assertSuperAdmin();
  const { error } = await supabase.from("banners_publicidad").update({ activo }).eq("id", id);
  if (error) { console.error("[toggleBannerActivo]", error); throw new Error("No se pudo actualizar el banner"); }
  revalidateTag("banners", {});
  revalidatePath("/admin/publicidad");
}
