"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToPedidos, playNotificacionPedido, type PedidoRealtimeEvent } from "@/lib/supabase/realtime/pedidos";
import { aceptarPedido, rechazarPedido, avanzarEstadoPedido } from "@/app/panel/delivery/actions";
import { siguienteEstado, labelBotonAvanzar } from "@/lib/delivery/estados";
import type { PedidoDeliveryDB, PedidoItemDB, EstadoPedidoDelivery, RepartidorDB } from "@/types/delivery";
import AsignarRepartidorModal from "./AsignarRepartidorModal";
import {
  TruckIcon, PinIcon, ClockIcon, PhoneIcon, CheckIcon,
  XIcon, PrintIcon, MoreIcon,
} from "@/components/delivery/DeliveryIcons";

// ─── Colores design tokens ────────────────────────────────────────────────────
const T = {
  blue: "#0070cc", cyan: "#1eaedb", orange: "#d53b00",
  mist: "#f5f7fa", divider: "#f3f3f3", ink: "#1f1f1f",
  body: "#3a3a3a", muted: "#6b6b6b", success: "#059669",
  warning: "#d97706", error: "#c81b3a",
};

// ─── Tab mapping ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "pendientes",  label: "Pendientes",  estados: ["pendiente_pago"] as EstadoPedidoDelivery[], color: T.orange },
  { id: "preparando",  label: "Preparando",  estados: ["aceptado", "preparando"] as EstadoPedidoDelivery[],          color: T.blue },
  { id: "listos",      label: "Listos",      estados: ["listo"] as EstadoPedidoDelivery[],                            color: T.warning },
  { id: "en_camino",   label: "En camino",   estados: ["en_camino"] as EstadoPedidoDelivery[],                        color: T.cyan },
  { id: "finalizados", label: "Finalizados", estados: ["entregado", "cancelado", "rechazado"] as EstadoPedidoDelivery[], color: T.muted },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
function tiempoRelativo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

function estadoLabel(estado: EstadoPedidoDelivery): string {
  const map: Record<EstadoPedidoDelivery, string> = {
    pendiente_pago: "PENDIENTE",
    aceptado: "ACEPTADO", preparando: "EN PREPARACIÓN",
    listo: "LISTO", en_camino: "EN CAMINO",
    entregado: "ENTREGADO", cancelado: "CANCELADO",
    rechazado: "RECHAZADO", fallido: "FALLIDO",
  };
  return map[estado] ?? estado.toUpperCase();
}

function estadoColor(estado: EstadoPedidoDelivery): string {
  if (estado === "pendiente_pago") return T.orange;
  if (estado === "aceptado" || estado === "preparando") return T.blue;
  if (estado === "listo") return T.warning;
  if (estado === "en_camino") return T.cyan;
  if (estado === "entregado") return T.success;
  return T.muted;
}

