/**
 * Máquina de estados de un pedido de delivery.
 *
 * Antes esta lógica vivía embebida en el componente `PedidosView` (UI del
 * negocio). Se extrajo a este módulo puro para poder testearla de forma
 * aislada y para que cualquier capa (UI, server action, validación) use la
 * MISMA definición de qué transiciones son legales — una sola fuente de verdad.
 *
 * Flujo feliz (lineal):
 *   pendiente_pago → aceptado → preparando → listo → en_camino → entregado
 *
 * Desde cualquier estado no terminal el negocio puede cancelar/rechazar.
 */

import type { EstadoPedidoDelivery, ModoDelivery } from "@/types/delivery";

/** Secuencia lineal del flujo feliz, en orden. */
export const FLUJO_PEDIDO: readonly EstadoPedidoDelivery[] = [
  "pendiente_pago",
  "aceptado",
  "preparando",
  "listo",
  "en_camino",
  "entregado",
] as const;

/** Estados terminales: el pedido ya no avanza desde aquí. */
export const ESTADOS_FINALES: readonly EstadoPedidoDelivery[] = [
  "entregado",
  "cancelado",
  "rechazado",
  "fallido",
] as const;

/** Estados "vivos" que el negocio gestiona en sus columnas de pedidos activos. */
export const ESTADOS_ACTIVOS: readonly EstadoPedidoDelivery[] = [
  "pendiente_pago",
  "aceptado",
  "preparando",
  "listo",
  "en_camino",
] as const;

/** True si el estado es terminal (no admite avanzar). */
export function esEstadoFinal(estado: EstadoPedidoDelivery): boolean {
  return ESTADOS_FINALES.includes(estado);
}

/**
 * Devuelve el siguiente estado en el flujo feliz, o `null` si el estado no
 * tiene sucesor (terminal o `entregado`).
 */
export function siguienteEstado(
  estado: EstadoPedidoDelivery,
): EstadoPedidoDelivery | null {
  const flujo: Partial<Record<EstadoPedidoDelivery, EstadoPedidoDelivery>> = {
    pendiente_pago: "aceptado",
    aceptado:       "preparando",
    preparando:     "listo",
    listo:          "en_camino",
    en_camino:      "entregado",
  };
  return flujo[estado] ?? null;
}

/**
 * Valida si `destino` es una transición legal desde `origen`.
 *
 * Reglas:
 *  - Avanzar al sucesor inmediato del flujo feliz es válido.
 *  - Cancelar o rechazar es válido desde cualquier estado NO terminal.
 *  - Todo lo demás (saltos, retrocesos, salir de un estado terminal) es inválido.
 */
export function esTransicionValida(
  origen: EstadoPedidoDelivery,
  destino: EstadoPedidoDelivery,
): boolean {
  // No se sale de un estado terminal.
  if (esEstadoFinal(origen)) return false;

  // Cancelar / rechazar siempre permitido desde un estado vivo.
  if (destino === "cancelado" || destino === "rechazado" || destino === "fallido") {
    return true;
  }

  // Avance lineal al sucesor inmediato.
  return siguienteEstado(origen) === destino;
}

/**
 * Siguiente estado que el NEGOCIO puede fijar desde su panel, según el modo de reparto.
 *
 * En modo `plataforma` el reparto lo hace un repartidor de PUEBLO: el negocio avanza
 * hasta `listo` y desde ahí ASIGNA repartidor (esa acción pone `en_camino`). Marcar
 * `en_camino` a mano o `entregado` NO le corresponde al negocio — la entrega la cierra
 * el repartidor desde su portal. En modo `propio` el negocio gestiona su propio reparto,
 * así que avanza el flujo completo hasta `entregado`.
 *
 * Devuelve `null` cuando el negocio no debe ofrecer botón de avance para ese estado/modo.
 */
export function siguienteEstadoNegocio(
  estado: EstadoPedidoDelivery,
  modo: ModoDelivery | null | undefined,
): EstadoPedidoDelivery | null {
  const sig = siguienteEstado(estado);
  if (sig === null) return null;
  // En plataforma, el negocio no marca en_camino (lo hace al asignar repartidor)
  // ni entregado (lo hace el repartidor).
  if (modo === "plataforma" && (estado === "listo" || estado === "en_camino")) {
    return null;
  }
  return sig;
}

/**
 * Igual que `esTransicionValida`, pero desde la óptica del NEGOCIO: en modo
 * `plataforma` el negocio NO puede fijar `en_camino` ni `entregado` (defensa en
 * profundidad en el server action, no solo ocultar el botón en la UI).
 * Cancelar/rechazar sigue permitido en cualquier modo.
 */
export function esTransicionValidaNegocio(
  origen: EstadoPedidoDelivery,
  destino: EstadoPedidoDelivery,
  modo: ModoDelivery | null | undefined,
): boolean {
  if (!esTransicionValida(origen, destino)) return false;
  if (destino === "cancelado" || destino === "rechazado" || destino === "fallido") {
    return true;
  }
  if (modo === "plataforma" && (destino === "en_camino" || destino === "entregado")) {
    return false;
  }
  return true;
}

/** Etiqueta del botón de avance para el panel del negocio. */
export function labelBotonAvanzar(estado: EstadoPedidoDelivery): string {
  switch (estado) {
    case "pendiente_pago": return "Aceptar pedido";
    case "aceptado":       return "Empezar preparación";
    case "preparando":     return "Marcar como listo";
    case "listo":          return "Marcar en camino";
    default:               return "Avanzar";
  }
}
