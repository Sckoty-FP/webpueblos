import type { OSRMRoute } from '@/types/delivery';

const OSRM_BASE =
  process.env.NEXT_PUBLIC_OSRM_URL ?? 'https://router.project-osrm.org';

// ─── Utilidades ───────────────────────────────────────────────────────────

/** Redondea a 4 decimales (~11 m de precisión) para maximizar hits en el cache. */
function r4(n: number) {
  return Math.round(n * 10_000) / 10_000;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// ─── Haversine ────────────────────────────────────────────────────────────

/**
 * Distancia en línea recta entre dos puntos (fórmula haversine).
 * Retorna kilómetros. Se usa como fallback cuando OSRM no responde.
 */
export function haversine(
  from: { lat: number; lon: number },
  to:   { lat: number; lon: number },
): number {
  const R    = 6_371; // radio de la Tierra en km
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Cliente OSRM ─────────────────────────────────────────────────────────

/**
 * Consulta el API de OSRM para obtener distancia y duración reales por carretera.
 *
 * - Retorna `null` si OSRM no está disponible o devuelve error.
 * - El llamador debe usar `haversine` como fallback.
 * - Cache de 24 h vía `fetch` nativo de Next.js (`next.revalidate`).
 *   Las coordenadas se redondean a 4 decimales antes de construir la URL,
 *   por lo que rutas ~equivalentes comparten la misma entrada de cache.
 *
 * Endpoint usado:
 *   GET /route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false
 */
export async function fetchOSRM(
  from: { lat: number; lon: number },
  to:   { lat: number; lon: number },
): Promise<OSRMRoute | null> {
  const url =
    `${OSRM_BASE}/route/v1/driving/` +
    `${r4(from.lon)},${r4(from.lat)};${r4(to.lon)},${r4(to.lat)}` +
    `?overview=false`;

  try {
    const res = await fetch(url, {
      // Cache 24 h en el Data Cache de Next.js (server-side solamente).
      // En entorno de test el campo next es ignorado — fetch usa red real o se mockea.
      next: { revalidate: 86_400 },
      headers: {
        'User-Agent': 'PUEBLO-App/1.0 contact:eliasblanco.vxc@gmail.com',
      },
    });

    if (!res.ok) return null;

    const json = await res.json() as {
      code?:   string;
      routes?: { distance: number; duration: number }[];
    };

    if (json.code !== 'Ok' || !json.routes?.[0]) return null;

    const route = json.routes[0];
    return {
      distance_km:  parseFloat((route.distance / 1_000).toFixed(3)),
      duration_min: parseFloat((route.duration / 60).toFixed(1)),
    };
  } catch {
    // Red caída, timeout, JSON inválido — silenciar y dejar que el caller use haversine
    return null;
  }
}

/**
 * Versión para routing completo (con geometría GeoJSON).
 * Usado por el panel del repartidor para dibujar la polilínea en el mapa.
 * Retorna null si falla.
 */
export async function fetchOSRMConRuta(
  from: { lat: number; lon: number },
  to:   { lat: number; lon: number },
): Promise<{
  distance_km:  number;
  duration_min: number;
  geometry:     GeoJSON.LineString;
} | null> {
  const url =
    `${OSRM_BASE}/route/v1/driving/` +
    `${r4(from.lon)},${r4(from.lat)};${r4(to.lon)},${r4(to.lat)}` +
    `?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 1_800 }, // 30 min: las rutas con geometría cambian menos
      headers: {
        'User-Agent': 'PUEBLO-App/1.0 contact:eliasblanco.vxc@gmail.com',
      },
    });

    if (!res.ok) return null;

    const json = await res.json() as {
      code?:   string;
      routes?: {
        distance: number;
        duration: number;
        geometry: GeoJSON.LineString;
      }[];
    };

    if (json.code !== 'Ok' || !json.routes?.[0]) return null;

    const route = json.routes[0];
    return {
      distance_km:  parseFloat((route.distance / 1_000).toFixed(3)),
      duration_min: parseFloat((route.duration / 60).toFixed(1)),
      geometry:     route.geometry,
    };
  } catch {
    return null;
  }
}
