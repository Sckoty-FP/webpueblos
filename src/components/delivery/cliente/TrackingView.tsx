"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { PedidoDeliveryDB, PedidoItemDB, EstadoPedidoDelivery, RepartidorUbicacionDB } from "@/types/delivery";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format/currency";

const MapaTracking = dynamic(() => import("./MapaTracking"), { ssr: false });

interface Props {
  pedidoInicial: PedidoDeliveryDB;
  items:         PedidoItemDB[];
  puebloSlug:    string;
}

const ESTADO_LABELS: Record<EstadoPedidoDelivery, string> = {
  pendiente_pago: "Pendiente de confirmación",
  aceptado:       "Pedido confirmado",
  preparando:     "Preparando tu pedido",
  listo:          "Listo para recoger",
  en_camino:      "En camino",
  entregado:      "Entregado",
  cancelado:      "Cancelado",
  rechazado:      "Rechazado",
  fallido:        "Error en el pedido",
};

const TIMELINE_STEPS: EstadoPedidoDelivery[] = ["aceptado", "preparando", "en_camino", "entregado"];
const TIMELINE_LABELS: Partial<Record<EstadoPedidoDelivery, string>> = {
  aceptado:  "Confirmado",
  preparando: "Preparando",
  en_camino:  "En camino",
  entregado:  "Entregado",
};
const TIMELINE_ICONS: Partial<Record<EstadoPedidoDelivery, string>> = {
  aceptado:   "✓",
  preparando: "👨‍🍳",
  en_camino:  "🛵",
  entregado:  "🎉",
};

const ORDER_IDX: Partial<Record<EstadoPedidoDelivery, number>> = {
  pendiente_pago: 0,
  aceptado: 1,
  preparando: 2,
  listo: 3,
  en_camino: 4,
  entregado: 5,
};

function isFinal(estado: EstadoPedidoDelivery) {
  return ["entregado", "cancelado", "rechazado", "fallido"].includes(estado);
}

