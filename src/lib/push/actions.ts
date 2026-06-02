"use server";

import { createClient } from "@/lib/supabase/server";

export interface SuscripcionPushInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

/**
 * Registra (o reactiva) el dispositivo del usuario autenticado para Web Push.
 * Upsert por endpoint: reconectar el mismo navegador reusa la fila, no duplica.
 * RLS garantiza que un usuario solo escribe sus propias filas.
 */
export async function suscribirPushAction(sub: SuscripcionPushInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado" };

  const { error } = await supabase
    .from("notif_dispositivos")
    .upsert(
      {
        usuario_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
        user_agent: sub.userAgent ?? null,
        activo: true,
      },
      { onConflict: "endpoint" },
    );

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

/** Da de baja el dispositivo (cuando el usuario desactiva las notificaciones). */
export async function desuscribirPushAction(endpoint: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado" };

  const { error } = await supabase
    .from("notif_dispositivos")
    .delete()
    .eq("endpoint", endpoint)
    .eq("usuario_id", user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
