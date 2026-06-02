// Configuración de Sentry para el runtime Node (server). Se carga desde
// `instrumentation.ts`. Si no hay DSN, Sentry queda deshabilitado y no envía
// nada → seguro para desarrollo local y para deploys sin la cuenta aún creada.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  // Muestreo de trazas de rendimiento. Bajo por defecto para no gastar cuota
  // en la beta; subir si hace falta más detalle de performance.
  tracesSampleRate: 0.1,
  // En prod no logueamos el SDK; en dev sí para depurar la integración.
  debug: false,
  environment: process.env.NODE_ENV,
});
