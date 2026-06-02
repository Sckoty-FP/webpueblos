"use client";

import { formatCurrency } from "@/lib/format/currency";
import type { AdminKpis, KpiPorPueblo, SaldoPendiente } from "@/types/admin";

interface Props {
  kpis:             AdminKpis;
  kpisPueblo:       KpiPorPueblo[];
  saldosPendientes: SaldoPendiente[];
}

function KpiCard({
  label, value, sub, accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-primary/10 border-primary/30" : "bg-white/[0.03] border-white/[0.08]"}`}>
      <p className="font-barlow text-[12px] text-white/40 mb-2 uppercase tracking-wide">{label}</p>
      <p className={`font-fraunces font-semibold text-[28px] leading-none ${accent ? "text-primary" : "text-white"}`}>
        {typeof value === "number" && value >= 100 ? formatCurrency(value) : value}
      </p>
      {sub && <p className="font-barlow text-[12px] text-white/30 mt-1.5">{sub}</p>}
    </div>
  );
}

function StatPill({ label, value, color = "gray" }: { label: string; value: number | string; color?: string }) {
  const colors: Record<string, string> = {
    gray:   "bg-white/[0.05] text-white/60",
    green:  "bg-emerald-500/10 text-emerald-400",
    amber:  "bg-amber-500/10 text-amber-400",
    red:    "bg-red-500/10 text-red-400",
    blue:   "bg-blue-500/10 text-blue-400",
  };
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${colors[color] ?? colors.gray}`}>
      <span className="font-barlow text-[13px]">{label}</span>
      <span className="font-barlow font-bold text-[13px]">{value}</span>
    </div>
  );
}

export default function AdminHomeView({ kpis, kpisPueblo, saldosPendientes }: Props) {
  const mes = new Date().toLocaleString("es", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-14 md:pt-0">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="font-barlow text-[12px] text-white/30 uppercase tracking-widest mb-1">Panel de control</p>
          <h1 className="font-fraunces font-semibold text-[32px] leading-tight text-white capitalize">{mes}</h1>
        </div>

        {/* KPIs principales — fila 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <KpiCard
            label="GMV Total"
            value={kpis.gmv_total}
            sub={`Comida: ${formatCurrency(kpis.gmv_comida)} · Delivery: ${formatCurrency(kpis.gmv_delivery)}`}
            accent
          />
          <KpiCard
            label="Pedidos delivery"
            value={kpis.pedidos_delivery}
            sub="entregados este mes"
          />
          <KpiCard
            label="Reservas confirmadas"
            value={kpis.reservas_confirmadas}
            sub="este mes"
          />
          <KpiCard
            label="Free Tour — inscritos"
            value={kpis.free_tour_inscritos}
            sub={`Comisión: ${formatCurrency(kpis.comision_free_tour)}`}
          />
        </div>

        {/* KPIs secundarios — fila 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <KpiCard label="Saldo pendiente" value={kpis.saldo_pendiente} sub="a cobrar a negocios" />
          <KpiCard label="Negocios activos" value={kpis.negocios_activos} />
          <KpiCard
            label="Tickets abiertos"
            value={kpis.tickets_abiertos}
            sub={kpis.tickets_urgentes > 0 ? `${kpis.tickets_urgentes} urgentes` : undefined}
          />
          <KpiCard
            label="Repartidores en turno"
            value={kpis.repartidores_turno}
            sub="ahora mismo"
          />
        </div>

        {/* Dos columnas: pueblos + saldos */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* KPIs por pueblo */}
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5">
            <h2 className="font-barlow font-semibold text-[14px] text-white/70 mb-4 uppercase tracking-wide">
              GMV por pueblo — este mes
            </h2>
            {kpisPueblo.length === 0 ? (
              <p className="font-barlow text-[13px] text-white/30">Sin datos este mes.</p>
            ) : (
              <div className="space-y-2">
                {kpisPueblo.map((p) => (
                  <div key={p.pueblo_id}
                       className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                    <div>
                      <p className="font-barlow font-medium text-[13px] text-white">{p.pueblo_nombre}</p>
                      <p className="font-barlow text-[11px] text-white/30">{p.pedidos} pedidos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-fraunces font-semibold text-[16px] text-white">
                        {formatCurrency(p.gmv_total)}
                      </p>
                      <p className="font-barlow text-[11px] text-white/30">
                        del. {formatCurrency(p.gmv_delivery)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saldos pendientes */}
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-barlow font-semibold text-[14px] text-white/70 uppercase tracking-wide">
                Saldo a cobrar
              </h2>
              <a href="/admin/comisiones"
                 className="font-barlow text-[12px] text-primary hover:opacity-80 transition-opacity no-underline">
                Ver todo →
              </a>
            </div>
            {saldosPendientes.length === 0 ? (
              <p className="font-barlow text-[13px] text-white/30">Sin saldos pendientes.</p>
            ) : (
              <div className="space-y-2">
                {saldosPendientes.slice(0, 6).map((s) => (
                  <div key={s.prestador_id}
                       className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                    <div>
                      <p className="font-barlow font-medium text-[13px] text-white">{s.negocio}</p>
                      <p className="font-barlow text-[11px] text-white/30">{s.items_pendientes} items</p>
                    </div>
                    <p className="font-fraunces font-semibold text-[16px] text-amber-400">
                      {formatCurrency(s.saldo_total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Resumen operativo */}
        <div className="mt-6 bg-white/[0.03] rounded-xl border border-white/[0.08] p-5">
          <h2 className="font-barlow font-semibold text-[14px] text-white/70 mb-4 uppercase tracking-wide">
            Estado operativo
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatPill
              label="Repartidores activos"
              value={kpis.repartidores_turno}
              color={kpis.repartidores_turno > 0 ? "green" : "gray"}
            />
            <StatPill
              label="Tickets urgentes"
              value={kpis.tickets_urgentes}
              color={kpis.tickets_urgentes > 0 ? "red" : "green"}
            />
            <StatPill
              label="Saldo acum."
              value={formatCurrency(kpis.saldo_pendiente)}
              color={kpis.saldo_pendiente > 0 ? "amber" : "green"}
            />
            <StatPill
              label="Negocios activos"
              value={kpis.negocios_activos}
              color="blue"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
