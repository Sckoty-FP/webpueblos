"use client";

import { useState, useTransition } from "react";
import { asignarRepartidorAction } from "@/app/panel/delivery/actions";
import type { PedidoDeliveryDB, RepartidorDB } from "@/types/delivery";
import { CheckIcon, XIcon, BikeIcon, MotoIcon } from "@/components/delivery/DeliveryIcons";

const T = {
  blue: "#0070cc", divider: "#f3f3f3", ink: "#1f1f1f",
  body: "#3a3a3a", muted: "#6b6b6b", mist: "#f5f7fa",
  success: "#059669", error: "#c81b3a",
};

interface Props {
  pedido: PedidoDeliveryDB;
  repartidores: RepartidorDB[];
  onClose: () => void;
  onAsignado: () => void;
}

export default function AsignarRepartidorModal({ pedido, repartidores, onClose, onAsignado }: Props) {
  const [seleccionado, setSeleccionado] = useState<string | null>(
    repartidores[0]?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAsignar = () => {
    if (!seleccionado) return;
    setError(null);
    startTransition(async () => {
      try {
        await asignarRepartidorAction(pedido.id, seleccionado);
        onAsignado();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al asignar repartidor");
      }
    });
  };

  const repartidorNombre = repartidores.find((r) => r.id === seleccionado)?.usuario?.nombre ?? "";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 560,
          maxHeight: "calc(100% - 80px)",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "22px 26px 16px", borderBottom: `1px solid ${T.divider}` }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="font-mono" style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 600, color: T.muted, textTransform: "uppercase", marginBottom: 4 }}>
                Pedido {pedido.numero_pedido}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: T.ink }}>Asignar repartidor</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                {repartidores.length} repartidores en turno · entrega a {pedido.distancia_km.toFixed(1)} km
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-full"
              style={{ width: 32, height: 32, background: T.mist, border: "none", cursor: "pointer" }}
            >
              <XIcon className="w-3.5 h-3.5" style={{ color: T.ink }} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto" style={{ padding: "12px 18px" }}>
          {repartidores.length === 0 ? (
            <div className="py-10 text-center" style={{ color: T.muted, fontSize: 14 }}>
              No hay repartidores en turno ahora mismo.
            </div>
          ) : (
            repartidores.map((rep, idx) => {
              const isActive = seleccionado === rep.id;
              const nombre = rep.usuario?.nombre ?? "Repartidor";
              return (
                <button
                  key={rep.id}
                  onClick={() => setSeleccionado(rep.id)}
                  className="w-full flex items-center gap-3.5 text-left relative"
                  style={{
                    background: isActive ? `${T.blue}08` : "transparent",
                    border: isActive ? `2px solid ${T.blue}` : `1px solid ${T.divider}`,
                    borderRadius: 14,
                    padding: "14px 16px",
                    marginBottom: 9,
                    cursor: "pointer",
                    fontFamily: "Barlow, sans-serif",
                  }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full relative"
                    style={{
                      width: 46, height: 46,
                      background: isActive ? T.blue : "#000",
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    {nombre[0].toUpperCase()}
                    {rep.en_turno && (
                      <div
                        className="absolute"
                        style={{
                          bottom: 0, right: 0,
                          width: 14, height: 14,
                          borderRadius: "50%",
                          background: T.success,
                          border: "2.5px solid #fff",
                        }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{nombre}</span>
                      {idx === 0 && (
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ background: `${T.success}15`, color: T.success, fontSize: 10, fontWeight: 700 }}
                        >
                          Más cerca
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 mt-1" style={{ fontSize: 12, color: T.muted }}>
                      <span className="flex items-center gap-1">
                        {rep.vehiculo === "bici"
                          ? <BikeIcon className="w-2.5 h-2.5" />
                          : <MotoIcon className="w-2.5 h-2.5" />}
                        {rep.vehiculo}
                      </span>
                      <span>·</span>
                      <span>⭐ {(rep.rating_promedio ?? 0).toFixed(1)}</span>
                      <span>·</span>
                      <span>{rep.pedidos_completados} pedidos</span>
                    </div>
                  </div>

                  {isActive && (
                    <div
                      className="absolute flex items-center justify-center"
                      style={{ top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: T.blue, color: "#fff" }}
                    >
                      <CheckIcon className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })
          )}

          <div
            className="flex items-center gap-2 rounded-xl mt-2"
            style={{ padding: "10px 14px", background: T.mist, fontSize: 12, color: T.muted }}
          >
            <span>💡</span>
            <span>El repartidor recibirá una notificación inmediata con los detalles del pedido.</span>
          </div>

          {error && (
            <div className="mt-2 px-4 py-2.5 rounded-xl" style={{ background: `${T.error}10`, color: T.error, fontSize: 13, fontWeight: 500 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-between items-center gap-3"
          style={{ padding: "16px 22px", borderTop: `1px solid ${T.divider}`, background: T.mist }}
        >
          <button
            style={{ padding: "10px 16px", background: "transparent", border: "none", fontSize: 13, fontWeight: 500, color: T.body, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}
          >
            Repartidor propio
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              style={{ padding: "10px 20px", background: "#fff", border: `1px solid ${T.divider}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: T.body, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAsignar}
              disabled={isPending || !seleccionado}
              style={{ padding: "10px 22px", background: "#000", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Barlow, sans-serif", opacity: isPending || !seleccionado ? 0.6 : 1 }}
            >
              {isPending ? "Asignando..." : `Asignar a ${repartidorNombre.split(" ")[0]}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
