import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit }            from '@/lib/rate-limit/core';
import { getClientIp }               from '@/lib/rate-limit/client-ip';
import { MemoryRateLimitStore }      from '@/lib/rate-limit/store-memory';
import { UpstashRateLimitStore }     from '@/lib/rate-limit/store-upstash';
import type { RateLimitStore, RateLimitRule } from '@/lib/rate-limit/core';

// ─── Regla base de prueba ─────────────────────────────────────────────────
const RULE: RateLimitRule = { limit: 3, windowSec: 60 };

/** Store falso con TTL fijo — aísla la lógica de `checkRateLimit`. */
function fakeStore(): RateLimitStore {
  const counts = new Map<string, number>();
  return {
    async hit(key) {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return { count: next, ttlSec: 60 };
    },
  };
}

// ─── checkRateLimit ────────────────────────────────────────────────────────
describe('checkRateLimit', () => {
  it('permite hasta el límite y bloquea a partir de ahí', async () => {
    const store = fakeStore();

    const r1 = await checkRateLimit(store, 'rl:test:ip', RULE);
    const r2 = await checkRateLimit(store, 'rl:test:ip', RULE);
    const r3 = await checkRateLimit(store, 'rl:test:ip', RULE);
    const r4 = await checkRateLimit(store, 'rl:test:ip', RULE);

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r3.ok).toBe(true);   // 3ª petición: justo en el límite → permitida
    expect(r4.ok).toBe(false);  // 4ª petición: supera el límite → bloqueada
  });

  it('decrementa remaining y nunca baja de 0', async () => {
    const store = fakeStore();

    expect((await checkRateLimit(store, 'k', RULE)).remaining).toBe(2);
    expect((await checkRateLimit(store, 'k', RULE)).remaining).toBe(1);
    expect((await checkRateLimit(store, 'k', RULE)).remaining).toBe(0);
    expect((await checkRateLimit(store, 'k', RULE)).remaining).toBe(0); // no negativo
  });

  it('aísla claves distintas (IPs distintas no se afectan)', async () => {
    const store = fakeStore();

    await checkRateLimit(store, 'ip-a', RULE);
    await checkRateLimit(store, 'ip-a', RULE);
    await checkRateLimit(store, 'ip-a', RULE);
    const otra = await checkRateLimit(store, 'ip-b', RULE);

    expect(otra.ok).toBe(true);
    expect(otra.remaining).toBe(2);
  });

  it('propaga el TTL del store como resetSec y devuelve el límite', async () => {
    const r = await checkRateLimit(fakeStore(), 'k', RULE);
    expect(r.resetSec).toBe(60);
    expect(r.limit).toBe(3);
  });
});

// ─── MemoryRateLimitStore ──────────────────────────────────────────────────
describe('MemoryRateLimitStore', () => {
  it('cuenta dentro de la ventana y resetea cuando expira', async () => {
    let now = 1_000_000;
    const store = new MemoryRateLimitStore(() => now);

    const a = await store.hit('k', 10);
    const b = await store.hit('k', 10);
    expect(a.count).toBe(1);
    expect(b.count).toBe(2);
    expect(a.ttlSec).toBe(10);

    // Avanza más allá de la ventana → la cuenta arranca de nuevo en 1
    now += 11_000;
    const c = await store.hit('k', 10);
    expect(c.count).toBe(1);
  });

  it('el ttl decrece a medida que avanza el tiempo dentro de la ventana', async () => {
    let now = 0;
    const store = new MemoryRateLimitStore(() => now);

    await store.hit('k', 60);     // ventana abierta hasta t=60s
    now += 25_000;                // han pasado 25s
    const r = await store.hit('k', 60);
    expect(r.ttlSec).toBe(35);    // quedan 35s
  });
});

// ─── UpstashRateLimitStore ─────────────────────────────────────────────────
describe('UpstashRateLimitStore', () => {
  it('llama al endpoint /pipeline con INCR + EXPIRE NX + TTL y parsea el resultado', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: 2 }, { result: 0 }, { result: 47 }],
    });

    const store = new UpstashRateLimitStore('https://x.upstash.io', 'tok', fetchMock as unknown as typeof fetch);
    const r = await store.hit('rl:contacto:1.2.3.4', 60);

    expect(r.count).toBe(2);
    expect(r.ttlSec).toBe(47);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://x.upstash.io/pipeline');
    expect(init.headers.Authorization).toBe('Bearer tok');
    const body = JSON.parse(init.body);
    expect(body[0]).toEqual(['INCR', 'rl:contacto:1.2.3.4']);
    expect(body[1]).toEqual(['EXPIRE', 'rl:contacto:1.2.3.4', '60', 'NX']);
    expect(body[2]).toEqual(['TTL', 'rl:contacto:1.2.3.4']);
  });

  it('lanza si Upstash responde con error HTTP', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    const store = new UpstashRateLimitStore('https://x.upstash.io', 'tok', fetchMock as unknown as typeof fetch);
    await expect(store.hit('k', 60)).rejects.toThrow(/500/);
  });

  it('lanza si un comando del pipeline falla (no fail-open silencioso)', async () => {
    // Upstash devuelve HTTP 200 con el error por-comando (p.ej. token read-only).
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { error: "NOPERM this user has no permissions to run the 'incr' command" },
        { result: -2 },
      ],
    });
    const store = new UpstashRateLimitStore('https://x.upstash.io', 'tok', fetchMock as unknown as typeof fetch);
    await expect(store.hit('k', 60)).rejects.toThrow(/NOPERM/);
  });
});

// ─── getClientIp ───────────────────────────────────────────────────────────
describe('getClientIp', () => {
  const h = (entries: Record<string, string>) => ({
    get: (name: string) => entries[name.toLowerCase()] ?? null,
  });

  it('toma la primera IP de x-forwarded-for', () => {
    expect(getClientIp(h({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1, 10.0.0.2' }))).toBe('1.2.3.4');
  });

  it('soporta x-forwarded-for con una sola IP', () => {
    expect(getClientIp(h({ 'x-forwarded-for': '8.8.8.8' }))).toBe('8.8.8.8');
  });

  it('cae a x-real-ip si no hay x-forwarded-for', () => {
    expect(getClientIp(h({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9');
  });

  it('devuelve null si no hay cabeceras fiables', () => {
    expect(getClientIp(h({}))).toBeNull();
  });
});
