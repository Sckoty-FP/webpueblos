"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface ErrorStateProps {
  /** El error capturado por el boundary de Next. */
  error: Error & { digest?: string };
  /** Reintenta renderizar el segmento que falló. */
  reset: () => void;
  /** Título contextual del segmento (p.ej. "el panel", "este pueblo"). */
  contexto?: string;
}

/**
 * UI compartida de los error boundaries. Reporta a Sentry una sola vez al
 * montar y ofrece reintentar. Si Sentry no tiene DSN, `captureException`
 * no hace nada (no-op), así que es seguro llamarlo siempre.
 */
export default function ErrorState({ error, reset, contexto }: ErrorStateProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-5xl">🌊</p>
      <h1
        className="mb-2 text-2xl font-semibold text-neutral-900"
        style={{ fontFamily: "var(--font-fraunces-var), serif" }}
      >
        Algo se rompió{contexto ? ` en ${contexto}` : ""}
      </h1>
      <p className="mb-6 max-w-md text-sm text-neutral-500">
        Ya nos enteramos del problema y lo estamos mirando. Probá de nuevo en un momento.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Reintentar
        </button>
        <a
          href="/"
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Volver al inicio
        </a>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-[11px] text-neutral-400">ref: {error.digest}</p>
      )}
    </div>
  );
}
