"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Boundary de último recurso: captura errores del root layout. Por eso debe
 * renderizar su propio <html>/<body> (el layout falló, no hay envoltorio).
 * Sin estilos de Tailwind garantizados → estilos inline mínimos.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
          color: "#171717",
        }}
      >
        <p style={{ fontSize: "48px", margin: 0 }}>🌊</p>
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: "8px 0" }}>
          Algo se rompió
        </h1>
        <p style={{ color: "#737373", fontSize: "14px", maxWidth: "28rem", margin: "0 0 24px" }}>
          Tuvimos un problema inesperado. Ya nos enteramos y lo estamos mirando.
        </p>
        <button
          onClick={reset}
          style={{
            borderRadius: "9999px",
            background: "#171717",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
        {error.digest && (
          <p style={{ marginTop: "24px", fontFamily: "monospace", fontSize: "11px", color: "#a3a3a3" }}>
            ref: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
