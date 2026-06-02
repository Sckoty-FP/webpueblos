"use client";

import { useState, useTransition } from "react";
import type { MovimientoCajaDB, ResumenCajaMes, MovimientoMetodo } from "@/types/caja";
import { formatCurrency } from "@/lib/format/currency";
import { formatAbsolute } from "@/lib/format/relative-date";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DOT_COLOR: Record<string, string> = {
  venta: "#059669", reserva: "#0070cc", delivery: "#d97706", free_tour: "#7c3aed",
  compra: "#6b7280", sueldo: "#374151", alquiler: "#374151", suministros: "#6b7280",
  impuestos: "#374151", comision_pueblo: "#d97706", otro: "#6b7280",
};
const METODO_EMOJI: Record<MovimientoMetodo, string> = {
  efectivo: "💵", tarjeta: "💳", transferencia: "🏦", bizum: "📱", otro: "💱",
};

function BadgeAuto() {
  return (
    <span className="text-[9px] font-mono font-700 tracking-[0.05em] px-1.5 py-0.5 rounded bg-[#f0f0f0] text-[#888]">AUTO</span>
  );
}

// ─── Modal nuevo movimiento ───────────────────────────────────────────────────

const CATEGORIAS_INGRESO = ["venta", "reserva", "delivery", "free_tour", "otro"];
const CATEGORIAS_EGRESO  = ["compra", "sueldo", "alquiler", "suministros", "impuestos", "otro"];

interface NuevoMovModalProps {
  tipoInicial?: "ingreso" | "egreso";
  onClose: () => void;
  onCreate: (data: FormData) => Promise<void>;
}

