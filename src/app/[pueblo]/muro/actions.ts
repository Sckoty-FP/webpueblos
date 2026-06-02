"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { MURO_POST } from "@/lib/rate-limit/policies";

const PostSchema = z.object({
  pueblo_id: z.coerce.number().int(),
  tipo: z.enum(["general", "pregunta", "recomendacion", "evento", "aviso"]),
  contenido: z.string().min(5).max(500),
});

export async function crearPostMuro(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
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
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const { error } = await supabase.from("muro_posts").insert({
    pueblo_id: parsed.data.pueblo_id,
    autor_id: user.id,
    tipo: parsed.data.tipo,
    contenido: parsed.data.contenido,
    imagenes_urls: [],
  });

  if (error) {
    console.error("[crearPostMuro]", error);
    return { ok: false, error: "Error al publicar" };
  }
  return { ok: true };
}
