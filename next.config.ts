import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Native SWC binaries are blocked by Windows Application Control policy.
  // Using Webpack (WASM-based) as fallback.
  experimental: {},
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      {
        source: "/:pueblo/restaurantes/:slug/carta",
        destination: "/:pueblo/gastronomia/:slug",
        permanent: true,
      },
      {
        source: "/:pueblo/restaurantes/:slug",
        destination: "/:pueblo/gastronomia/:slug",
        permanent: true,
      },
    ];
  },
};

// Envuelve la config con Sentry. Si faltan org/project/authToken (p.ej. en
// local), el plugin solo omite la subida de source maps — NO rompe el build.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Oculta el endpoint de Sentry tras una ruta del propio dominio para
  // esquivar bloqueadores de anuncios que tiran los eventos del cliente.
  tunnelRoute: "/monitoring",
  // Treeshake los logs de debug del SDK en producción (reemplaza al
  // deprecado `disableLogger`).
  webpack: { treeshake: { removeDebugLogging: true } },
});

