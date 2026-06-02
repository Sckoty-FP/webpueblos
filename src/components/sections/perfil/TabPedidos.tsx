import Link from "next/link";
import { formatCurrency } from "@/lib/format/currency";
import { formatAbsolute } from "@/lib/format/relative-date";
import type { PedidoUsuario } from "@/lib/supabase/queries/delivery-publico";

const ESTADO_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pendiente_pago: { bg: "#fffbeb", color: "#d97706", label: "Pendiente de pago" },
  aceptado:       { bg: "#ecfdf5", color: "#059669", label: "Aceptado" },
  preparando:     { bg: "#eff6ff", color: "#0070cc", label: "Preparando" },
  listo:          { bg: "#f5f3ff", color: "#7c3aed", label: "Listo" },
  en_camino:      { bg: "#fff7ed", color: "#ea580c", label: "En camino" },
  entregado:      { bg: "#ecfdf5", color: "#059669", label: "Entregado" },
  cancelado:      { bg: "#f3f4f6", color: "#6b7280", label: "Cancelado" },
  rechazado:      { bg: "#fef2f2", color: "#dc2626", label: "Rechazado" },
  fallido:        { bg: "#fef2f2", color: "#dc2626", label: "Fallido" },
};

export default function TabPedidos({ pedidos }: { pedidos: PedidoUsuario[] }) {
  if (pedidos.length === 0) {
    return (
      <div className="bg-white rounded-card-lg border border-divisor px-6 py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-fog flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <p className="font-barlow font-semibold text-[16px] text-text-body mb-2">Sin pedidos todavía</p>
        <p className="font-barlow text-[14px] text-text-muted">Tus pedidos de delivery aparecerán aquí.</p>
      </div>
    );
  }

  const recientes = pedidos.slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      {recientes.map(p => {
        const est = ESTADO_STYLE[p.estado] ?? { bg: "#f3f4f6", color: "#6b7280", label: p.estado };
        return (
          <div key={p.id} className="bg-white rounded-card-lg border border-divisor p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-barlow font-semibold text-[14px] text-text-body">{p.prestador_nombre}</p>
                <p className="font-barlow text-[12px] text-text-muted">
                  {formatAbsolute(p.created_at)} · #{p.numero_pedido}
                </p>
              </div>
              <span className="font-barlow font-semibold text-[11px] px-2.5 py-1 rounded-pill whitespace-nowrap"
                style={{ background: est.bg, color: est.color }}>
                {est.label}
              </span>
            </div>
            <p className="font-barlow font-bold text-[14px] text-text-body">
              Total {formatCurrency(p.total)}
            </p>
          </div>
        );
      })}
      {pedidos.length > 3 && (
        <Link
          href="/perfil/pedidos"
          className="block text-center font-barlow font-medium text-[13px] text-primary no-underline hover:underline py-2"
        >
          Ver todos los pedidos ({pedidos.length}) →
        </Link>
      )}
      {pedidos.length <= 3 && (
        <Link
          href="/perfil/pedidos"
          className="block text-center font-barlow font-medium text-[13px] text-primary no-underline hover:underline py-2"
        >
          Ver historial completo →
        </Link>
      )}
    </div>
  );
}
