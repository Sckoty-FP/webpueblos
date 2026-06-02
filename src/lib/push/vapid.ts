/**
 * Configuración de VAPID para Web Push.
 *
 * VAPID identifica al servidor que envía el push ante el navegador. Las claves
 * se generan UNA vez (`npx web-push generate-vapid-keys`) y van en env:
 *   - NEXT_PUBLIC_VAPID_PUBLIC_KEY  → también la usa el cliente para suscribirse
 *   - VAPID_PRIVATE_KEY             → server-only, NUNCA al cliente
 *   - VAPID_SUBJECT                 → "mailto:..." de contacto
 *
 * Si faltan las claves, el push queda deshabilitado de forma silenciosa (no
 * rompe el flujo de la app) — útil en local/CI sin VAPID configurado.
 */
import webpush from "web-push";

let configurado = false;

export function vapidDisponible(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY,
  );
}

/** Configura web-push con las claves VAPID. Idempotente. Devuelve si quedó listo. */
export function configurarVapid(): boolean {
  if (configurado) return true;
  if (!vapidDisponible()) return false;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:soporte@pueblo.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configurado = true;
  return true;
}
