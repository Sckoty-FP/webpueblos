// Configuración de Sentry para el runtime Edge (middleware, rutas edge).
// Se carga desde `instrumentation.ts`. Deshabilitado si no hay DSN.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.NODE_ENV,
});
