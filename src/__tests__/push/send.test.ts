import { describe, it, expect, vi } from "vitest";
import { notificarCore, type NotificarDeps, type DispositivoPush } from "@/lib/push/core";
import type { EventoPush } from "@/lib/push/payloads";

// ═══════════════════════════════════════════════════════════════════════════
// Orquestación del envío de push — testeada con inyección de dependencias,
// mismo patrón que `delivery/calcular.ts`. Sin red ni DB reales.
// ═══════════════════════════════════════════════════════════════════════════

const evento: EventoPush = {
  tipo: "pedido_nuevo",
  numero: "PED-2026-000123",
  total: 24.5,
};

function dispositivo(id: string): DispositivoPush {
  return { id, endpoint: `https://push.example/${id}`, p256dh: "k", auth: "a" };
}

function makeDeps(over: Partial<NotificarDeps> = {}): NotificarDeps {
  return {
    getDispositivos: vi.fn(async () => [dispositivo("d1"), dispositivo("d2")]),
    enviar: vi.fn(async () => ({ statusCode: 201 })),
    desactivar: vi.fn(async () => {}),
    registrarInApp: vi.fn(async () => {}),
    ...over,
  };
}

describe("notificarCore", () => {
  it("registra la notificación in-app una vez", async () => {
    const deps = makeDeps();
    await notificarCore("user-1", evento, deps);
    expect(deps.registrarInApp).toHaveBeenCalledTimes(1);
    expect(deps.registrarInApp).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: "user-1", tipo: "pedido_nuevo", url: "/panel/delivery" }),
    );
  });

  it("envía a todos los dispositivos activos del usuario", async () => {
    const deps = makeDeps();
    const res = await notificarCore("user-1", evento, deps);
    expect(deps.enviar).toHaveBeenCalledTimes(2);
    expect(res.enviados).toBe(2);
    expect(res.desactivados).toBe(0);
    expect(res.fallidos).toBe(0);
  });

  it("desactiva el dispositivo cuya suscripción expiró (410 Gone)", async () => {
    const enviar = vi.fn(async (d: DispositivoPush) =>
      d.id === "d1" ? { statusCode: 410 } : { statusCode: 201 },
    );
    const deps = makeDeps({ enviar });
    const res = await notificarCore("user-1", evento, deps);
    expect(deps.desactivar).toHaveBeenCalledExactlyOnceWith("d1");
    expect(res.enviados).toBe(1);
    expect(res.desactivados).toBe(1);
  });

  it("desactiva también ante 404 Not Found", async () => {
    const enviar = vi.fn(async () => ({ statusCode: 404 }));
    const deps = makeDeps({ enviar });
    const res = await notificarCore("user-1", evento, deps);
    expect(deps.desactivar).toHaveBeenCalledTimes(2);
    expect(res.desactivados).toBe(2);
    expect(res.enviados).toBe(0);
  });

  it("un fallo transitorio (500) cuenta como fallido pero NO desactiva", async () => {
    const enviar = vi.fn(async () => ({ statusCode: 500 }));
    const deps = makeDeps({ enviar });
    const res = await notificarCore("user-1", evento, deps);
    expect(deps.desactivar).not.toHaveBeenCalled();
    expect(res.fallidos).toBe(2);
  });

  it("un error de red en un dispositivo no aborta el resto", async () => {
    const enviar = vi.fn(async (d: DispositivoPush) => {
      if (d.id === "d1") throw new Error("network down");
      return { statusCode: 201 };
    });
    const deps = makeDeps({ enviar });
    const res = await notificarCore("user-1", evento, deps);
    expect(res.fallidos).toBe(1);
    expect(res.enviados).toBe(1);
  });

  it("sin dispositivos, igual registra in-app y no falla", async () => {
    const deps = makeDeps({ getDispositivos: vi.fn(async () => []) });
    const res = await notificarCore("user-1", evento, deps);
    expect(deps.registrarInApp).toHaveBeenCalledTimes(1);
    expect(deps.enviar).not.toHaveBeenCalled();
    expect(res).toEqual({ enviados: 0, fallidos: 0, desactivados: 0 });
  });

  it("si registrar in-app falla, el push igual se intenta (best-effort)", async () => {
    const deps = makeDeps({ registrarInApp: vi.fn(async () => { throw new Error("db down"); }) });
    const res = await notificarCore("user-1", evento, deps);
    expect(deps.enviar).toHaveBeenCalledTimes(2);
    expect(res.enviados).toBe(2);
  });
});
