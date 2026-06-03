"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { MURO_POST } from "@/lib/rate-limit/policies";
import type { MuroPostDB } from "@/types";

const PostSchema = z
  .object({
    pueblo_id: z.coerce.number().int(),
    tipo: z.enum(["general", "pregunta", "recomendacion", "evento", "aviso"]).default("general"),
    contenido: z.string().max(500).default(""),
    imagen_url: z.string().url().optional(),
  })
  .refine((d) => d.contenido.trim().length >= 5 || !!d.imagen_url, {
    message: "Escribí al menos 5 caracteres o agregá una foto.",
  });

export async function crearPostMuro(
  formData: FormData,
): Promise<{ ok: true; post: MuroPostDB } | { ok: false; error: string }> {
  // Anti-spam: el rate-limit vive acá (server). El alta del muro DEBE pasar por
  // este action, no por un INSERT directo desde el cliente, o el límite no aplica.
  const rl = await rateLimit("muro", MURO_POST);
  if (!rl.ok) {
    return { ok: false, error: `Vas muy rápido. Esperá ${rl.resetSec}s antes de publicar de nuevo.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = PostSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { pueblo_id, tipo, contenido, imagen_url } = parsed.data;

  const { data, error } = await supabase
    .from("muro_posts")
    .insert({
      pueblo_id,
      autor_id: user.id,
      tipo,
      // ' ' como fallback para posts solo-foto (la base exige contenido 1–2000).
      contenido: contenido.trim() || " ",
      imagenes_urls: imagen_url ? [imagen_url] : [],
    })
    .select(
      "id, pueblo_id, autor_id, tipo, contenido, imagenes_urls, total_likes, total_comentarios, created_at",
    )
    .single();

  if (error || !data) {
    console.error("[crearPostMuro]", error);
    return { ok: false, error: "Error al publicar" };
  }

  return { ok: true, post: { ...(data as MuroPostDB), autor: null } };
}
