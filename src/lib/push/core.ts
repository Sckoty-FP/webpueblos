/**
 * Núcleo PURO del motor de push: orquesta in-app + reparto a dispositivos con
 * inyección de dependencias. Sin `web-push`, sin Supabase, sin `server-only` →
 * testeable en aislamiento (igual que `delivery/calcular.ts`).
 *
 * Las dependencias reales (web-push + service role) viven en `send.ts`.
 */
import { construirNotificacion, type EventoPush } from "@/lib/push/payloads";

export interface DispositivoPush {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface RegistroInApp {
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  url: string;
}

export interface NotificarDeps {
  getDispositivos: (usuarioId: string) => Promise<DispositivoPush[]>;
  enviar: (d: DispositivoPush, payloadJson: string) => Promise<{ statusCode: number }>;
  desactivar: (dispositivoId: string) => Promise<void>;
  registrarInApp: (n: RegistroInApp) => Promise<void>;
}

export interface NotificarResultado {
  enviados: number;
  fallidos: number;
  desactivados: number;
}

/** Una suscripción muerta: el navegador la dio de baja. Hay que limpiarla. */
export function suscripcionMuerta(statusCode: number): boolean {
  return statusCode === 404 || statusCode === 410;
}

/**
 * Registra in-app y reparte el push a cada dispositivo, tolerando fallos
 * individuales. No lanza por errores de envío — los cuenta.
 */
export async function notificarCore(
  usuarioId: string,
  evento: EventoPush,
  deps: NotificarDeps,
): Promise<NotificarResultado> {
  const n = construirNotificacion(evento);

  // In-app primero, pero su fallo no debe impedir el push (best-effort).
  try {
    await deps.registrarInApp({
      usuarioId,
      tipo: n.tipo,
      titulo: n.title,
      mensaje: n.body,
      url: n.url,
    });
  } catch {
    // tragado a propósito: in-app es secundario al push
  }

  const dispositivos = await deps.getDispositivos(usuarioId);
  const payloadJson = JSON.stringify({ title: n.title, body: n.body, url: n.url, tag: n.tag });

  const res: NotificarResultado = { enviados: 0, fallidos: 0, desactivados: 0 };

  for (const d of dispositivos) {
    let statusCode: number;
    try {
      ({ statusCode } = await deps.enviar(d, payloadJson));
    } catch {
      res.fallidos++;
      continue;
    }

    if (suscripcionMuerta(statusCode)) {
      await deps.desactivar(d.id);
      res.desactivados++;
    } else if (statusCode >= 200 && statusCode < 300) {
      res.enviados++;
    } else {
      res.fallidos++;
    }
  }

  return res;
}
