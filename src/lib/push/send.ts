/**
 * Dependencias REALES del motor de push (web-push + Supabase service role) y el
 * entrypoint `notificar` que consumen los server actions.
 *
 * La lógica de orquestación (testeable) vive en `core.ts`. Aquí solo se ligan
 * las implementaciones reales. El envío usa el service role (bypassa RLS) porque
 * notifica a un usuario distinto del que ejecuta la acción (ej. el cliente avisa
 * al negocio). `notificar` es best-effort: NUNCA lanza, no debe tumbar el flujo.
 */
import "server-only";
import webpush, { WebPushError } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { configurarVapid } from "@/lib/push/vapid";
import type { EventoPush } from "@/lib/push/payloads";
import {
  notificarCore,
  type NotificarDeps,
  type DispositivoPush,
  type NotificarResultado,
} from "@/lib/push/core";

export type { NotificarResultado } from "@/lib/push/core";

function depsReales(): NotificarDeps {
  const supabase = createAdminClient();

  return {
    async getDispositivos(usuarioId) {
      const { data } = await supabase
        .from("notif_dispositivos")
        .select("id, endpoint, p256dh, auth")
        .eq("usuario_id", usuarioId)
        .eq("activo", true);
      return (data ?? []) as DispositivoPush[];
    },

    async enviar(d, payloadJson) {
      const subscription = {
        endpoint: d.endpoint,
        keys: { p256dh: d.p256dh, auth: d.auth },
      };
      try {
        const r = await webpush.sendNotification(subscription, payloadJson);
        return { statusCode: r.statusCode };
      } catch (e) {
        if (e instanceof WebPushError) return { statusCode: e.statusCode };
        throw e; // error de red real → lo cuenta el core como fallido
      }
    },

    async desactivar(dispositivoId) {
      await supabase
        .from("notif_dispositivos")
        .update({ activo: false })
        .eq("id", dispositivoId);
    },

    async registrarInApp(n) {
      await supabase.from("notificaciones").insert({
        usuario_id: n.usuarioId,
        tipo: n.tipo,
        titulo: n.titulo,
        mensaje: n.mensaje,
        url_accion: n.url,
      });
    },
  };
}

/**
 * Notifica a un usuario por push + in-app. Best-effort: nunca lanza.
 * Si VAPID no está configurado, solo registra in-app (el push se omite).
 */
export async function notificar(
  usuarioId: string,
  evento: EventoPush,
): Promise<NotificarResultado> {
  try {
    const listo = configurarVapid();
    const deps = depsReales();
    if (!listo) {
      return await notificarCore(usuarioId, evento, { ...deps, getDispositivos: async () => [] });
    }
    return await notificarCore(usuarioId, evento, deps);
  } catch (e) {
    console.error("[push] notificar falló:", e);
    return { enviados: 0, fallidos: 0, desactivados: 0 };
  }
}
