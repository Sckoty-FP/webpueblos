"use client";

import { useState, useTransition } from "react";
import type { LineaPresupuesto } from "@/types/servicios-pro";

interface PresupuestoResumen {
  id:             string;
  numero:         string;
  cliente_nombre: string;
  descripcion:    string;
  lineas:         LineaPresupuesto[];
  importe_base:   number;
  iva_porcentaje: number;
  importe_total:  number;
  valido_hasta:   string | null;
  notas:          string | null;
}

type AccionResult = { ok: boolean; error?: string };

interface Props {
  presupuesto: PresupuestoResumen;
  onAceptar:   () => Promise<AccionResult>;
  onRechazar:  () => Promise<AccionResult>;
}

const BRAND = "#0369a1";

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default function AceptarPresupuestoClient({ presupuesto: p, onAceptar, onRechazar }: Props) {
  const [resultado, setResultado]   = useState<"aceptado" | "rechazado" | null>(null);
  const [error,     setError]       = useState("");
  const [pending,   startTransition] = useTransition();
  const [confirmReject, setConfirmReject] = useState(false);

  function handleAccion(accion: "aceptar" | "rechazar") {
    setError("");
    startTransition(async () => {
      const res = await (accion === "aceptar" ? onAceptar() : onRechazar());
      if (res.ok) {
        setResultado(accion === "aceptar" ? "aceptado" : "rechazado");
      } else {
        setError(res.error ?? "Error inesperado.");
      }
    });
  }

  if (resultado === "aceptado") {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-[#f0f0f0] p-10" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#d1fae5" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-fraunces font-semibold text-[24px] text-[#1f1f1f] mb-3">
            ¡Presupuesto aceptado!
          </h1>
          <p className="font-barlow text-[14px] text-[#666] leading-relaxed">
            El profesional ha sido notificado. Se pondrá en contacto contigo a la brevedad para coordinar el trabajo.
          </p>
        </div>
      </div>
    );
  }

  if (resultado === "rechazado") {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-[#f0f0f0] p-10" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>
          <p className="text-5xl mb-4">👋</p>
          <h1 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f] mb-3">
            Presupuesto rechazado
          </h1>
          <p className="font-barlow text-[14px] text-[#666]">
            Hemos notificado al profesional. Si cambiás de opinión, contactalo directamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div style={{ background: "linear-gradient(160deg, #0c1a2e 0%, #0f2744 100%)" }} className="py-10">
        <div className="max-w-2xl mx-auto px-4">
          <p className="font-barlow font-bold text-[11px] uppercase tracking-widest mb-2" style={{ color: `${BRAND}cc` }}>
            PRESUPUESTO
          </p>
          <h1 className="font-fraunces font-semibold text-white text-[32px] mb-1">{p.numero}</h1>
          <p className="font-barlow text-white/60 text-[14px]">Para: {p.cliente_nombre}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Descripción */}
        {p.descripcion && (
          <div className="bg-white rounded-2xl border border-[#f0f0f0] p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-[#888] mb-3">Descripción del trabajo</p>
            <p className="font-barlow text-[14px] text-[#3a3a3a] leading-relaxed">{p.descripcion}</p>
          </div>
        )}

        {/* Desglose */}
        <div className="bg-white rounded-2xl border border-[#f0f0f0] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: "#1f1f1f" }}>
            <span className="font-barlow font-bold text-[10px] uppercase tracking-widest text-white/60">CONCEPTO</span>
            <span className="font-barlow font-bold text-[10px] uppercase tracking-widest text-white/60">IMPORTE</span>
          </div>
          {p.lineas.map((l, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-[#f3f3f3] last:border-0">
              <span className="font-barlow text-[14px] text-[#3a3a3a]">{l.descripcion}</span>
              <span className="font-barlow font-semibold text-[14px] text-[#1f1f1f]">{fmt(l.importe)}</span>
            </div>
          ))}
          {/* Totales */}
          <div className="px-5 pt-3 pb-4 space-y-1.5 border-t border-[#f3f3f3]">
            <div className="flex justify-between">
              <span className="font-barlow text-[13px] text-[#888]">Base imponible</span>
              <span className="font-barlow text-[13px] text-[#888]">{fmt(p.importe_base)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-barlow text-[13px] text-[#888]">IVA ({p.iva_porcentaje}%)</span>
              <span className="font-barlow text-[13px] text-[#888]">{fmt(p.importe_total - p.importe_base)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#1f1f1f] mt-2">
              <span className="font-barlow font-bold text-[15px] text-[#1f1f1f]">TOTAL</span>
              <span className="font-fraunces font-semibold text-[20px] text-[#1f1f1f]">{fmt(p.importe_total)}</span>
            </div>
          </div>
        </div>

        {/* Notas + validez */}
        {(p.notas || p.valido_hasta) && (
          <div className="bg-white rounded-2xl border border-[#f0f0f0] p-5 space-y-2" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            {p.notas && <p className="font-barlow text-[13px] text-[#666] italic">{p.notas}</p>}
            {p.valido_hasta && (
              <p className="font-barlow text-[13px] font-semibold" style={{ color: "#d97706" }}>
                Válido hasta el {new Date(p.valido_hasta).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 font-barlow text-[13px] text-red-700 bg-red-50 border border-red-100">
            {error}
          </div>
        )}

        {/* Acciones */}
        {!confirmReject ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setConfirmReject(true)}
              disabled={pending}
              className="flex-1 font-barlow font-semibold text-[15px] py-3.5 rounded-xl border border-[#e5e5e5] text-[#888] hover:border-red-200 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => handleAccion("aceptar")}
              disabled={pending}
              className="flex-1 font-barlow font-bold text-[15px] py-3.5 rounded-xl text-white disabled:opacity-60 transition-opacity"
              style={{ background: "#059669" }}
            >
              {pending ? "Procesando…" : `Aceptar — ${fmt(p.importe_total)}`}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-red-100 p-5 space-y-3">
            <p className="font-barlow font-semibold text-[14px] text-[#1f1f1f]">
              ¿Estás seguro de que querés rechazar este presupuesto?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmReject(false)}
                className="flex-1 font-barlow font-semibold text-[14px] py-2.5 rounded-xl border border-[#e5e5e5] text-[#888]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAccion("rechazar")}
                disabled={pending}
                className="flex-1 font-barlow font-bold text-[14px] py-2.5 rounded-xl text-white disabled:opacity-60"
                style={{ background: "#dc2626" }}
              >
                {pending ? "Procesando…" : "Sí, rechazar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
