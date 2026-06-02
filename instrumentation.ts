// Punto de entrada de instrumentación de Next 16. Carga la config de Sentry
// según el runtime y expone el hook de captura de errores de request.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captura errores de Server Components, route handlers y server actions.
export const onRequestError = Sentry.captureRequestError;