function NuevoMovModal({ tipoInicial = "ingreso", onClose, onCreate }: NuevoMovModalProps) {
  const [tipo, setTipo] = useState<"ingreso" | "egreso">(tipoInicial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const categorias = tipo === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tipo", tipo);
    setError("");
    startTransition(async () => {
      try {
        await onCreate(fd);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-4 pb-4">
      <div className="bg-white rounded-[18px] w-full max-w-md p-8" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.16)" }}>
        <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase mb-1">NUEVO MOVIMIENTO</p>
        <h2 className="font-fraunces font-semibold text-[20px] text-[#1f1f1f] mb-6">Registrar entrada</h2>

        {/* Tipo toggle */}
        <div className="flex rounded-xl border border-[#e5e5e5] mb-5 overflow-hidden">
          <button type="button" onClick={() => setTipo("ingreso")} className={`flex-1 py-2.5 text-[13px] font-barlow font-600 transition-colors ${tipo === "ingreso" ? "bg-[#1f1f1f] text-white" : "text-[#666]"}`}>Ingreso</button>
          <button type="button" onClick={() => setTipo("egreso")}  className={`flex-1 py-2.5 text-[13px] font-barlow font-600 transition-colors ${tipo === "egreso"  ? "bg-[#1f1f1f] text-white" : "text-[#666]"}`}>Egreso</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Categoría *</label>
            <select name="categoria" required className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc] bg-white capitalize">
              {categorias.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Concepto *</label>
            <input name="concepto" required className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" placeholder="Descripción del movimiento" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Importe (€) *</label>
              <input name="importe" type="number" step="0.01" min="0.01" required className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" placeholder="0,00" />
            </div>
            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Método</label>
              <select name="metodo" defaultValue="efectivo" className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc] bg-white">
                {(["efectivo","tarjeta","transferencia","bizum","otro"] as MovimientoMetodo[]).map(m => (
                  <option key={m} value={m}>{METODO_EMOJI[m]} {m}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Fecha</label>
            <input name="fecha" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" />
          </div>

          {error && <p className="text-[13px] text-[#c81b3a]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#e5e5e5] text-[14px] font-barlow font-600 text-[#444] hover:border-[#999] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex-1 py-3 rounded-xl bg-[#1f1f1f] text-white text-[14px] font-barlow font-600 disabled:opacity-50 hover:bg-[#333] transition-colors">
              {pending ? "Guardando…" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Stacked mini bar ─────────────────────────────────────────────────────────

function StackedBar({ segmentos, height = 4 }: { segmentos: { valor: number; color: string }[]; height?: number }) {
  const total = segmentos.reduce((s, seg) => s + seg.valor, 0);
  if (total === 0) return <div className="rounded-full bg-[#e5e5e5]" style={{ height }} />;
  return (
    <div className="flex rounded-full overflow-hidden" style={{ height }}>
      {segmentos.map((seg, i) => (
        <div key={i} style={{ width: `${(seg.valor / total) * 100}%`, backgroundColor: seg.color }} />
      ))}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface Props {
  movimientos: MovimientoCajaDB[];
  resumen: ResumenCajaMes;
  onCrearMovimiento: (data: FormData) => Promise<void>;
  onChangeMonth: (year: number, month: number) => void;
  year: number;
  month: number;
}

export default function CajaView({ movimientos, resumen, onCrearMovimiento, onChangeMonth, year, month }: Props) {
  const [filtro, setFiltro] = useState<"todos" | "ingresos" | "egresos" | "auto">("todos");
  const [showNuevo, setShowNuevo] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<"ingreso" | "egreso">("ingreso");

  const filtered = movimientos.filter(m => {
    if (filtro === "ingresos") return m.tipo === "ingreso";
    if (filtro === "egresos")  return m.tipo === "egreso";
    if (filtro === "auto")     return m.es_automatico;
    return true;
  });

  // Agrupar por fecha
  const porFecha: Record<string, MovimientoCajaDB[]> = {};
  for (const m of filtered) {
    if (!porFecha[m.fecha]) porFecha[m.fecha] = [];
    porFecha[m.fecha].push(m);
  }

  const ingresos = movimientos.filter(m => m.tipo === "ingreso");
  const egresos  = movimientos.filter(m => m.tipo === "egreso");
  const totalIngresos = ingresos.reduce((s, m) => s + Number(m.importe), 0);
  const totalEgresos  = egresos.reduce((s,  m) => s + Number(m.importe), 0);
  const balance = totalIngresos - totalEgresos;

  function prevMonth() {
    if (month === 1) onChangeMonth(year - 1, 12);
    else onChangeMonth(year, month - 1);
  }
  function nextMonth() {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) onChangeMonth(year + 1, 1);
    else onChangeMonth(year, month + 1);
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f7f5] overflow-y-auto">
      {showNuevo && (
        <NuevoMovModal
          tipoInicial={tipoNuevo}
          onClose={() => setShowNuevo(false)}
          onCreate={onCrearMovimiento}
        />
      )}

      <div className="px-7 py-6 space-y-6 max-w-[1100px] w-full mx-auto">

        {/* Period selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-[#e5e5e5] flex items-center justify-center text-[#444] hover:border-[#999] bg-white transition-colors">‹</button>
            <div>
              <h1 className="font-fraunces font-semibold text-[26px] text-[#1f1f1f] leading-none">
                {MESES[month - 1]} {year}
              </h1>
              <p className="text-[11px] font-mono text-[#888] mt-0.5">
                1 — {new Date(year, month, 0).getDate()} {MESES[month - 1].slice(0,3).toLowerCase()} · {movimientos.length} movimientos
              </p>
            </div>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl border border-[#e5e5e5] flex items-center justify-center text-[#444] hover:border-[#999] bg-white transition-colors">›</button>
          </div>
        </div>

        {/* Big numbers */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1.3fr 1fr 1fr" }}>
          {/* Balance negro */}
          <div className="rounded-[18px] bg-[#1f1f1f] p-6 text-white">
            <p className="text-[11px] font-barlow font-700 tracking-[0.08em] text-white/50 uppercase mb-3">BALANCE</p>
            <p className="font-fraunces font-semibold text-[48px] leading-none" style={{ color: balance >= 0 ? "#9be7c4" : "#ff8a8a" }}>
              {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
            </p>
          </div>

          {/* Ingresos */}
          <div className="rounded-[18px] bg-white border border-[#e5e5e5] p-5">
            <p className="text-[11px] font-barlow font-700 tracking-[0.08em] text-[#059669] uppercase mb-2">INGRESOS</p>
            <p className="font-fraunces font-semibold text-[32px] text-[#1f1f1f] leading-none">{formatCurrency(totalIngresos)}</p>
            <p className="text-[11px] font-barlow text-[#888] mt-1">{ingresos.length} movimientos</p>
            <div className="mt-3">
              <StackedBar segmentos={[
                { valor: ingresos.filter(m => m.categoria === "delivery").reduce((s,m) => s + Number(m.importe), 0), color: "#d97706" },
                { valor: ingresos.filter(m => m.categoria === "reserva").reduce((s,m) => s + Number(m.importe), 0), color: "#0070cc" },
                { valor: ingresos.filter(m => !["delivery","reserva"].includes(m.categoria)).reduce((s,m) => s + Number(m.importe), 0), color: "#059669" },
              ]} />
            </div>
          </div>

          {/* Egresos */}
          <div className="rounded-[18px] bg-white border border-[#e5e5e5] p-5">
            <p className="text-[11px] font-barlow font-700 tracking-[0.08em] text-[#c81b3a] uppercase mb-2">EGRESOS</p>
            <p className="font-fraunces font-semibold text-[32px] text-[#1f1f1f] leading-none">{formatCurrency(totalEgresos)}</p>
            <p className="text-[11px] font-barlow text-[#888] mt-1">{egresos.length} movimientos</p>
            <div className="mt-3">
              <StackedBar segmentos={[
                { valor: egresos.filter(m => m.categoria === "comision_pueblo").reduce((s,m) => s + Number(m.importe), 0), color: "#c81b3a" },
                { valor: egresos.filter(m => m.categoria === "compra").reduce((s,m) => s + Number(m.importe), 0), color: "#6b7280" },
                { valor: egresos.filter(m => !["comision_pueblo","compra"].includes(m.categoria)).reduce((s,m) => s + Number(m.importe), 0), color: "#d1d5db" },
              ]} />
            </div>
          </div>
        </div>

        {/* Movimientos */}
        <div className="bg-white rounded-[18px] border border-[#e5e5e5] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
            <h2 className="font-fraunces font-semibold text-[18px] text-[#1f1f1f]">Movimientos</h2>
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl border border-[#e5e5e5] overflow-hidden">
                {(["todos","ingresos","egresos","auto"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`text-[12px] font-barlow font-600 px-3 py-1.5 transition-colors capitalize ${
                      filtro === f ? "bg-[#1f1f1f] text-white" : "text-[#666] hover:bg-[#f7f7f5]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setTipoNuevo("egreso"); setShowNuevo(true); }}
                  className="text-[13px] font-barlow font-600 px-4 py-2 rounded-xl border border-[#e5e5e5] text-[#444] hover:border-[#999] transition-colors"
                >
                  ↑ Egreso
                </button>
                <button
                  onClick={() => { setTipoNuevo("ingreso"); setShowNuevo(true); }}
                  className="text-[13px] font-barlow font-600 px-4 py-2 rounded-xl bg-[#1f1f1f] text-white hover:bg-[#333] transition-colors"
                >
                  ↓ Ingreso
                </button>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[15px] font-barlow text-[#888]">No hay movimientos en este período</p>
            </div>
          ) : (
            <div>
              {/* Tabla header */}
              <div className="grid px-6 py-2.5 bg-[#f7f7f5] border-b border-[#f0f0f0] text-[10px] font-barlow font-700 text-[#888] uppercase tracking-[0.06em]"
                style={{ gridTemplateColumns: "90px 1fr 130px 120px 110px" }}
              >
                <span>Fecha</span><span>Concepto</span><span>Categoría</span><span>Método</span><span className="text-right">Importe</span>
              </div>

              {Object.entries(porFecha)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([fecha, movs]) => {
                  const totalDia = movs.reduce((s, m) => {
                    return m.tipo === "ingreso" ? s + Number(m.importe) : s - Number(m.importe);
                  }, 0);
                  return (
                    <div key={fecha}>
                      <div className="flex items-center justify-between px-6 py-2 bg-[#fafafa] border-b border-[#f0f0f0]">
                        <span className="text-[11px] font-mono text-[#888]">{formatAbsolute(fecha + "T00:00:00", false)}</span>
                        <span className={`text-[12px] font-barlow font-600 ${totalDia >= 0 ? "text-[#059669]" : "text-[#c81b3a]"}`}>
                          {totalDia >= 0 ? "+" : ""}{formatCurrency(totalDia)}
                        </span>
                      </div>
                      {movs.map(m => (
                        <div key={m.id} className="grid items-center px-6 py-3.5 border-b border-[#f7f7f5] hover:bg-[#f9f9f7] transition-colors"
                          style={{ gridTemplateColumns: "90px 1fr 130px 120px 110px" }}
                        >
                          <span className="text-[11px] font-mono text-[#888]">{formatAbsolute(m.fecha + "T00:00:00", false)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-barlow text-[#1f1f1f]">{m.concepto}</span>
                            {m.es_automatico && <BadgeAuto />}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DOT_COLOR[m.categoria] ?? "#999" }} />
                            <span className="text-[12px] font-barlow text-[#666] capitalize">{m.categoria.replace("_", " ")}</span>
                          </div>
                          <span className="text-[12px] font-barlow text-[#666]">
                            {METODO_EMOJI[m.metodo as MovimientoMetodo]} {m.metodo}
                          </span>
                          <span className={`text-right font-fraunces font-semibold text-[16px] ${m.tipo === "ingreso" ? "text-[#059669]" : "text-[#c81b3a]"}`}>
                            {m.tipo === "ingreso" ? "+" : "−"}{formatCurrency(Number(m.importe))}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
