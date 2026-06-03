import { describe, it, expect } from "vitest";
import {
  FLUJO_PEDIDO,
  ESTADOS_FINALES,
  ESTADOS_ACTIVOS,
  esEstadoFinal,
  siguienteEstado,
  esTransicionValida,
  esTransicionValidaNegocio,
  siguienteEstadoNegocio,
  labelBotonAvanzar,
} from "@/lib/delivery/estados";
import type { EstadoPedidoDelivery } from "@/types/delivery";

// ═══════════════════════════════════════════════════════════════════════════
// Máquina de estados del pedido de delivery
// ═══════════════════════════════════════════════════════════════════════════

describe("siguienteEstado — flujo feliz lineal", () => {
  it("avanza pendiente_pago → aceptado", () => {
    expect(siguienteEstado("pendiente_pago")).toBe("aceptado");
  });

  it("avanza aceptado → preparando", () => {
    expect(siguienteEstado("aceptado")).toBe("preparando");
  });

  it("avanza preparando → listo", () => {
    expect(siguienteEstado("preparando")).toBe("listo");
  });

  it("avanza listo → en_camino", () => {
    expect(siguienteEstado("listo")).toBe("en_camino");
  });

  it("avanza en_camino → entregado", () => {
    expect(siguienteEstado("en_camino")).toBe("entregado");
  });

  it("entregado no tiene sucesor (null)", () => {
    expect(siguienteEstado("entregado")).toBeNull();
  });

  it("estados terminales no tienen sucesor", () => {
    expect(siguienteEstado("cancelado")).toBeNull();
    expect(siguienteEstado("rechazado")).toBeNull();
    expect(siguienteEstado("fallido")).toBeNull();
  });

  it("recorre el flujo feliz completo encadenando siguienteEstado", () => {
    const visitados: EstadoPedidoDelivery[] = ["pendiente_pago"];
    let actual: EstadoPedidoDelivery | null = "pendiente_pago";
    while ((actual = siguienteEstado(actual!)) !== null) {
      visitados.push(actual);
    }
    expect(visitados).toEqual([...FLUJO_PEDIDO]);
  });
});

describe("esEstadoFinal", () => {
  it("reconoce los 4 estados terminales", () => {
    expect(esEstadoFinal("entregado")).toBe(true);
    expect(esEstadoFinal("cancelado")).toBe(true);
    expect(esEstadoFinal("rechazado")).toBe(true);
    expect(esEstadoFinal("fallido")).toBe(true);
  });

  it("los estados activos no son finales", () => {
    for (const e of ESTADOS_ACTIVOS) {
      expect(esEstadoFinal(e)).toBe(false);
    }
  });
});

describe("esTransicionValida", () => {
  it("permite el avance lineal al sucesor inmediato", () => {
    expect(esTransicionValida("pendiente_pago", "aceptado")).toBe(true);
    expect(esTransicionValida("aceptado", "preparando")).toBe(true);
    expect(esTransicionValida("preparando", "listo")).toBe(true);
    expect(esTransicionValida("listo", "en_camino")).toBe(true);
    expect(esTransicionValida("en_camino", "entregado")).toBe(true);
  });

  it("rechaza saltos de estado (no consecutivos)", () => {
    expect(esTransicionValida("pendiente_pago", "preparando")).toBe(false);
    expect(esTransicionValida("aceptado", "en_camino")).toBe(false);
    expect(esTransicionValida("pendiente_pago", "entregado")).toBe(false);
  });

  it("rechaza retrocesos", () => {
    expect(esTransicionValida("preparando", "aceptado")).toBe(false);
    expect(esTransicionValida("en_camino", "listo")).toBe(false);
  });

  it("permite cancelar/rechazar desde cualquier estado vivo", () => {
    for (const e of ESTADOS_ACTIVOS) {
      expect(esTransicionValida(e, "cancelado")).toBe(true);
      expect(esTransicionValida(e, "rechazado")).toBe(true);
    }
  });

  it("no permite salir de un estado terminal", () => {
    expect(esTransicionValida("entregado", "en_camino")).toBe(false);
    expect(esTransicionValida("cancelado", "aceptado")).toBe(false);
    expect(esTransicionValida("rechazado", "pendiente_pago")).toBe(false);
    expect(esTransicionValida("entregado", "cancelado")).toBe(false);
  });
});

