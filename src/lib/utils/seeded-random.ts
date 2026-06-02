// web/src/lib/utils/seeded-random.ts
// PRNG Mulberry32: rápido, distribución uniforme, seed reproducible.

/**
 * Devuelve una función PRNG que produce floats [0, 1) a partir de un seed.
 * Mismo seed → misma secuencia. Útil para ordenamientos reproducibles por hora.
 *
 * Source: https://gist.github.com/tommyettinger/46a3e58a8fce6d28d63d96b65eea7c1c
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Calcula un seed estable por "bucket" de tiempo.
 * Dentro del mismo bucket, el seed es idéntico → mismo orden en todos los servers.
 *
 * @param scope     Identificador del scope, ej. `pueblo:alcossebre:gastronomia`.
 * @param bucketMs  Milisegundos por bucket. Default 60 min.
 * @param now       Override del epoch actual (para tests).
 */
export function seedForBucket(opts: {
  scope: string;
  bucketMs?: number;
  now?: number;
}): number {
  const bucketMs = opts.bucketMs ?? 60 * 60 * 1000;
  const now = opts.now ?? Date.now();
  const bucket = Math.floor(now / bucketMs);

  // FNV-1a hash del scope
  let h = 2166136261;
  for (let i = 0; i < opts.scope.length; i++) {
    h ^= opts.scope.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }

  // Combinar bucket
  h ^= bucket;
  h = Math.imul(h, 16777619) >>> 0;
  return h;
}
