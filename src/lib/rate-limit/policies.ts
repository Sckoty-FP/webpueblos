import type { RateLimitRule } from "./core";

/**
 * Políticas con nombre. Centralizar las reglas evita números mágicos sueltos
 * por las server actions y permite afinar todos los límites desde un sitio.
 */

/** Formularios públicos anónimos: contacto, solicitud de presupuesto. */
export const PUBLIC_FORM: RateLimitRule = { limit: 5, windowSec: 60 };

/** Inscripciones / reservas públicas (un poco más holgado que un form). */
export const PUBLIC_SIGNUP: RateLimitRule = { limit: 8, windowSec: 60 };

/** Publicar en el muro (anti-spam de contenido). */
export const MURO_POST: RateLimitRule = { limit: 6, windowSec: 60 };

/** Creación de pedidos / acciones sensibles autenticadas. */
export const ORDER: RateLimitRule = { limit: 12, windowSec: 60 };
