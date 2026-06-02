// Configuración de Sentry para el navegador (cliente). En Next 16 este archivo
// reemplaza a `sentry.client.config.ts`. Deshabilitado si no hay DSN.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  // Trazas de rendimiento en cliente (bajo por defecto para la beta).
  tracesSampleRate: 0.1,
  // Session Replay: 0% de sesiones normales, 100% de las que tienen un error.
  // Solo se activa si hay DSN para no cargar el bundle de replay en balde.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: dsn ? 1.0 : 0,
  debug: false,
  environment: process.env.NODE_ENV,
});

// Permite a Sentry instrumentar las navegaciones del App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
