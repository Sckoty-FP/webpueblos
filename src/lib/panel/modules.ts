import type { ServicioDB } from "@/types";
import type { RolPanel } from "@/types/equipo";

// ─── Categorías por módulo ────────────────────────────────────────────────────

const CATS_RESERVAS = new Set([
  "restaurante", "bar", "cafeteria", "heladeria",
  "hotel", "apartamento_turistico", "camping", "hostal",
  "peluqueria", "estetica", "spa", "gimnasio",
  "alquiler_bicis", "alquiler_barcos", "escuela_nautica",
  "actividades_aventura", "tour_guiado",
]);

const CATS_PROPIEDADES = new Set([
  "hotel", "apartamento_turistico", "camping", "hostal",
]);

const CATS_CARTA = new Set([
  "restaurante", "bar", "cafeteria", "heladeria", "panaderia",
]);

const CATS_MESAS = new Set([
  "restaurante", "bar", "cafeteria",
]);

const CATS_INVENTARIO = new Set([
  "restaurante", "bar", "cafeteria", "heladeria",
  "supermercado", "panaderia", "farmacia",
  "tienda_ropa", "comercio_general",
]);

const CATS_ACTIVIDADES = new Set([
  "alquiler_bicis", "alquiler_barcos", "escuela_nautica",
  "actividades_aventura", "tour_guiado",
]);

const CATS_PROFESIONALES = new Set([
  "peluqueria", "estetica", "spa", "barberia",
  "clinica", "fisioterapia", "veterinario", "masajes", "gimnasio",
]);

const CATS_SERVICIOS_PRO = new Set([
  "fontaneria", "electricidad", "taller_mecanico", "limpieza", "jardineria",
]);

// ─── Interface ────────────────────────────────────────────────────────────────

export interface PanelModules {
  // Núcleo
  perfil:         boolean;
  servicios:      boolean;
  horarios:       boolean;

  // ERP básico
  inventario:     boolean;
  notas:          boolean;
  caja:           boolean;
  equipo:         boolean;

  // Verticales
  propiedades:    boolean;
  reservas:       boolean;
  mesas:          boolean;
  carta:          boolean;
  actividades:    boolean;
  profesionales:  boolean;  // peluquería, estética, spa, clínica…

  // Servicios profesionales (fontanería, electricidad, etc.)
  presupuestos:   boolean;
  partes:         boolean;

  // Sub-proyectos (requieren opt-in en DB — Sprint 7/11)
  delivery:        boolean;
  delivery_config: boolean;
  free_tour:       boolean;
}

// ─── Función principal ────────────────────────────────────────────────────────

export function getModules(
  servicios: ServicioDB[],
  prestador?: { delivery_activo?: boolean },
  rol?: RolPanel,
): PanelModules {
  const cats = new Set(servicios.map((s) => s.categoria));
  const esEncargado = rol === "encargado";

  const tieneReservas      = [...cats].some((c) => CATS_RESERVAS.has(c));
  const tienePropiedades   = [...cats].some((c) => CATS_PROPIEDADES.has(c));
  const tieneCarta         = [...cats].some((c) => CATS_CARTA.has(c));
  const tieneMesas         = [...cats].some((c) => CATS_MESAS.has(c));
  const tieneInventario    = [...cats].some((c) => CATS_INVENTARIO.has(c));
  const tieneActividades   = [...cats].some((c) => CATS_ACTIVIDADES.has(c));
  const tieneProfesionales = [...cats].some((c) => CATS_PROFESIONALES.has(c));
  const tieneServiciosPro  = [...cats].some((c) => CATS_SERVICIOS_PRO.has(c));

  return {
    // Núcleo — encargado no edita configuración del negocio
    perfil:         !esEncargado,
    servicios:      !esEncargado,
    horarios:       !tienePropiedades && !esEncargado,

    // ERP básico — encargado no ve dinero ni inventario
    inventario:     tieneInventario && !esEncargado,
    notas:          true,
    caja:           !esEncargado,
    equipo:         !esEncargado,

    // Verticales — encargado puede operar reservas/mesas/carta (read op)
    propiedades:    tienePropiedades && !esEncargado,
    reservas:       tieneReservas,
    mesas:          tieneMesas,
    carta:          tieneCarta,
    actividades:    tieneActividades,
    profesionales:  tieneProfesionales && !esEncargado,

    // Servicios profesionales — solo propietario
    presupuestos:   tieneServiciosPro && !esEncargado,
    partes:         tieneServiciosPro && !esEncargado,

    // Sub-proyectos — requieren flag en DB
    delivery:        prestador?.delivery_activo === true,
    delivery_config: tieneCarta,
    free_tour:       cats.has('tour_guiado') && !esEncargado,
  };
}
