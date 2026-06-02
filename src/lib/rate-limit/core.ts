/**
 * Núcleo PURO del rate limiter: ventana fija (fixed window) sobre un store
 * inyectable. Sin `fetch`, sin Upstash, sin `next/headers` → testeable en
 * aislamiento (mismo patrón que `delivery/calcular.ts` y `push/core.ts`).
 *
 * El store real (Upstash REST o memoria) se inyecta desde `index.ts`.
 */

// ─── Contratos ─────────────────────────────────────────────────────────────

export interface RateLimitHit {
  /** Nº de peticiones acumuladas en la ventana actual (incluida ésta). */
  count: number;
  /** Segundos restantes hasta que la ventana expira (reset). */
  ttlSec: number;
}

export interface RateLimitStore {
  /**
   * Registra una petición para `key` e incrementa su contador.
   * En el PRIMER hit de la ventana fija un TTL de `windowSec`.
   */
  hit(key: string, windowSec: number): Promise<RateLimitHit>;
}

export interface RateLimitRule {
  /** Máximo de peticiones permitidas dentro de la ventana. */
  limit: number;
  /** Duración de la ventana en segundos. */
  windowSec: number;
}

export interface RateLimitResult {
  /** `true` si la petición está permitida; `false` si supera el límite. */
  ok: boolean;
  /** Límite configurado (para cabeceras `X-RateLimit-*`). */
  limit: number;
  /** Peticiones restantes en la ventana (nunca negativo). */
  remaining: number;
  /** Segundos hasta el reset de la ventana. */
  resetSec: number;
}

// ─── Lógica ────────────────────────────────────────────────────────────────

/**
 * Evalúa una petición contra la regla usando el store dado.
 * La petición que cae JUSTO en el límite se permite; la siguiente se bloquea.
 */
export async function checkRateLimit(
  store: RateLimitStore,
  key: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const { count, ttlSec } = await store.hit(key, rule.windowSec);
  return {
    ok: count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    resetSec: ttlSec,
  };
}
