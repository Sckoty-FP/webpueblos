// web/src/lib/consent/consent-events.ts
// Pub/sub para notificar a scripts opt-in cuando cambia el consent.
import type { ConsentState } from "./consent-store";

type Listener = (state: ConsentState) => void;
const listeners = new Set<Listener>();

/**
 * Suscribe una función al cambio de consent. Devuelve la función para desuscribirse.
 * Uso: `useEffect(() => onConsentChange(s => setEnabled(s.analytics)), [])`.
 */
export function onConsentChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitConsentChange(state: ConsentState): void {
  for (const fn of listeners) fn(state);
}
