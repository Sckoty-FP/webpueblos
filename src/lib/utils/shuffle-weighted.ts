// web/src/lib/utils/shuffle-weighted.ts
// Algoritmo Efraimidis-Spirakis con PRNG seedeado por hora.
import { mulberry32, seedForBucket } from "./seeded-random";

interface ShuffleOpts {
  /** Scope para el seed, ej. `pueblo:alcossebre:gastronomia`. Sin scope: Math.random puro. */
  scope?: string;
  /** Ms por bucket. Default 60 min. */
  bucketMs?: number;
}

/**
 * Devuelve copia del array reordenada por pesos (Efraimidis-Spirakis).
 * - Pesos altos → más probabilidad de aparecer primero.
 * - Si se pasa `scope`, el orden es determinista dentro del bucket de tiempo.
 * - NO muta el array original.
 */
export function shuffleWeighted<T>(
  items: T[],
  weightFn: (item: T) => number,
  opts: ShuffleOpts = {},
): T[] {
  if (items.length <= 1) return [...items];

  const rng = opts.scope
    ? mulberry32(seedForBucket({ scope: opts.scope, bucketMs: opts.bucketMs }))
    : Math.random;

  const keyed = items.map(item => {
    const w = Math.max(weightFn(item), 0.0001);
    const u = rng();
    const key = -Math.log(u) / w;
    return { item, key };
  });

  keyed.sort((a, b) => a.key - b.key);
  return keyed.map(k => k.item);
}

/**
 * Fisher-Yates seedeado sin pesos. Para casos donde todos los items tienen peso igual.
 */
export function shuffleSeeded<T>(items: T[], scope?: string, bucketMs?: number): T[] {
  const arr = [...items];
  const rng = scope
    ? mulberry32(seedForBucket({ scope, bucketMs }))
    : Math.random;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
