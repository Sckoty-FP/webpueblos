import type { RateLimitHit, RateLimitStore } from "./core";

/**
 * Store compartido sobre Upstash Redis vía su REST API (sin SDK: `fetch`
 * directo, igual que OSRM/Nominatim/SendGrid en este repo).
 *
 * Una sola llamada al endpoint `/pipeline` ejecuta de forma atómica:
 *   1. INCR key            → cuenta la petición
 *   2. EXPIRE key W NX     → fija el TTL SOLO en el primer hit (NX = no overwrite)
 *   3. TTL key             → segundos restantes de la ventana
 *
 * `fetchImpl` se inyecta para testear sin red.
 */
export class UpstashRateLimitStore implements RateLimitStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async hit(key: string, windowSec: number): Promise<RateLimitHit> {
    const res = await this.fetchImpl(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
        ["TTL", key],
      ]),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Upstash rate-limit error ${res.status}`);
    }

    // Upstash responde HTTP 200 aunque un comando del pipeline falle: el error
    // viaja por-comando en el body. Hay que mirarlo o el límite queda fail-open
    // en silencio (p.ej. token read-only → NOPERM en INCR).
    const data = (await res.json()) as Array<{ result?: number; error?: string }>;
    const failed = data.find((entry) => entry?.error);
    if (failed) {
      throw new Error(`Upstash command error: ${failed.error}`);
    }

    const count = data[0]?.result ?? 1;
    const ttl = data[2]?.result ?? windowSec;

    return { count, ttlSec: ttl > 0 ? ttl : windowSec };
  }
}
