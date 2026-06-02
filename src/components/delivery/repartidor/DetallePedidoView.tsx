"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { cambiarEstadoPedidoRepartidorAction, confirmarCobroEfectivoAction, getRutaOSRMAction } from "@/app/repartidor/actions";
import type { PedidoConItemsYPrestador } from "@/lib/supabase/queries/delivery";

const MapaRuta = dynamic(() => import("./MapaRuta"), { ssr: false });

interface Props {
  pedido:       PedidoConItemsYPrestador;
  repartidorId: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export default function DetallePedidoView({ pedido }: Props) {
  const router = useRouter();
  const [vista, setVista] = useState<"detalle" | "mapa">("detalle");
  const [rutaPending, setRutaPending] = useState(false);
  const [ruta, setRuta] = useState<{ distance_km: number; duration_min: number; geometry: GeoJSON.LineString } | null>(null);
  const [pending, startTransition] = useTransition();
  const [esperandoConfirmacionCobro, setEsperandoConfirmacionCobro] = useState(
    pedido.estado === "entregado" && pedido.metodo_pago === "efectivo" && !pedido.pagado
  );

  const puedeIrEnCamino = pedido.estado === "listo" || pedido.estado === "preparando" || pedido.estado === "aceptado";
  const puedeEntregar   = pedido.estado === "en_camino";

  async function handleVerMapa() {
    if (ruta) { setVista("mapa"); return; }
    setRutaPending(true);
    const origen = pedido.prestador_lat && pedido.prestador_lon
      ? { lat: pedido.prestador_lat, lon: pedido.prestador_lon }
      : null;
    const destino = { lat: pedido.latitud, lon: pedido.longitud };
    const r = origen ? await getRutaOSRMAction(origen, destino) : null;
    setRuta(r);
    setRutaPending(false);
    setVista("mapa");
  }

  function handleCambiarEstado(estado: "en_camino" | "entregado") {
    startTransition(async () => {
      await cambiarEstadoPedidoRepartidorAction(pedido.id, estado);
      if (estado === "entregado") {
        if (pedido.metodo_pago === "efectivo") {
          setEsperandoConfirmacionCobro(true);
        } else {
          router.push("/repartidor");
        }
      } else {
        router.refresh();
      }
    });
  }

  function handleConfirmarCobro() {
    startTransition(async () => {
      await confirmarCobroEfectivoAction(pedido.id);
      router.push("/repartidor");
    });
  }

  if (vista === "mapa") {
    return (
      <div style={{ position: "relative", width: "100%", height: "100dvh" }}>
        <MapaRuta
          origen={pedido.prestador_lat && pedido.prestador_lon ? { lat: pedido.prestador_lat, lon: pedido.prestador_lon } : null}
          destino={{ lat: pedido.latitud, lon: pedido.longitud }}
          ruta={ruta}
          nombreDestino={pedido.nombre_cliente}
          direccionDestino={pedido.direccion}
        />

        {/* Floating top bar */}
        <div style={{ position: "absolute", top: 16, left: 14, right: 14, zIndex: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setVista("detalle")}
            style={{
              width: 42, height: 42, borderRadius: "50%", background: "#fff", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)", cursor: "pointer",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div style={{
            flex: 1, background: "#fff", borderRadius: 14,
            padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize: 10, color: "#6b6b6b", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, fontFamily: "Barlow, sans-serif" }}>
              {pedido.estado === "en_camino" ? "Yendo a entregar" : "Ir a recoger"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1f1f1f", marginTop: 1, fontFamily: "Barlow, sans-serif" }}>
              {pedido.nombre_cliente} · {pedido.distancia_km.toFixed(1)} km
            </div>
          </div>
        </div>

        {/* ETA pill */}
        {ruta && (
          <div style={{
            position: "absolute", top: 78, left: "50%", transform: "translateX(-50%)", zIndex: 10,
            background: "#000", borderRadius: 999, padding: "8px 16px",
            display: "flex", alignItems: "center", gap: 10,
            color: "#fff", boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "Barlow, sans-serif" }}>{Math.round(ruta.duration_min)} min restantes</div>
            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ fontSize: 12, opacity: 0.7, fontFamily: "Barlow, sans-serif" }}>{ruta.distance_km.toFixed(1)} km</div>
          </div>
        )}

        {/* Bottom action */}
        {(puedeEntregar || esperandoConfirmacionCobro) && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
            background: "#fff", padding: "12px 16px 28px",
            borderTop: "1px solid #f0f0f0",
          }}>
            {esperandoConfirmacionCobro ? (
              <button
                onClick={handleConfirmarCobro}
                disabled={pending}
                style={{
                  width: "100%", height: 54, borderRadius: 14,
                  background: "#d97706", color: "#fff", border: "none",
                  fontSize: 15, fontWeight: 600, cursor: "pointer",
                  fontFamily: "Barlow, sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: pending ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: 18 }}>💵</span>
                {pending ? "Confirmando..." : "Confirmar cobro en efectivo"}
              </button>
            ) : (
              <button
                onClick={() => handleCambiarEstado("entregado")}
                disabled={pending}
                style={{
                  width: "100%", height: 54, borderRadius: 14,
                  background: "#059669", color: "#fff", border: "none",
                  fontSize: 15, fontWeight: 600, cursor: "pointer",
                  fontFamily: "Barlow, sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: pending ? 0.6 : 1,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {pending ? "Guardando..." : "He entregado el pedido"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vista detalle
  return (
    <div style={{ minHeight: "100dvh", background: "#fff" }}>
      {/* Top bar */}
      <div style={{
        padding: "14px 16px", background: "#fff", display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, zIndex: 5,
      }}>
        <button
          onClick={() => router.push("/repartidor")}
          style={{
            width: 36, height: 36, borderRadius: "50%", background: "#f5f5f5", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#1f1f1f", cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#6b6b6b", fontFamily: "monospace", fontWeight: 600 }}>{pedido.numero_pedido}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1f1f1f", fontFamily: "Barlow, sans-serif" }}>Detalle del pedido</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1,
          padding: "4px 12px", borderRadius: 999,
          background: "#0070cc18", color: "#0070cc",
          fontFamily: "Barlow, sans-serif", textTransform: "uppercase",
        }}>
          {pedido.estado.replace("_", " ")}
        </span>
      </div>

      <div style={{ paddingBottom: 100 }}>
        {/* Ruta stops */}
        <div style={{ padding: "18px 16px 14px" }}>
          <div style={{ fontSize: 11, color: "#6b6b6b", letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, fontFamily: "Barlow, sans-serif" }}>Tu ruta</div>

          {/* Stop 1 — Negocio */}
          <div style={{
            background: "#f5f5f5", borderRadius: 14, padding: "14px 16px",
            display: "flex", gap: 13, alignItems: "flex-start", marginBottom: 10,
            opacity: pedido.estado === "en_camino" || pedido.estado === "entregado" ? 0.65 : 1,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: (pedido.estado === "en_camino" || pedido.estado === "entregado") ? "#059669" : "#1f1f1f",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 2,
            }}>
              {(pedido.estado === "en_camino" || pedido.estado === "entregado")
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : <span style={{ fontSize: 12, fontWeight: 700 }}>1</span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#6b6b6b", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>Recoger en</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1f1f1f", marginTop: 2, fontFamily: "Barlow, sans-serif" }}>{pedido.prestador_nombre}</div>
              <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 2, fontFamily: "Barlow, sans-serif" }}>{pedido.prestador_dir}</div>
            </div>
          </div>

          {/* Stop 2 — Cliente */}
          <div style={{
            background: pedido.estado === "en_camino" ? "#fff" : "#f5f5f5",
            border: pedido.estado === "en_camino" ? "2px solid #0070cc" : "1px solid #f0f0f0",
            borderRadius: 14, padding: "14px 16px",
            display: "flex", gap: 13, alignItems: "flex-start",
            boxShadow: pedido.estado === "en_camino" ? "0 4px 12px #0070cc15" : "none",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: pedido.estado === "en_camino" ? "#0070cc" : "#f97316",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 2,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>2</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: pedido.estado === "en_camino" ? "#0070cc" : "#6b6b6b", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>Entregar a</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1f1f1f", marginTop: 2, fontFamily: "Barlow, sans-serif" }}>{pedido.nombre_cliente}</div>
              <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 2, fontFamily: "Barlow, sans-serif" }}>{pedido.direccion}</div>
              {pedido.detalles_direccion && (
                <div style={{ fontSize: 12, color: "#6b6b6b", fontFamily: "Barlow, sans-serif" }}>{pedido.detalles_direccion}</div>
              )}
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button
                  onClick={handleVerMapa}
                  disabled={rutaPending}
                  style={{
                    flex: 1, padding: "8px", background: "#0070cc", color: "#fff", border: "none", borderRadius: 9,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Barlow, sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    opacity: rutaPending ? 0.6 : 1,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                  {rutaPending ? "Cargando..." : "Ver mapa"}
                </button>
                <a
                  href={`tel:${pedido.telefono_cliente}`}
                  style={{
                    flex: 1, padding: "8px", background: "#f5f5f5", color: "#1f1f1f",
                    border: "1px solid #f0f0f0", borderRadius: 9,
                    fontSize: 12, fontWeight: 600, fontFamily: "Barlow, sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    textDecoration: "none",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39C1.6 2.3 2.38 1.4 3.47 1.4H6.5a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17"/>
                  </svg>
                  Llamar
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        {pedido.notas_cliente && (
          <div style={{ padding: "0 16px 14px" }}>
            <div style={{ background: "#f5f5f5", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#1f1f1f", lineHeight: 1.5, fontFamily: "Barlow, sans-serif" }}>
              <strong>Nota: </strong>{pedido.notas_cliente}
            </div>
          </div>
        )}

        {/* Items */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#6b6b6b", letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, fontFamily: "Barlow, sans-serif" }}>Lo que llevás</div>
          <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, overflow: "hidden" }}>
            {pedido.items.map((item, i) => (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px",
                borderBottom: i < pedido.items.length - 1 ? "1px solid #f0f0f0" : "none",
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "#05996918", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#6b6b6b", fontWeight: 600, fontFamily: "Barlow, sans-serif" }}>{item.cantidad}×</span>
                  <span style={{ fontSize: 13, color: "#1f1f1f", fontFamily: "Barlow, sans-serif" }}>{item.nombre}</span>
                </div>
                <span style={{ fontSize: 12, color: "#6b6b6b", fontFamily: "Barlow, sans-serif" }}>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cobro */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#6b6b6b", letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, fontFamily: "Barlow, sans-serif" }}>Cobro</div>
          <div style={{ background: "#000", borderRadius: 14, padding: "18px 20px", color: "#fff" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Barlow, sans-serif" }}>
                <span style={{ opacity: 0.55 }}>Subtotal</span>
                <span>{formatCurrency(pedido.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Barlow, sans-serif" }}>
                <span style={{ opacity: 0.55 }}>Envío</span>
                <span>{formatCurrency(pedido.coste_envio)}</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "5px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "Barlow, sans-serif" }}>Cobrar al cliente</span>
                <strong style={{ fontSize: 22, fontWeight: 600, fontFamily: "Barlow, sans-serif" }}>{formatCurrency(pedido.total)}</strong>
              </div>
            </div>
            <div style={{
              marginTop: 14, padding: "10px 12px", background: "#d9770622",
              borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#d97706",
              display: "flex", alignItems: "center", gap: 7, fontFamily: "Barlow, sans-serif",
              textTransform: "capitalize",
            }}>
              {pedido.metodo_pago}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", padding: "12px 16px 28px",
        borderTop: "1px solid #f0f0f0",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
        zIndex: 10,
      }}>
        {esperandoConfirmacionCobro && (
          <div>
            <div style={{ marginBottom: 10, padding: "12px 14px", background: "#d9770612", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>💵</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1f1f1f", fontFamily: "Barlow, sans-serif" }}>
                  Cobrar al cliente: {formatCurrency(pedido.total)}
                </div>
                <div style={{ fontSize: 12, color: "#6b6b6b", fontFamily: "Barlow, sans-serif" }}>
                  Subtotal: {formatCurrency(pedido.subtotal)} · Envío: {formatCurrency(pedido.coste_envio)}
                </div>
              </div>
            </div>
            <button
              onClick={handleConfirmarCobro}
              disabled={pending}
              style={{
                width: "100%", height: 54, borderRadius: 14,
                background: "#d97706", color: "#fff", border: "none",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                fontFamily: "Barlow, sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: pending ? 0.6 : 1,
              }}
            >
              <span style={{ fontSize: 18 }}>💵</span>
              {pending ? "Confirmando..." : "Confirmar que cobré en efectivo"}
            </button>
          </div>
        )}
        {!esperandoConfirmacionCobro && puedeIrEnCamino && (
          <button
            onClick={() => handleCambiarEstado("en_camino")}
            disabled={pending}
            style={{
              width: "100%", height: 54, borderRadius: 14,
              background: "#000", color: "#fff", border: "none",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
              fontFamily: "Barlow, sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: pending ? 0.6 : 1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            {pending ? "Actualizando..." : "Recogido · Iniciar entrega"}
          </button>
        )}
        {!esperandoConfirmacionCobro && puedeEntregar && (
          <button
            onClick={() => handleCambiarEstado("entregado")}
            disabled={pending}
            style={{
              width: "100%", height: 54, borderRadius: 14,
              background: "#059669", color: "#fff", border: "none",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
              fontFamily: "Barlow, sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: pending ? 0.6 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {pending ? "Guardando..." : "Marcar como entregado"}
          </button>
        )}
      </div>
    </div>
  );
}
