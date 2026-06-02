import { describe, it, expect } from "vitest";
import { construirNotificacion, type EventoPush } from "@/lib/push/payloads";

// ═══════════════════════════════════════════════════════════════════════════
// Construcción de notificaciones (payload push + notificación in-app).
// Módulo PURO: misma fuente de verdad para el push del navegador y la fila de
// `notificaciones`. Sin red, sin DB — testeable en aislamiento.
// ═══════════════════════════════════════════════════════════════════════════

describe("construirNotificacion — pedido_nuevo (al negocio)", () => {
  const evento: EventoPush = {
    tipo: "pedido_nuevo",
    numero: "PED-2026-000123",
    total: 24.5,
  };

  it("usa el tipo de notificación correcto", () => {
    expect(construirNotificacion(evento).tipo).toBe("pedido_nuevo");
  });

  it("el cuerpo incluye número y total formateado en euros", () => {
    const n = construirNotificacion(evento);
    expect(n.body).toContain("PED-2026-000123");
    expect(n.body).toContain("24,50");
  });

  it("apunta al panel de delivery del negocio", () => {
    expect(construirNotificacion(evento).url).toBe("/panel/delivery");
  });

  it("el tag colapsa por número de pedido", () => {
    expect(construirNotificacion(evento).tag).toBe("pedido-PED-2026-000123");
  });
});

describe("construirNotificacion — estados del pedido (al cliente)", () => {
  const base = { numero: "PED-2026-000123", puebloSlug: "alcossebre" } as const;

  it("pedido_aceptado apunta al tracking del cliente", () => {
    const n = construirNotificacion({ tipo: "pedido_aceptado", ...base });
    expect(n.tipo).toBe("pedido_aceptado");
    expect(n.url).toBe("/alcossebre/delivery/pedido/PED-2026-000123");
  });

  it("pedido_en_camino apunta al tracking del cliente", () => {
    const n = construirNotificacion({ tipo: "pedido_en_camino", ...base });
    expect(n.tipo).toBe("pedido_en_camino");
    expect(n.url).toBe("/alcossebre/delivery/pedido/PED-2026-000123");
  });

  it("pedido_entregado apunta al tracking del cliente", () => {
    const n = construirNotificacion({ tipo: "pedido_entregado", ...base });
    expect(n.tipo).toBe("pedido_entregado");
    expect(n.url).toBe("/alcossebre/delivery/pedido/PED-2026-000123");
  });

  it("los tres estados comparten tag para colapsar en una sola notificación", () => {
    const a = construirNotificacion({ tipo: "pedido_aceptado", ...base }).tag;
    const b = construirNotificacion({ tipo: "pedido_en_camino", ...base }).tag;
    const c = construirNotificacion({ tipo: "pedido_entregado", ...base }).tag;
    expect(a).toBe("pedido-PED-2026-000123");
    expect(b).toBe(a);
    expect(c).toBe(a);
  });
});

describe("construirNotificacion — inscripcion_nueva (al guía)", () => {
  const evento: EventoPush = {
    tipo: "inscripcion_nueva",
    tourTitulo: "Casco histórico al atardecer",
    numPersonas: 3,
    sesionFecha: "2026-06-10",
  };

  it("tipo correcto y apunta al panel de free-tour", () => {
    const n = construirNotificacion(evento);
    expect(n.tipo).toBe("inscripcion_nueva");
    expect(n.url).toBe("/panel/free-tour");
  });

  it("el cuerpo menciona el tour y la cantidad de personas", () => {
    const n = construirNotificacion(evento);
    expect(n.body).toContain("Casco histórico al atardecer");
    expect(n.body).toContain("3");
  });
});

describe("construirNotificacion — ticket_nuevo (al admin)", () => {
  const evento: EventoPush = {
    tipo: "ticket_nuevo",
    ticketId: "11111111-2222-3333-4444-555555555555",
    numero: "TKT-2026-000007",
    asunto: "No me llegan los pedidos",
  };

  it("tipo correcto y deep-link al detalle del ticket en admin", () => {
    const n = construirNotificacion(evento);
    expect(n.tipo).toBe("ticket_nuevo");
    expect(n.url).toBe("/admin/tickets/11111111-2222-3333-4444-555555555555");
  });

  it("el título o cuerpo refleja el asunto del ticket", () => {
    const n = construirNotificacion(evento);
    expect(`${n.title} ${n.body}`).toContain("No me llegan los pedidos");
  });
});

describe("construirNotificacion — invariantes comunes", () => {
  const eventos: EventoPush[] = [
    { tipo: "pedido_nuevo", numero: "PED-1", total: 10 },
    { tipo: "pedido_aceptado", numero: "PED-1", puebloSlug: "x" },
    { tipo: "pedido_en_camino", numero: "PED-1", puebloSlug: "x" },
    { tipo: "pedido_entregado", numero: "PED-1", puebloSlug: "x" },
    { tipo: "inscripcion_nueva", tourTitulo: "T", numPersonas: 1, sesionFecha: "2026-06-10" },
    { tipo: "ticket_nuevo", ticketId: "id", numero: "TKT-1", asunto: "A" },
  ];

  it("toda notificación trae title, body, url y tag no vacíos", () => {
    for (const e of eventos) {
      const n = construirNotificacion(e);
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.body.length).toBeGreaterThan(0);
      expect(n.url.startsWith("/")).toBe(true);
      expect(n.tag.length).toBeGreaterThan(0);
    }
  });
});
