import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import PedirDeNuevoBtn from "@/components/delivery/cliente/PedirDeNuevoBtn";
import { requireUser } from "@/lib/auth/require-user";
import { getPedidosDelUsuario } from "@/lib/supabase/queries/delivery-publico";
import { formatCurrency } from "@/lib/format/currency";
import { formatAbsolute } from "@/lib/format/relative-date";
import type { EstadoPedidoDelivery } from "@/types/delivery";

export const metadata: Metadata = { title: "Mis pedidos" };

const ESTADO_STYLE: Record<EstadoPedidoDelivery, { bg: string; color: string; label: string }> = {
  pendiente_pago: { bg: "#fffbeb", color: "#d97706", label: "Pendiente de pago" },
  aceptado:       { bg: "#ecfdf5", color: "#059669", label: "Aceptado" },
  preparando:     { bg: "#eff6ff", color: "#0070cc", label: "Preparando" },
  listo:          { bg: "#f5f3ff", color: "#7c3aed", label: "Listo para retirar" },
  en_camino:      { bg: "#fff7ed", color: "#ea580c", label: "En camino" },
  entregado:      { bg: "#ecfdf5", color: "#059669", label: "Entregado" },
  cancelado:      { bg: "#f3f4f6", color: "#6b7280", label: "Cancelado" },
  rechazado:      { bg: "#fef2f2", color: "#dc2626", label: "Rechazado" },
  fallido:        { bg: "#fef2f2", color: "#dc2626", label: "Fallido" },
};

export default async function PedidosPage() {
  const user = await requireUser("/perfil/pedidos");
  const pedidos = await getPedidosDelUsuario(user.id);

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen bg-fog">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/perfil"
              className="text-[#6b6b6b] hover:text-[#1f1f1f] transition-colors"
              aria-label="Volver al perfil"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </Link>
            <h1 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f]">Mis pedidos</h1>
          </div>

          {pedidos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">📦</p>
              <p className="font-fraunces font-semibold text-[18px] text-[#1f1f1f] mb-2">
                Todavía no hiciste ningún pedido
              </p>
              <p className="font-barlow text-[14px] text-[#888] mb-6">
                Explorá los negocios con delivery y pedí desde casa.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidos.map(pedido => {
                const estadoStyle = ESTADO_STYLE[pedido.estado] ?? {
                  bg: "#f3f4f6", color: "#6b7280", label: pedido.estado,
                };
                return (
                  <div
                    key={pedido.id}
                    className="bg-white rounded-2xl p-4 border border-[#f0f0f0]"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                  >
                    {/* Negocio + fecha */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-barlow font-600 text-[15px] text-[#1f1f1f]">
                          {pedido.prestador_nombre}
                        </p>
                        <p className="font-barlow text-[12px] text-[#888]">
                          {formatAbsolute(pedido.created_at)} · #{pedido.numero_pedido}
                        </p>
                      </div>
                      <span
                        className="font-barlow font-600 text-[12px] px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ background: estadoStyle.bg, color: estadoStyle.color }}
                      >
                        {estadoStyle.label}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {pedido.items.map(item => (
                        <div key={item.id} className="flex justify-between font-barlow text-[13px] text-[#6b6b6b]">
                          <span>{item.cantidad}× {item.nombre}</span>
                          <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total + acción */}
                    <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-3">
                      <p className="font-barlow font-700 text-[15px] text-[#1f1f1f]">
                        Total {formatCurrency(pedido.total)}
                      </p>
                      {pedido.pueblo_slug && pedido.prestador_slug && pedido.items.length > 0 && (
                        <PedirDeNuevoBtn
                          prestadorId={pedido.prestador_id}
                          prestadorSlug={pedido.prestador_slug}
                          prestadorNombre={pedido.prestador_nombre}
                          puebloSlug={pedido.pueblo_slug}
                          items={pedido.items}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