export default function TrackingView({ pedidoInicial, items, puebloSlug }: Props) {
  const [pedido, setPedido] = useState<PedidoDeliveryDB>(pedidoInicial);
  const [ubicacion, setUbicacion] = useState<RepartidorUbicacionDB | null>(null);

  const estado     = pedido.estado;
  const estadoIdx  = ORDER_IDX[estado] ?? 0;
  const esFinal    = isFinal(estado);

  // Suscripción realtime al pedido
  useEffect(() => {
    const supabase = createClient();

    const canal = supabase
      .channel(`tracking:${pedido.id}`)
      .on("postgres_changes", {
        event:  "UPDATE",
        schema: "public",
        table:  "pedidos_delivery",
        filter: `id=eq.${pedido.id}`,
      }, payload => {
        setPedido(payload.new as PedidoDeliveryDB);
      })
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [pedido.id]);

  // Suscripción realtime a ubicación del repartidor
  useEffect(() => {
    if (!pedido.repartidor_id) return;

    const supabase = createClient();

    // Cargar ubicación inicial
    supabase
      .from("repartidor_ubicacion")
      .select("*")
      .eq("repartidor_id", pedido.repartidor_id)
      .maybeSingle()
      .then(({ data }) => { if (data) setUbicacion(data as RepartidorUbicacionDB); });

    const canal = supabase
      .channel(`ubicacion:${pedido.repartidor_id}`)
      .on("postgres_changes", {
        event:  "*",
        schema: "public",
        table:  "repartidor_ubicacion",
        filter: `repartidor_id=eq.${pedido.repartidor_id}`,
      }, payload => {
        setUbicacion(payload.new as RepartidorUbicacionDB);
      })
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [pedido.repartidor_id]);

  const colorEstado = esFinal && estado !== "entregado"
    ? "#d53b00"
    : estado === "entregado"
    ? "#059669"
    : "#0070cc";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-12">
      {/* Breadcrumb */}
      <Link href={`/${puebloSlug}/delivery`} className="font-barlow text-[13px] text-[#6b6b6b] no-underline flex items-center gap-1 mb-4">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Delivery
      </Link>

      {/* Número de pedido */}
      <div className="mb-5">
        <p className="font-barlow text-[13px] text-[#888]">Pedido</p>
        <h1 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f]">{pedido.numero_pedido}</h1>
      </div>

      {/* Estado actual */}
      <div
        className="rounded-2xl p-5 mb-5 flex items-center gap-4"
        style={{ background: colorEstado, boxShadow: `0 4px 20px ${colorEstado}40` }}
      >
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
          {TIMELINE_ICONS[estado as keyof typeof TIMELINE_ICONS] ?? "📦"}
        </div>
        <div>
          <p className="font-barlow font-700 text-white text-[16px]">{ESTADO_LABELS[estado]}</p>
          {!esFinal && (
            <p className="font-barlow text-white/70 text-[13px] mt-0.5">ETA ~{pedido.eta_minutos} min</p>
          )}
        </div>
      </div>

      {/* Mapa */}
      {!esFinal && (
        <div className="bg-white rounded-2xl overflow-hidden mb-5 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <MapaTracking
            clienteLat={pedido.latitud}
            clienteLon={pedido.longitud}
            repartidorLat={ubicacion?.latitud}
            repartidorLon={ubicacion?.longitud}
          />
        </div>
      )}

      {/* Timeline */}
      {!["cancelado", "rechazado", "fallido"].includes(estado) && (
        <div className="bg-white rounded-2xl p-5 mb-5 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] mb-4">Estado del pedido</p>
          <div className="space-y-0">
            {TIMELINE_STEPS.map((step, idx) => {
              const done    = (ORDER_IDX[step] ?? 0) <= estadoIdx;
              const current = step === estado || (step === "aceptado" && estado === "listo");
              return (
                <div key={step} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-barlow font-700 text-[13px] shrink-0"
                      style={{ background: done ? "#0070cc" : "#f0f0f0", color: done ? "white" : "#b0b0b0" }}
                    >
                      {done ? "✓" : idx + 1}
                    </div>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div className="w-0.5 h-8 mt-0.5" style={{ background: done ? "#0070cc" : "#f0f0f0" }} />
                    )}
                  </div>
                  <div className="pt-1 pb-4">
                    <p className="font-barlow font-600 text-[14px]" style={{ color: done ? "#1f1f1f" : "#b0b0b0" }}>
                      {TIMELINE_LABELS[step]}
                    </p>
                    {current && !done && (
                      <p className="font-barlow text-[12px] text-[#0070cc] mt-0.5">En progreso…</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Repartidor */}
      {pedido.repartidor_id && estado === "en_camino" && (
        <div className="bg-white rounded-2xl p-4 mb-5 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] mb-2">Tu repartidor está en camino</p>
          <a
            href={`tel:${pedido.telefono_cliente}`}
            className="inline-flex items-center gap-2 font-barlow font-600 text-[14px] text-[#0070cc] no-underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12.15a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.48 1.5h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l.72-.72a2 2 0 0 1 2.11-.45c.9.36 1.84.6 2.81.7A2 2 0 0 1 22 18.92v-2z"/>
            </svg>
            Llamar
          </a>
        </div>
      )}

      {/* Resumen de items */}
      <div className="bg-white rounded-2xl p-4 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] mb-3">Tu pedido</p>
        <div className="space-y-2">
          {items.map(i => (
            <div key={i.id} className="flex justify-between">
              <span className="font-barlow text-[14px] text-[#1f1f1f]">{i.cantidad}× {i.nombre}</span>
              <span className="font-barlow font-600 text-[14px] text-[#1f1f1f]">{formatCurrency(i.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#f0f0f0] mt-3 pt-3 space-y-1">
          <div className="flex justify-between font-barlow text-[13px] text-[#6b6b6b]">
            <span>Envío</span><span>{formatCurrency(pedido.coste_envio)}</span>
          </div>
          <div className="flex justify-between font-barlow font-700 text-[15px] text-[#1f1f1f]">
            <span>Total</span><span>{formatCurrency(pedido.total)}</span>
          </div>
          <p className="font-barlow text-[12px] text-[#888] capitalize">
            Pago: {pedido.metodo_pago.replace("_", " ")} · {pedido.pagado ? "Pagado" : "Pendiente de pago"}
          </p>
        </div>
      </div>

      {/* Motivo cancelación */}
      {pedido.motivo_cancelacion && (
        <div className="mt-4 bg-[#fee2e2] rounded-xl px-4 py-3">
          <p className="font-barlow font-600 text-[13px] text-[#991b1b]">Motivo</p>
          <p className="font-barlow text-[13px] text-[#991b1b] mt-0.5">{pedido.motivo_cancelacion}</p>
        </div>
      )}
    </div>
  );
}
