"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { toggleEnTurnoAction } from "@/app/repartidor/actions";
import { usePosicionRepartidor } from "@/hooks/usePosicionRepartidor";
import { createClient } from "@/lib/supabase/client";
import type { RepartidorDB, PedidoDeliveryDB } from "@/types/delivery";

const ESTADO_LABEL: Partial<Record<string, string>> = {
  aceptado:   "RECOGER",
  preparando: "PREPARANDO",
  listo:      "LISTO",
  en_camino:  "EN CAMINO",
};

const ESTADO_COLOR: Partial<Record<string, string>> = {
  aceptado:   "#f97316",
  preparando: "#0070cc",
  listo:      "#7c3aed",
  en_camino:  "#059669",
};

interface Props {
  repartidor:     RepartidorDB;
  pedidosActivos: PedidoDeliveryDB[];
  pedidosHoy:     number;
}

export default function RepartidorHome({ repartidor, pedidosActivos, pedidosHoy }: Props) {
  const [enTurno, setEnTurno]   = useState(repartidor.en_turno);
  const [pedidos, setPedidos]   = useState<PedidoDeliveryDB[]>(pedidosActivos);
  const [pending, startTransition] = useTransition();

  usePosicionRepartidor(enTurno);

  // Realtime: actualizar lista cuando se asigna o cambia un pedido
  useEffect(() => {
    const supabase = createClient();
    const ESTADOS_ACTIVOS = ["en_camino", "listo", "preparando", "aceptado"] as const;

    const canal = supabase
      .channel(`repartidor_pedidos:${repartidor.id}`)
      .on("postgres_changes", {
        event:  "*",
        schema: "public",
        table:  "pedidos_delivery",
        filter: `repartidor_id=eq.${repartidor.id}`,
      }, (payload) => {
        const pedido = (payload.new ?? payload.old) as PedidoDeliveryDB;
        if (!pedido) return;

        if (payload.eventType === "INSERT" || (payload.eventType === "UPDATE" && ESTADOS_ACTIVOS.includes(pedido.estado as typeof ESTADOS_ACTIVOS[number]))) {
          setPedidos((prev) => {
            const existe = prev.findIndex((p) => p.id === pedido.id);
            if (existe >= 0) {
              const next = [...prev];
              next[existe] = pedido;
              return next;
            }
            return [pedido, ...prev];
          });
        } else if (payload.eventType === "UPDATE" && !ESTADOS_ACTIVOS.includes(pedido.estado as typeof ESTADOS_ACTIVOS[number])) {
          // Estado final (entregado/cancelado) → sacar de la lista activa
          setPedidos((prev) => prev.filter((p) => p.id !== pedido.id));
        }
      })
      .subscribe();

    // Polling fallback cada 20s. El filtro realtime `repartidor_id=eq.X` no captura
    // de forma fiable la asignación (transición repartidor_id NULL→X), así que sin
    // esto el repartidor no vería un pedido recién asignado hasta recargar a mano.
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("pedidos_delivery")
        .select("*")
        .eq("repartidor_id", repartidor.id)
        .in("estado", [...ESTADOS_ACTIVOS])
        .order("created_at", { ascending: true });
      if (data) setPedidos(data as PedidoDeliveryDB[]);
    }, 20_000);

    return () => { supabase.removeChannel(canal); clearInterval(poll); };
  }, [repartidor.id]);

  function handleToggle() {
    const next = !enTurno;
    setEnTurno(next);
    startTransition(async () => {
      await toggleEnTurnoAction(next);
    });
  }

  const ganado = pedidosHoy * (repartidor.tarifa_por_pedido ?? 0);

  return (
    <div className="min-h-screen" style={{ background: enTurno ? "#0a2540" : "#0a0a0a" }}>

      {/* Top bar */}
      <div style={{ padding: "12px 18px 8px", display: "flex", alignItems: "center", gap: 12, color: "#fff" }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 600, fontFamily: "Barlow, sans-serif",
        }}>
          {repartidor.usuario?.nombre?.charAt(0).toUpperCase() ?? "R"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>Repartidor</div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "Barlow, sans-serif" }}>{repartidor.usuario?.nombre ?? "Repartidor"}</div>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ padding: "8px 18px 14px" }}>
        <div style={{
          background: enTurno ? "linear-gradient(135deg, #0070cc, #1eaedb)" : "#161616",
          borderRadius: 20, padding: "20px 22px",
          color: "#fff", position: "relative", overflow: "hidden",
          border: enTurno ? "none" : "1px solid rgba(255,255,255,0.06)",
        }}>
          {enTurno && (
            <>
              <div style={{ position: "absolute", right: -30, top: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", right: 30, bottom: -30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            </>
          )}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                width: 9, height: 9, borderRadius: "50%",
                background: enTurno ? "#4ade80" : "rgba(255,255,255,0.3)",
                display: "inline-block",
              }} />
              <span style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", opacity: 0.85, fontFamily: "Barlow, sans-serif" }}>
                {enTurno ? "En turno" : "Fuera de turno"}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2, marginBottom: 4, fontFamily: "Fraunces, serif" }}>
              {enTurno ? "Estás recibiendo pedidos" : "Activá tu turno para recibir pedidos"}
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 18, fontFamily: "Barlow, sans-serif" }}>
              {enTurno ? "Visible para los negocios" : "No aparecés en el pool"}
            </div>

            <button
              onClick={handleToggle}
              disabled={pending}
              style={{
                width: "100%", padding: "13px 18px",
                background: "rgba(0,0,0,0.4)", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", fontFamily: "Barlow, sans-serif",
                opacity: pending ? 0.6 : 1,
              }}
            >
              <div style={{
                width: 46, height: 26, borderRadius: 999,
                background: enTurno ? "#fff" : "rgba(255,255,255,0.2)",
                position: "relative", flexShrink: 0,
              }}>
                <div style={{
                  position: "absolute", top: 3,
                  right: enTurno ? 3 : "auto",
                  left: enTurno ? "auto" : 3,
                  width: 20, height: 20, borderRadius: "50%",
                  background: enTurno ? "#0070cc" : "#fff",
                  transition: "all 200ms",
                }} />
              </div>
              <div style={{ textAlign: "left", flex: 1, color: "#fff" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{enTurno ? "Pausar turno" : "Activar turno"}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Vehículo: {repartidor.vehiculo}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "4px 18px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { l: "Hoy", v: String(pedidosHoy), s: "pedidos" },
          { l: "Ganado", v: `${ganado.toFixed(2)} €`, s: "+ propinas" },
          { l: "Vehículo", v: repartidor.vehiculo, s: "registrado" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px",
            color: "#fff", border: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, fontFamily: "Barlow, sans-serif" }}>{s.l}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3, lineHeight: 1.1, fontFamily: "Barlow, sans-serif" }}>{s.v}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1, fontFamily: "Barlow, sans-serif" }}>{s.s}</div>
          </div>
        ))}
      </div>

      {/* Pedidos activos */}
      <div style={{ padding: "10px 18px 100px", color: "#fff" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, fontFamily: "Barlow, sans-serif" }}>
          {pedidos.length === 0 ? "Sin pedidos asignados" : `Pedido${pedidos.length > 1 ? "s" : ""} asignado${pedidos.length > 1 ? "s" : ""}`}
        </div>

        {pedidos.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 18,
            padding: "32px 24px", textAlign: "center",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "Barlow, sans-serif", margin: 0 }}>
              {enTurno ? "Esperando nuevos pedidos..." : "Activá tu turno para recibir pedidos"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pedidos.map((pedido) => {
              const estadoLabel = ESTADO_LABEL[pedido.estado] ?? pedido.estado.toUpperCase();
              const estadoColor = ESTADO_COLOR[pedido.estado] ?? "#6b7280";
              return (
                <Link
                  key={pedido.id}
                  href={`/repartidor/pedido/${pedido.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "#fff", borderRadius: 18, padding: "18px 18px 16px",
                    color: "#1f1f1f", position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#6b6b6b", fontFamily: "monospace", fontWeight: 600 }}>{pedido.numero_pedido}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2, fontFamily: "Barlow, sans-serif" }}>{pedido.nombre_cliente}</div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 1,
                        padding: "4px 10px", borderRadius: 999,
                        background: estadoColor + "18", color: estadoColor,
                        fontFamily: "Barlow, sans-serif",
                      }}>
                        {estadoLabel}
                      </span>
                    </div>

                    <div style={{ background: "#f5f5f5", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "#6b6b6b", fontFamily: "Barlow, sans-serif" }}>
                        <span style={{ fontWeight: 600, color: "#1f1f1f" }}>Entregar en:</span> {pedido.direccion}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4, fontFamily: "Barlow, sans-serif" }}>
                        {pedido.distancia_km.toFixed(1)} km · {pedido.trayecto_min} min aprox.
                      </div>
                    </div>

                    <div style={{
                      background: "#000", borderRadius: 12, padding: "10px 14px",
                      display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff",
                    }}>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.55, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, fontFamily: "Barlow, sans-serif" }}>Cobrar al cliente</div>
                        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2, fontFamily: "Barlow, sans-serif" }}>
                          {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(pedido.total)}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#d97706" + "30", color: "#d97706", fontFamily: "Barlow, sans-serif", textTransform: "capitalize" }}>
                        {pedido.metodo_pago}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
