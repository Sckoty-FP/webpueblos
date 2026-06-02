"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format/currency";
import { formatAbsolute } from "@/lib/format/relative-date";
import type { RemesaConPrestador, SaldoPendiente } from "@/types/admin";

interface Props {
  saldos:          SaldoPendiente[];
  remesas:         RemesaConPrestador[];
  onCrearRemesa:   (fd: FormData) => Promise<void>;
  onMarcarPagada:  (fd: FormData) => Promise<void>;
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "text-amber-400 bg-amber-400/10",
  pagada:    "text-emerald-400 bg-emerald-400/10",
  fallida:   "text-red-400 bg-red-400/10",
  cancelada: "text-white/30 bg-white/5",
};

export default function ComisionesAdminView({ saldos, remesas, onCrearRemesa, onMarcarPagada }: Props) {
  const [selectedPrestador, setSelectedPrestador] = useState<string>("");
  const [showNuevaRemesa,   setShowNuevaRemesa]   = useState(false);

  const totalPendiente = saldos.reduce((s, r) => s + r.saldo_total, 0);
  const selectedSaldo  = saldos.find((s) => s.prestador_id === selectedPrestador);

  // Obtener la fecha de inicio del mes actual para el formulario
  const hoy   = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const fin    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-14 md:pt-0">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <p className="font-barlow text-[12px] text-white/30 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="font-fraunces font-semibold text-[28px] text-white">Saldo / Cobros</h1>
          <p className="font-barlow text-[13px] text-white/40 mt-1">
            Comisiones acumuladas (delivery propio + free tour) pendientes de cobrar.
          </p>
        </div>

        {/* Total pendiente */}
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-6 py-5 mb-6">
          <p className="font-barlow text-[12px] text-amber-400/70 uppercase tracking-wide mb-1">
            Total pendiente de cobrar
          </p>
          <p className="font-fraunces font-semibold text-[40px] text-amber-400">
            {formatCurrency(totalPendiente)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Saldos por prestador */}
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5">
            <h2 className="font-barlow font-semibold text-[13px] text-white/50 uppercase tracking-wider mb-4">
              Por negocio
            </h2>
            {saldos.length === 0 ? (
              <p className="font-barlow text-[13px] text-white/30 py-4">Sin saldos pendientes.</p>
            ) : (
              <div className="space-y-2">
                {saldos.map((s) => (
                  <button
                    key={s.prestador_id}
                    onClick={() => {
                      setSelectedPrestador(s.prestador_id === selectedPrestador ? "" : s.prestador_id);
                      setShowNuevaRemesa(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left
                      ${selectedPrestador === s.prestador_id
                        ? "bg-primary/10 border-primary/30"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"}`}
                  >
                    <div>
                      <p className="font-barlow font-medium text-[13px] text-white">{s.negocio}</p>
                      <p className="font-barlow text-[11px] text-white/30">
                        {s.items_pendientes} items · desde {formatAbsolute(s.desde)}
                      </p>
                    </div>
                    <p className="font-fraunces font-semibold text-[18px] text-amber-400">
                      {formatCurrency(s.saldo_total)}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Botón crear remesa al seleccionar prestador */}
            {selectedPrestador && selectedSaldo && !showNuevaRemesa && (
              <button
                onClick={() => setShowNuevaRemesa(true)}
                className="mt-4 w-full font-barlow font-bold text-[13px] text-white bg-primary rounded-lg py-2.5 hover:opacity-90 transition-opacity"
              >
                Crear remesa para {selectedSaldo.negocio}
              </button>
            )}

            {/* Formulario nueva remesa */}
            {showNuevaRemesa && selectedSaldo && (
              <form action={onCrearRemesa} onSubmit={() => setShowNuevaRemesa(false)}
                    className="mt-4 bg-white/[0.03] rounded-lg border border-white/[0.08] p-4 space-y-3">
                <input type="hidden" name="prestador_id"  value={selectedPrestador} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-barlow text-[11px] text-white/40 mb-1">Periodo inicio</label>
                    <input type="date" name="periodo_inicio" defaultValue={inicio} required
                           className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block font-barlow text-[11px] text-white/40 mb-1">Periodo fin</label>
                    <input type="date" name="periodo_fin" defaultValue={fin} required
                           className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary" />
                  </div>
                </div>

                <div>
                  <label className="block font-barlow text-[11px] text-white/40 mb-1">
                    Importe total (€)
                  </label>
                  <input
                    type="number" name="importe_total" step="0.01" min="0" required
                    defaultValue={selectedSaldo.saldo_total}
                    className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-barlow text-[11px] text-white/40 mb-1">Notas (opcional)</label>
                  <input type="text" name="notas" placeholder="Comisiones delivery mayo..."
                         className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-primary" />
                </div>

                <div className="flex gap-2">
                  <button type="submit"
                          className="flex-1 font-barlow font-bold text-[13px] text-white bg-primary rounded-lg py-2.5 hover:opacity-90 transition-opacity">
                    Crear remesa
                  </button>
                  <button type="button" onClick={() => setShowNuevaRemesa(false)}
                          className="font-barlow text-[13px] text-white/40 hover:text-white/70 px-4 py-2.5">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Historial de remesas */}
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5">
            <h2 className="font-barlow font-semibold text-[13px] text-white/50 uppercase tracking-wider mb-4">
              Remesas generadas
            </h2>
            {remesas.length === 0 ? (
              <p className="font-barlow text-[13px] text-white/30 py-4">Sin remesas generadas aún.</p>
            ) : (
              <div className="space-y-3">
                {remesas.map((r) => (
                  <div key={r.id}
                       className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-barlow font-medium text-[13px] text-white">
                          {r.numero} · {r.prestador?.nombre ?? "—"}
                        </p>
                        <p className="font-barlow text-[11px] text-white/30">
                          {r.periodo_inicio} → {r.periodo_fin}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-fraunces font-semibold text-[18px] text-white">
                          {formatCurrency(r.importe_total)}
                        </p>
                        <span className={`font-barlow text-[10px] font-medium px-2 py-0.5 rounded-full
                          ${ESTADO_COLOR[r.estado] ?? "text-white/30 bg-white/5"}`}>
                          {r.estado}
                        </span>
                      </div>
                    </div>
                    {r.notas && (
                      <p className="font-barlow text-[11px] text-white/30 mb-3">{r.notas}</p>
                    )}
                    {r.estado === "pendiente" && (
                      <form action={onMarcarPagada}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit"
                                className="font-barlow text-[12px] font-medium text-emerald-400 hover:opacity-80 transition-opacity">
                          Marcar como pagada →
                        </button>
                      </form>
                    )}
                    {r.pagada_en && (
                      <p className="font-barlow text-[11px] text-white/20">
                        Pagada el {formatAbsolute(r.pagada_en)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
