import type { RecursoActividadDB } from "@/types/actividades";

/**
 * Calcula el precio para alquilar un recurso.
 * Si horas >= 24 → precio por día. Si no → precio por hora.
 */
export function calcularPrecio(recurso: RecursoActividadDB, horas: number): number {
  if (horas >= 24) {
    const dias = Math.ceil(horas / 24);
    return dias * (recurso.precio_dia ?? 0);
  }
  return horas * (recurso.precio_hora ?? 0);
}
