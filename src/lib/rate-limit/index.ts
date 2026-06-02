import "server-only";
import { headers } from "next/headers";

import { checkRateLimit, type RateLimitResult, type RateLimitRule, type RateLimitStore } from "./core";
import { getClientIp } from "./client-ip";
import { MemoryRateLimitStore } from "./store-memory";
import { UpstashRateLimitStore } from "./store-upstash";

export type { RateLimitResult, RateLimitRule } from "./core";

// El store se resuelve una vez y se cachea a nivel de módulo.
let store: RateLimitStore | null = null;

function getStore(): RateLimitStore {
  if (store) return store;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    store = new UpstashRateLimitStore(url, token);
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN no configurados — usando store en memoria. " +
          "NO protege en serverless multi-instancia. Configurá Upstash en producción.",
      );
    }
    store = new MemoryRateLimitStore();
  }

  return store;
}

/**
 * Aplica rate limit a la petición ACTUAL usando la IP del cliente.
 *
 * `scope` separa namespaces para que el límite de un endpoint no consuma el de
 * otro (p.ej. `"contacto"` y `"free-tour"` son contadores independientes).
 *
 * Uso típico al inicio de una server action pública:
 * ```ts
 * const rl = await rateLimit("contacto", PUBLIC_FORM);
 * if (!rl.ok) return { ok: false, error: `Demasiados intentos. Probá en ${rl.resetSec}s.` };
 * ```
 */
export async function rateLimit(scope: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const ip = getClientIp(await headers()) ?? "desconocida";
  return checkRateLimit(getStore(), `rl:${scope}:${ip}`, rule);
}
