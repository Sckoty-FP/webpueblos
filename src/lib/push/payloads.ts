/**
 * Construcción de notificaciones — módulo PURO.
 *
 * Una sola fuente de verdad para los DOS canales de una notificación:
 *   1. El push del navegador (title/body/url/tag → service worker).
 *   2. La fila in-app en la tabla `notificaciones` (tipo/titulo/mensaje/url_accion).
 *
 * Sin red ni DB: se testea aislado igual que `lib/delivery/estados.ts`.
 * El motor de envío (`lib/push/send.ts`) y los server actions consumen esto.
 */

import { formatCurrency } from "@/lib/format/currency";

/** Los 6 eventos del Sprint 13 que disparan notificación. Unión discriminada. */
export type EventoPush =
  | { tipo: "pedido_nuevo"; numero: string; total: number }
  | { tipo: "pedido_aceptado"; numero: string; puebloSlug: string }
  | { tipo: "pedido_en_camino"; numero: string; puebloSlug: string }
  | { tipo: "pedido_entregado"; numero: string; puebloSlug: string }
  | { tipo: "inscripcion_nueva"; tourTitulo: string; numPersonas: number; sesionFecha: string }
  | { tipo: "ticket_nuevo"; ticketId: string; numero: string; asunto: string };

/** Valor del enum `tipo_notificacion` (migración 022) que corresponde a cada evento. */
export type TipoNotificacionPush = EventoPush["tipo"];

export interface NotificacionConstruida {
  /** Valor del enum para la fila in-app. */
  tipo: TipoNotificacionPush;
  /** Título del push y `titulo` in-app. */
  title: string;
  /** Cuerpo del push y `mensaje` in-app. */
  body: string;
  /** Destino al hacer click (`url_accion`). Siempre ruta interna ("/..."). */
  url: string;
  /** Tag de colapso del push: notificaciones del mismo recurso se reemplazan. */
  tag: string;
}

/** Deep-link al seguimiento del pedido para el cliente. */
function urlTracking(puebloSlug: string, numero: string): string {
  return `/${puebloSlug}/delivery/pedido/${numero}`;
}

/**
 * Traduce un evento de dominio a una notificación lista para emitir por ambos
 * canales. Exhaustivo sobre la unión: agregar un evento sin manejarlo rompe el
 * type-check (el `never` del default).
 */
export function construirNotificacion(evento: EventoPush): NotificacionConstruida {
  switch (evento.tipo) {
    case "pedido_nuevo":
      return {
        tipo: "pedido_nuevo",
        title: "Nuevo pedido 🛵",
        body: `Pedido ${evento.numero} · ${formatCurrency(evento.total)}`,
        url: "/panel/delivery",
        tag: `pedido-${evento.numero}`,
      };

    case "pedido_aceptado":
      return {
        tipo: "pedido_aceptado",
        title: "Pedido aceptado ✅",
        body: `Tu pedido ${evento.numero} fue aceptado y se está preparando.`,
        url: urlTracking(evento.puebloSlug, evento.numero),
        tag: `pedido-${evento.numero}`,
      };

    case "pedido_en_camino":
      return {
        tipo: "pedido_en_camino",
        title: "Tu pedido va en camino 🛵",
        body: `El repartidor salió con tu pedido ${evento.numero}.`,
        url: urlTracking(evento.puebloSlug, evento.numero),
        tag: `pedido-${evento.numero}`,
      };

    case "pedido_entregado":
      return {
        tipo: "pedido_entregado",
        title: "Pedido entregado 🎉",
        body: `Tu pedido ${evento.numero} fue entregado. ¡Que aproveche!`,
        url: urlTracking(evento.puebloSlug, evento.numero),
        tag: `pedido-${evento.numero}`,
      };

    case "inscripcion_nueva":
      return {
        tipo: "inscripcion_nueva",
        title: "Nueva inscripción 🎟️",
        body: `${evento.numPersonas} persona(s) en "${evento.tourTitulo}" (${evento.sesionFecha}).`,
        url: "/panel/free-tour",
        tag: `inscripcion-${evento.tourTitulo}`,
      };

    case "ticket_nuevo":
      return {
        tipo: "ticket_nuevo",
        title: `Nuevo ticket ${evento.numero}`,
        body: evento.asunto,
        url: `/admin/tickets/${evento.ticketId}`,
        tag: `ticket-${evento.numero}`,
      };

    default: {
      const _exhaustive: never = evento;
      return _exhaustive;
    }
  }
}
