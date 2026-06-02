import type { NominatimResult } from '@/types/delivery';

const NOMINATIM_BASE =
  process.env.NEXT_PUBLIC_NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org';

// Nominatim exige User-Agent identificable. Sin él las peticiones pueden ser rechazadas.
const HEADERS: HeadersInit = {
  'User-Agent': 'PUEBLO-App/1.0 contact:eliasblanco.vxc@gmail.com',
  Accept:       'application/json',
};

// ─── Throttle simple (1 req / s) ─────────────────────────────────────────
// Nominatim limita a 1 petición por segundo por IP.
// Este throttle es suficiente para el volumen del servidor (checkout = 1 request a la vez).
// Si en algún momento se necesita concurrencia real, reemplazar con un token bucket o cola.

let lastReqAt = 0;

async function aguardarThrottle(): Promise<void> {
  const ahora = Date.now();
  const espera = 1_000 - (ahora - lastReqAt);
  if (espera > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, espera));
  }
  lastReqAt = Date.now();
}

// ─── Forward geocoding ────────────────────────────────────────────────────

/**
 * Busca direcciones que coincidan con el texto libre `query`.
 * Limitado a España (countrycodes=es).
 *
 * Uso: autocompletar el campo de dirección en el checkout mientras el usuario escribe.
 * Recomendación: debounce mínimo 400 ms antes de llamar para no saturar.
 */
export async function geocodeAddress(
  query:  string,
  limit:  number = 5,
): Promise<NominatimResult[]> {
  await aguardarThrottle();

  const params = new URLSearchParams({
    q:              query,
    format:         'json',
    countrycodes:   'es',
    limit:          String(limit),
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: HEADERS,
  });

  if (!res.ok) {
    throw new Error(`Nominatim search error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<NominatimResult[]>;
}

// ─── Reverse geocoding ────────────────────────────────────────────────────

/**
 * Convierte coordenadas a dirección postal legible.
 *
 * Uso: cuando el usuario suelta el pin en el mapa de dirección del checkout,
 * actualizar automáticamente el campo de texto con la dirección encontrada.
 *
 * Retorna null si Nominatim no encuentra nada en esas coordenadas.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<NominatimResult | null> {
  await aguardarThrottle();

  const params = new URLSearchParams({
    lat:            String(lat),
    lon:            String(lon),
    format:         'json',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: HEADERS,
  });

  if (!res.ok) return null;

  const json = await res.json() as NominatimResult & { error?: string };
  if (json.error) return null;

  return json;
}

// ─── Helper: formatear dirección para el campo de texto ───────────────────

/**
 * Construye una cadena de dirección compacta a partir del objeto address de Nominatim.
 * Ejemplo: "Calle del Mar 23, Alcossebre" o "Av. Las Fuentes 5, Castellón"
 */
export function formatNominatimAddress(result: NominatimResult): string {
  const a = result.address;
  if (!a) return result.display_name;

  const partes: string[] = [];

  if (a.road) {
    partes.push(a.house_number ? `${a.road} ${a.house_number}` : a.road);
  }

  const localidad = a.village ?? a.town ?? a.city;
  if (localidad) partes.push(localidad);

  return partes.length > 0 ? partes.join(', ') : result.display_name;
}