// La máquina de estados vive en @/lib/delivery/estados (módulo puro y testeado).
// Acá se reexporta el subconjunto que usa este componente.

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  prestadorId: string;
  pedidosIniciales: PedidoDeliveryDB[];
  repartidores: RepartidorDB[];
}

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({
  pedido,
  isSelected,
  onClick,
  onAceptar,
  onRechazar,
  isPending,
}: {
  pedido: PedidoDeliveryDB;
  isSelected: boolean;
  onClick: () => void;
  onAceptar?: () => void;
  onRechazar?: () => void;
  isPending: boolean;
}) {
  const isNuevo = pedido.estado === "pendiente_pago";
  return (
    <div
      onClick={onClick}
      className="mb-2.5 rounded-xl cursor-pointer transition-all"
      style={{
        padding: 14,
        border: isSelected
          ? `2px solid ${T.blue}`
          : isNuevo
          ? `1.5px solid ${T.orange}40`
          : `1px solid ${T.divider}`,
        background: isSelected ? `${T.blue}08` : "#fff",
        boxShadow: isNuevo ? `0 4px 12px ${T.orange}15` : "none",
      }}
    >
      <div className="flex justify-between items-start" style={{ marginBottom: 6 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>
            {pedido.numero_pedido}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginTop: 2 }}>
            {pedido.nombre_cliente} · {pedido.total.toFixed(2)} €
          </div>
        </div>
        <div className="text-right">
          <div style={{ fontSize: 11, color: T.muted }}>{tiempoRelativo(pedido.created_at)}</div>
          <div
            className="mt-1 px-2 py-0.5 rounded-full inline-block"
            style={{ background: `${estadoColor(pedido.estado)}15`, color: estadoColor(pedido.estado), fontSize: 10, fontWeight: 700 }}
          >
            {estadoLabel(pedido.estado)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: T.muted }}>
        <PinIcon className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{pedido.direccion} · {pedido.distancia_km.toFixed(1)} km</span>
      </div>

      {isNuevo && onAceptar && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onAceptar(); }}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg transition-opacity disabled:opacity-60"
            style={{ height: 34, background: "#000", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, fontFamily: "Barlow, sans-serif" }}
          >
            <CheckIcon className="w-3.5 h-3.5" /> Aceptar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRechazar?.(); }}
            disabled={isPending}
            className="flex items-center justify-center rounded-lg disabled:opacity-60"
            style={{ height: 34, padding: "0 14px", background: T.mist, color: T.body, border: `1px solid ${T.divider}`, fontSize: 13, fontWeight: 600, fontFamily: "Barlow, sans-serif" }}
          >
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── DetailPane ───────────────────────────────────────────────────────────────
function DetailPane({
  pedido,
  items,
  onAvanzar,
  onCancelar,
  onAsignar,
  onBack,
  isPending,
}: {
  pedido: PedidoDeliveryDB;
  items: PedidoItemDB[];
  onAvanzar: () => void;
  onCancelar: () => void;
  onAsignar: () => void;
  onBack?: () => void;
  isPending: boolean;
}) {
  const siguiente = siguienteEstado(pedido.estado);
  const puedeAsignar = pedido.delivery_modo === "plataforma"
    && (pedido.estado === "listo" || pedido.estado === "preparando" || pedido.estado === "aceptado")
    && !pedido.repartidor_id;

  return (
    <div className="flex-1 overflow-y-auto relative" style={{ background: T.mist }}>
      <div style={{ padding: "16px 16px 96px" }} className="md:px-8 md:pt-[22px]">
        {/* Back button — mobile only */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 mb-4 md:hidden"
            style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 13, fontWeight: 600, fontFamily: "Barlow, sans-serif", padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver a pedidos
          </button>
        )}
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="font-mono" style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 1.5 }}>
              {pedido.numero_pedido} · {tiempoRelativo(pedido.created_at)}
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: T.ink, marginTop: 4 }}>
              {pedido.nombre_cliente}
            </div>
            <div className="flex items-center gap-3 mt-1" style={{ fontSize: 13, color: T.muted }}>
              <span className="flex items-center gap-1">
                <PhoneIcon className="w-3 h-3" /> {pedido.telefono_cliente}
              </span>
            </div>
          </div>
          <span
            className="px-3 py-1.5 rounded-full"
            style={{ background: `${estadoColor(pedido.estado)}15`, color: estadoColor(pedido.estado), fontSize: 13, fontWeight: 600 }}
          >
            {estadoLabel(pedido.estado)}
          </span>
        </div>

        {/* Grid: items + address+totals */}
        <div className="grid gap-3.5 mb-3.5 grid-cols-1 md:grid-cols-[1.4fr_1fr]">
          {/* Items */}
          <div className="rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${T.divider}` }}>
            <div className="mb-3.5" style={{ fontSize: 11, color: T.muted, letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>
              Items del pedido
            </div>
            {items.length === 0 ? (
              <div style={{ fontSize: 13, color: T.muted }} className="text-center py-4">Cargando items...</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start pb-2.5"
                    style={{ borderBottom: idx < items.length - 1 ? `1px solid ${T.divider}` : "none" }}
                  >
                    <div className="flex gap-3">
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-lg"
                        style={{ width: 26, height: 26, background: T.mist, color: T.ink, fontSize: 12, fontWeight: 700 }}
                      >
                        {item.cantidad}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{item.nombre}</div>
                        {item.notas && (
                          <div style={{ fontSize: 12, color: T.warning, marginTop: 2 }}>📝 {item.notas}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{item.subtotal.toFixed(2)} €</div>
                  </div>
                ))}
              </div>
            )}
            {pedido.notas_cliente && (
              <div
                className="mt-3.5 rounded-xl flex gap-2 items-start"
                style={{ padding: "12px 14px", background: `${T.warning}12`, fontSize: 12, color: T.warning, fontWeight: 500 }}
              >
                <span>📝</span>
                <span><strong>Nota:</strong> {pedido.notas_cliente}</span>
              </div>
            )}
          </div>

          {/* Dirección + Cobro */}
          <div className="flex flex-col gap-3.5">
            <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${T.divider}` }}>
              <div
                className="flex items-center justify-center"
                style={{ height: 100, background: `repeating-linear-gradient(135deg, ${T.mist} 0, ${T.mist} 12px, ${T.divider} 12px, ${T.divider} 24px)` }}
              >
                <PinIcon className="w-6 h-6" style={{ color: T.blue }} />
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div className="mb-1.5" style={{ fontSize: 11, color: T.muted, letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>
                  Entregar en
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{pedido.direccion}</div>
                {pedido.detalles_direccion && (
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{pedido.detalles_direccion}</div>
                )}
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                  {pedido.distancia_km.toFixed(1)} km · ~{pedido.trayecto_min} min
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${T.divider}` }}>
              <div className="mb-2.5" style={{ fontSize: 11, color: T.muted, letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>
                Cobro
              </div>
              <div className="flex flex-col gap-1.5" style={{ fontSize: 13 }}>
                <div className="flex justify-between">
                  <span style={{ color: T.body }}>Subtotal</span>
                  <span style={{ color: T.ink, fontWeight: 500 }}>{pedido.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: T.body }}>Envío ({pedido.distancia_km.toFixed(1)} km)</span>
                  <span style={{ color: T.ink, fontWeight: 500 }}>{pedido.coste_envio.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: T.muted }}>Comisión {pedido.comision_porcentaje}%</span>
                  <span style={{ color: T.muted }}>−{pedido.comision_importe.toFixed(2)} €</span>
                </div>
                <div style={{ height: 1, background: T.divider, margin: "4px 0" }} />
                <div className="flex justify-between items-center">
                  <strong style={{ color: T.ink }}>Neto a caja</strong>
                  <strong style={{ color: T.success, fontSize: 16 }}>
                    {(pedido.total - pedido.comision_importe).toFixed(2)} €
                  </strong>
                </div>
              </div>
              <div
                className="mt-2.5 flex items-center gap-2 rounded-lg"
                style={{ padding: "8px 10px", background: T.mist, fontSize: 12, color: T.body }}
              >
                {pedido.metodo_pago === "efectivo" ? "💵" : "🏦"}
                <span><strong>{pedido.metodo_pago === "efectivo" ? "Efectivo" : "Transferencia"}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <TimelinePedido pedido={pedido} />
      </div>

      {/* Floating action bar */}
      <div
        className="absolute bottom-0 left-0 right-0 flex justify-between items-center gap-3.5 md:px-8"
        style={{ padding: "12px 14px", background: "#fff", borderTop: `1px solid ${T.divider}`, boxShadow: "0 -4px 12px rgba(0,0,0,0.04)" }}
      >
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 rounded-xl"
            style={{ padding: "10px 14px", background: T.mist, border: `1px solid ${T.divider}`, fontSize: 13, fontWeight: 500, color: T.body, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}
          >
            <PrintIcon className="w-3.5 h-3.5" /> Imprimir
          </button>
          <button
            onClick={onCancelar}
            disabled={isPending || ["entregado", "cancelado", "rechazado"].includes(pedido.estado)}
            className="flex items-center gap-1.5 rounded-xl disabled:opacity-40"
            style={{ padding: "10px 14px", background: "#fff", border: `1px solid ${T.error}30`, fontSize: 13, fontWeight: 500, color: T.error, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}
          >
            <XIcon className="w-3.5 h-3.5" /> Cancelar
          </button>
        </div>
        <div className="flex gap-2">
          {puedeAsignar && (
            <button
              onClick={onAsignar}
              className="flex items-center gap-1.5 rounded-xl"
              style={{ padding: "12px 16px", background: "#fff", border: `1.5px solid ${T.blue}`, fontSize: 13, fontWeight: 600, color: T.blue, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}
            >
              Asignar repartidor
            </button>
          )}
          {siguiente && (
            <button
              onClick={onAvanzar}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl disabled:opacity-60"
              style={{ padding: "12px 20px", background: "#000", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}
            >
              <CheckIcon className="w-3.5 h-3.5" /> {labelBotonAvanzar(pedido.estado)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function TimelinePedido({ pedido }: { pedido: PedidoDeliveryDB }) {
  const steps = [
    { label: "Recibido",   ts: pedido.created_at,   },
    { label: "Aceptado",   ts: pedido.aceptado_en,  },
    { label: "Preparando", ts: null,                 },
    { label: "Listo",      ts: pedido.listo_en,     },
    { label: "En camino",  ts: pedido.en_camino_en, },
    { label: "Entregado",  ts: pedido.entregado_en, },
  ];

  const activeIdx = (() => {
    if (pedido.estado === "entregado") return 5;
    if (pedido.estado === "en_camino") return 4;
    if (pedido.estado === "listo") return 3;
    if (pedido.estado === "preparando") return 2;
    if (pedido.estado === "aceptado") return 1;
    return 0;
  })();

  return (
    <div className="rounded-2xl" style={{ background: "#fff", border: `1px solid ${T.divider}`, padding: "18px 22px" }}>
      <div className="mb-3.5" style={{ fontSize: 11, color: T.muted, letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>
        Timeline
      </div>
      <div className="flex items-start">
        {steps.map((step, i) => (
          <div key={i} className="flex-1 relative flex flex-col items-center">
            {i < steps.length - 1 && (
              <div
                className="absolute top-2.5 left-1/2 right-[-50%] h-0.5"
                style={{ background: i < activeIdx ? "#000" : T.divider }}
              />
            )}
            <div
              className="w-5 h-5 rounded-full z-10 flex items-center justify-center"
              style={{
                background: i < activeIdx ? "#000" : i === activeIdx ? T.blue : "#fff",
                border: i <= activeIdx ? "none" : `2px solid ${T.divider}`,
                color: "#fff",
              }}
            >
              {i < activeIdx && <CheckIcon className="w-2.5 h-2.5" />}
            </div>
            <div className="mt-2 text-center" style={{ fontSize: 10, fontWeight: 600, color: i <= activeIdx ? T.ink : T.muted }}>
              {step.label}
            </div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>
              {step.ts ? new Date(step.ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
// Estados que la query inicial NO trae (se cargan bajo demanda al abrir la pestaña).
const ESTADOS_FINALIZADOS: EstadoPedidoDelivery[] = ["entregado", "cancelado", "rechazado"];

export default function PedidosView({ prestadorId, pedidosIniciales, repartidores }: Props) {
  const [pedidos, setPedidos] = useState<PedidoDeliveryDB[]>(pedidosIniciales);
  const [tabActivo, setTabActivo] = useState("pendientes");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoDeliveryDB | null>(null);
  const [showDetail, setShowDetail] = useState(false); // mobile: toggle between list and detail
  const [items, setItems] = useState<PedidoItemDB[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Finalizados: array separado, cargado bajo demanda. Se mantiene aparte de `pedidos`
  // (los activos) para que el polling de activos no lo pise.
  const [finalizados, setFinalizados] = useState<PedidoDeliveryDB[]>([]);
  const [finalizadosCargados, setFinalizadosCargados] = useState(false);
  const [loadingFinalizados, setLoadingFinalizados] = useState(false);
  // Ref para que el closure del listener realtime conozca el estado actual sin re-suscribirse.
  const finalizadosCargadosRef = useRef(false);
  useEffect(() => { finalizadosCargadosRef.current = finalizadosCargados; }, [finalizadosCargados]);

  // ─── Sync pedidoSeleccionado cuando pedidos cambia (revalidatePath / realtime) ─
  useEffect(() => {
    if (!pedidoSeleccionado) return;
    const updated = pedidos.find(p => p.id === pedidoSeleccionado.id);
    if (updated && updated.estado !== pedidoSeleccionado.estado) {
      setPedidoSeleccionado(updated);
    }
  }, [pedidos]);

  // ─── Cargar items del pedido seleccionado ──────────────────────────────────
  useEffect(() => {
    if (!pedidoSeleccionado) { setItems([]); return; }
    const supabase = createClient();
    supabase
      .from("pedido_items")
      .select("*")
      .eq("pedido_id", pedidoSeleccionado.id)
      .order("nombre")
      .then(({ data }) => setItems((data ?? []) as PedidoItemDB[]));
  }, [pedidoSeleccionado?.id]);

  // ─── Carga bajo demanda de finalizados (entregado/cancelado/rechazado) ──────
  // La query del servidor solo trae estados activos; el histórico se trae al
  // abrir la pestaña "Finalizados" (últimos 7 días, máx. 50).
  const cargarFinalizados = useCallback(async () => {
    setLoadingFinalizados(true);
    const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const supabase = createClient();
    const { data } = await supabase
      .from("pedidos_delivery")
      .select("*")
      .eq("prestador_id", prestadorId)
      .in("estado", ESTADOS_FINALIZADOS)
      .gte("created_at", desde)
      .order("created_at", { ascending: false })
      .limit(50);
    setFinalizados((data ?? []) as PedidoDeliveryDB[]);
    setFinalizadosCargados(true);
    setLoadingFinalizados(false);
  }, [prestadorId]);

  useEffect(() => {
    if (tabActivo === "finalizados" && !finalizadosCargados && !loadingFinalizados) {
      cargarFinalizados();
    }
  }, [tabActivo, finalizadosCargados, loadingFinalizados, cargarFinalizados]);

  // ─── Realtime + polling fallback ───────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToPedidos(prestadorId, (event: PedidoRealtimeEvent) => {
      if (event.type === "INSERT") {
        setPedidos((prev) => [event.pedido, ...prev]);
        if (event.pedido.estado === "pendiente_pago") {
          playNotificacionPedido();
          if ("vibrate" in navigator) navigator.vibrate(200);
        }
      } else if (event.type === "UPDATE") {
        const esFinalizado = ESTADOS_FINALIZADOS.includes(event.pedido.estado);
        if (esFinalizado) {
          // Mover de activos a finalizados (si la pestaña ya se cargó, lo refleja en vivo).
          setPedidos((prev) => prev.filter((p) => p.id !== event.pedido.id));
          if (finalizadosCargadosRef.current) {
            setFinalizados((prev) => [event.pedido, ...prev.filter((p) => p.id !== event.pedido.id)]);
          }
        } else {
          setPedidos((prev) =>
            prev.map((p) => (p.id === event.pedido.id ? event.pedido : p)),
          );
        }
        if (pedidoSeleccionado?.id === event.pedido.id) {
          setPedidoSeleccionado(event.pedido);
        }
      } else if (event.type === "DELETE") {
        setPedidos((prev) => prev.filter((p) => p.id !== event.id));
        setFinalizados((prev) => prev.filter((p) => p.id !== event.id));
        if (pedidoSeleccionado?.id === event.id) setPedidoSeleccionado(null);
      }
    });

    // Polling fallback cada 30s
    const poll = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("pedidos_delivery")
        .select("*")
        .eq("prestador_id", prestadorId)
        .in("estado", ["pendiente_pago", "aceptado", "preparando", "listo", "en_camino"] as const)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setPedidos(data as PedidoDeliveryDB[]);
    }, 30_000);

    return () => { unsub(); clearInterval(poll); };
  }, [prestadorId, pedidoSeleccionado?.id]);

  // ─── Tab counts ────────────────────────────────────────────────────────────
  const tabCounts = TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.id] = tab.id === "finalizados"
      ? finalizados.length
      : pedidos.filter((p) => tab.estados.includes(p.estado)).length;
    return acc;
  }, {});

  const pedidosDelTab = tabActivo === "finalizados"
    ? finalizados
    : pedidos.filter((p) => {
        const tab = TABS.find((t) => t.id === tabActivo);
        return tab ? tab.estados.includes(p.estado) : false;
      });

  // ─── Acciones ─────────────────────────────────────────────────────────────
  const handleAceptar = (pedidoId: string) => {
    startTransition(async () => { await aceptarPedido(pedidoId); });
  };

  const handleRechazar = (pedidoId: string) => {
    startTransition(async () => { await rechazarPedido(pedidoId); });
  };

  const handleAvanzar = () => {
    if (!pedidoSeleccionado) return;
    const sig = siguienteEstado(pedidoSeleccionado.estado);
    if (!sig) return;
    startTransition(async () => {
      await avanzarEstadoPedido(pedidoSeleccionado.id, sig);
    });
  };

  const handleCancelar = () => {
    if (!pedidoSeleccionado) return;
    startTransition(async () => {
      await rechazarPedido(pedidoSeleccionado.id, "Cancelado por el negocio");
    });
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const hoyCount = pedidos.length;
  const hoyFacturado = pedidos.reduce((s, p) => s + p.total, 0);

  return (
    <div className="h-full flex" style={{ background: T.mist }}>
      {/* ── Lista (siempre visible en desktop; oculta en mobile cuando hay detalle) ── */}
      <div
        className={`flex flex-col ${showDetail ? "hidden md:flex" : "flex"}`}
        style={{ width: "100%", maxWidth: 480, borderRight: `1px solid ${T.divider}`, background: "#fff", minWidth: 0 }}
      >
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5" style={{ padding: "18px 16px 12px" }}>
          {[
            { l: "Hoy", v: `${hoyCount}`, s: "pedidos" },
            { l: "Facturado", v: `${hoyFacturado.toFixed(0)} €`, s: "total bruto" },
            { l: "ETA medio", v: `${pedidos.length ? Math.round(pedidos.reduce((s, p) => s + p.eta_minutos, 0) / pedidos.length) : 0} min`, s: "tiempo total" },
          ].map((stat) => (
            <div key={stat.l} className="rounded-xl" style={{ background: T.mist, padding: "10px 10px" }}>
              <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{stat.l}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, lineHeight: 1.1, marginTop: 4 }}>{stat.v}</div>
              <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{stat.s}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 overflow-x-auto"
          style={{ padding: "0 14px 8px", borderBottom: `1px solid ${T.divider}`, scrollbarWidth: "none" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActivo(tab.id)}
              className="flex items-center gap-1.5 whitespace-nowrap"
              style={{
                padding: "10px 10px",
                background: "none",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                color: tabActivo === tab.id ? T.ink : T.muted,
                borderBottom: tabActivo === tab.id ? `2px solid ${T.blue}` : "2px solid transparent",
                fontFamily: "Barlow, sans-serif",
              }}
            >
              {tab.label}
              <span
                className="rounded-full"
                style={{
                  background: tabActivo === tab.id ? T.ink : T.divider,
                  color: tabActivo === tab.id ? "#fff" : T.muted,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                }}
              >
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Order list */}
        <div className="overflow-y-auto flex-1" style={{ padding: "12px 14px 18px" }}>
          {tabActivo === "finalizados" && loadingFinalizados ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: T.muted }}>
              <div className="w-7 h-7 mb-3 rounded-full animate-spin" style={{ border: `3px solid ${T.divider}`, borderTopColor: T.blue }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>Cargando historial…</div>
            </div>
          ) : pedidosDelTab.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: T.muted }}>
              <TruckIcon className="w-10 h-10 mb-3 opacity-30" />
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {tabActivo === "finalizados" ? "Sin pedidos finalizados en los últimos 7 días" : "Sin pedidos en esta sección"}
              </div>
            </div>
          ) : (
            pedidosDelTab.map((pedido) => (
              <OrderCard
                key={pedido.id}
                pedido={pedido}
                isSelected={pedidoSeleccionado?.id === pedido.id}
                onClick={() => { setPedidoSeleccionado(pedido); setShowDetail(true); }}
                onAceptar={() => handleAceptar(pedido.id)}
                onRechazar={() => handleRechazar(pedido.id)}
                isPending={isPending}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Detail pane (siempre visible en desktop; cubre la lista en mobile) ── */}
      <div className={`${showDetail ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {pedidoSeleccionado ? (
          <DetailPane
            pedido={pedidoSeleccionado}
            items={items}
            onAvanzar={handleAvanzar}
            onCancelar={handleCancelar}
            onAsignar={() => setShowModal(true)}
            isPending={isPending}
            onBack={() => setShowDetail(false)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ background: T.mist, color: T.muted }}>
            <TruckIcon className="w-14 h-14 mb-4 opacity-20" />
            <div style={{ fontSize: 16, fontWeight: 500 }}>Seleccioná un pedido para ver el detalle</div>
          </div>
        )}
      </div>

      {/* Modal asignar repartidor */}
      {showModal && pedidoSeleccionado && (
        <AsignarRepartidorModal
          pedido={pedidoSeleccionado}
          repartidores={repartidores}
          onClose={() => setShowModal(false)}
          onAsignado={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
