import type { RateLimitHit, RateLimitStore } from "./core";

/**
 * Store en memoria del proceso. Sirve para desarrollo local y como FALLBACK
 * cuando no hay Upstash configurado.
 *
 * ⚠️ En producción serverless (Vercel) NO protege de verdad: cada instancia
 * tiene su propio Map y un atacante reparte sus peticiones entre instancias.
 * Para protección real en prod hace falta el store compartido (Upstash).
 *
 * El reloj se inyecta (`now`) para poder testear el vencimiento de ventana.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; expiresAtMs: number }>();

  constructor(private now: () => number = () => Date.now()) {}

  async hit(key: string, windowSec: number): Promise<RateLimitHit> {
    const nowMs = this.now();
    const bucket = this.buckets.get(key);

    // Ventana inexistente o ya expirada → arranca una nueva.
    if (!bucket || bucket.expiresAtMs <= nowMs) {
      this.buckets.set(key, { count: 1, expiresAtMs: nowMs + windowSec * 1000 });
      return { count: 1, ttlSec: windowSec };
    }

    bucket.count += 1;
    return {
      count: bucket.count,
      ttlSec: Math.ceil((bucket.expiresAtMs - nowMs) / 1000),
    };
  }
}
