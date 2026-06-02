import { createClient } from '@/lib/supabase/server';

// Porcentaje de comisión por defecto hasta que Sprint 12 (Super Admin) cree
// la tabla comision_config con las configuraciones reales.
const DEFAULT_PCT = 5.0;

/**
 * Retorna el porcentaje de comisión aplicable a un pedido.
 *
 * Jerarquía de búsqueda:
 *   1. Comisión específica para (pueblo + categoría)
 *   2. Comisión genérica del pueblo (categoria IS NULL)
 *   3. Fallback: 5 % por defecto
 *
 * Si la tabla `comision_config` no existe aún (se crea en Sprint 12),
 * el catch retorna el valor por defecto sin romper el flujo del pedido.
 *
 * El resultado se almacena como snapshot en pedidos_delivery.comision_porcentaje
 * al crear el pedido — el % real no cambia si se modifica la config luego.
 */
export async function getComisionPorcentaje(
  puebloId:  number,
  categoria: string,
): Promise<number> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('comision_config')
      .select('porcentaje')
      .eq('pueblo_id', puebloId)
      .eq('activa', true)
      .or(`categoria.eq.${categoria},categoria.is.null`)
      .order('categoria', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return DEFAULT_PCT;

    const pct = (data as { porcentaje: number }).porcentaje;
    return typeof pct === 'number' ? pct : DEFAULT_PCT;
  } catch {
    // Tabla aún no existe o error de red — silenciar y usar default
    return DEFAULT_PCT;
  }
}

/**
 * Calcula el importe de comisión dado el subtotal y el porcentaje.
 * El envío NO forma parte de la base de comisión.
 */
export function calcularImporteComision(subtotal: number, porcentaje: number): number {
  return parseFloat(((subtotal * porcentaje) / 100).toFixed(2));
}
