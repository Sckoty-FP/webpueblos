// web/src/lib/consent/consent-store.ts
import type { ConsentCategory } from "./consent-categories";
import { CONSENT_VERSION, STORAGE_KEY } from "./consent-categories";

export type ConsentState = Record<ConsentCategory, boolean>;

export interface PersistedConsent {
  version: number;
  decidedAt: string;
  state: ConsentState;
}

const DEFAULT_STATE: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

/**
 * Lee el consent guardado. Devuelve null si no hay o si la versión es vieja.
 * Solo disponible en cliente (localStorage).
 */
export function readConsent(): PersistedConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(state: ConsentState): PersistedConsent {
  const data: PersistedConsent = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    state: { ...state, necessary: true },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage lleno o bloqueado — ignorar
  }
  return data;
}

export function resetConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export function hasConsent(cat: ConsentCategory): boolean {
  const c = readConsent();
  if (!c) return cat === "necessary";
  return !!c.state[cat];
}

export function acceptAll(): ConsentState {
  return saveConsent({ necessary: true, analytics: true, marketing: true }).state;
}

export function rejectAll(): ConsentState {
  return saveConsent({ ...DEFAULT_STATE }).state;
}