describe("invariantes de los conjuntos de estados", () => {
  it("activos y finales son disjuntos", () => {
    for (const e of ESTADOS_ACTIVOS) {
      expect(ESTADOS_FINALES).not.toContain(e);
    }
  });

  it("el flujo feliz empieza en pendiente_pago y termina en entregado", () => {
    expect(FLUJO_PEDIDO[0]).toBe("pendiente_pago");
    expect(FLUJO_PEDIDO[FLUJO_PEDIDO.length - 1]).toBe("entregado");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Reglas por ACTOR — el negocio no marca en_camino/entregado en modo plataforma
// (regresión: el restaurante podía pasar el pedido a "entregado", que es del repartidor)
// ═══════════════════════════════════════════════════════════════════════════

describe("siguienteEstadoNegocio — modo plataforma", () => {
  it("avanza normalmente hasta listo", () => {
    expect(siguienteEstadoNegocio("pendiente_pago", "plataforma")).toBe("aceptado");
    expect(siguienteEstadoNegocio("aceptado", "plataforma")).toBe("preparando");
    expect(siguienteEstadoNegocio("preparando", "plataforma")).toBe("listo");
  });

  it("NO ofrece avance desde listo (el negocio asigna repartidor)", () => {
    expect(siguienteEstadoNegocio("listo", "plataforma")).toBeNull();
  });

  it("NO ofrece avance desde en_camino (entregar es del repartidor)", () => {
    expect(siguienteEstadoNegocio("en_camino", "plataforma")).toBeNull();
  });
});

describe("siguienteEstadoNegocio — modo propio", () => {
  it("avanza el flujo completo hasta entregado (reparto propio del negocio)", () => {
    expect(siguienteEstadoNegocio("listo", "propio")).toBe("en_camino");
    expect(siguienteEstadoNegocio("en_camino", "propio")).toBe("entregado");
  });
});

describe("esTransicionValidaNegocio", () => {
  it("plataforma: rechaza que el negocio marque entregado o en_camino", () => {
    expect(esTransicionValidaNegocio("en_camino", "entregado", "plataforma")).toBe(false);
    expect(esTransicionValidaNegocio("listo", "en_camino", "plataforma")).toBe(false);
  });

  it("plataforma: permite avanzar hasta listo y cancelar", () => {
    expect(esTransicionValidaNegocio("preparando", "listo", "plataforma")).toBe(true);
    expect(esTransicionValidaNegocio("preparando", "cancelado", "plataforma")).toBe(true);
  });

  it("propio: permite el flujo completo incl. entregado", () => {
    expect(esTransicionValidaNegocio("listo", "en_camino", "propio")).toBe(true);
    expect(esTransicionValidaNegocio("en_camino", "entregado", "propio")).toBe(true);
  });
});

describe("labelBotonAvanzar", () => {
  it("devuelve el texto correcto por estado", () => {
    expect(labelBotonAvanzar("pendiente_pago")).toBe("Aceptar pedido");
    expect(labelBotonAvanzar("aceptado")).toBe("Empezar preparación");
    expect(labelBotonAvanzar("preparando")).toBe("Marcar como listo");
    expect(labelBotonAvanzar("listo")).toBe("Marcar en camino");
  });

  it("cae a 'Avanzar' para estados sin botón específico", () => {
    expect(labelBotonAvanzar("en_camino")).toBe("Avanzar");
    expect(labelBotonAvanzar("entregado")).toBe("Avanzar");
  });
});
