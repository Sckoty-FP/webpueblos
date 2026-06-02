/**
 * Extrae la IP del cliente de las cabeceras de la petición. PURO y testeable:
 * recibe cualquier cosa con `get(name)` (un `Headers` de Next sirve).
 *
 * Prioriza `x-forwarded-for` (el PRIMER valor es la IP original del cliente;
 * los siguientes son proxies). Cae a `x-real-ip`. `null` si no hay nada fiable.
 */
export interface HeaderLike {
  get(name: string): string | null;
}

export function getClientIp(headers: HeaderLike): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const real = headers.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (trimmed) return trimmed;
  }

  return null;
}
