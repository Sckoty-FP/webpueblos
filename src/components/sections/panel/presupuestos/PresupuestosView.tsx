"use client";

import { useState, useTransition } from "react";
import type { PresupuestoDB, LineaPresupuesto } from "@/types/servicios-pro";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'solicitudes' | 'borradores' | 'enviados' | 'aceptados' | 'archivados';

interface Props {
  solicitudes:  PresupuestoDB[];
  borradores:   PresupuestoDB[];
  enviados:     PresupuestoDB[];
  aceptados:    PresupuestoDB[];
  archivados:   PresupuestoDB[];
  onCrear:      (data: PresupuestoFormData) => Promise<{ ok: boolean; error?: string }>;
  onActualizar: (id: string, data: PresupuestoFormData) => Promise<{ ok: boolean; error?: string }>;
  onEnviar:     (id: string) => Promise<{ ok: boolean; link?: string; error?: string }>;
  onGenerarPDF: (id: string) => Promise<{ ok: boolean; url?: string; error?: string }>;
  onVerPdf:     (id: string) => Promise<{ ok: boolean; url?: string; error?: string }>;
  onCrearParte: (presupuestoId: string) => void;
  appUrl:       string;
}

export interface PresupuestoFormData {
  cliente_nombre:     string;
  cliente_email:      string;
  cliente_telefono:   string;
  cliente_direccion:  string;
  descripcion:        string;
  lineas:             LineaPresupuesto[];
  iva_porcentaje:     number;
  valido_hasta:       string;
  notas:              string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = "#0369a1";
const TABS: { id: Tab; label: string }[] = [
  { id: "solicitudes", label: "Solicitudes" },
  { id: "borradores",  label: "Borradores"  },
  { id: "enviados",    label: "Enviados"    },
  { id: "aceptados",   label: "Aceptados"   },
  { id: "archivados",  label: "Archivados"  },
];

const ESTADO_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  borrador:  { bg: "#6b6b6b18", color: "#6b6b6b", label: "Borrador"  },
  enviado:   { bg: "#0369a118", color: BRAND,       label: "Enviado"   },
  aceptado:  { bg: "#05966918", color: "#059669",   label: "Aceptado"  },
  rechazado: { bg: "#c81b3a18", color: "#c81b3a",   label: "Rechazado" },
  expirado:  { bg: "#d9770618", color: "#d97706",   label: "Expirado"  },
  solicitud: { bg: "#d53b0018", color: "#d53b00",   label: "Solicitud" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function calcTotal(lineas: LineaPresupuesto[], iva: number) {
  const base = lineas.reduce((s, l) => s + l.importe, 0);
  return { base, total: base * (1 + iva / 100) };
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ estado, esSolicitud = false }: { estado: string; esSolicitud?: boolean }) {
  const key  = esSolicitud ? "solicitud" : estado;
  const info = ESTADO_BADGE[key] ?? ESTADO_BADGE.borrador;
  return (
    <span style={{
      background: info.bg, color: info.color,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
      padding: "2px 9px", borderRadius: 999, textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{info.label}</span>
  );
}

// ─── Modal presupuesto ────────────────────────────────────────────────────────

function PresupuestoModal({
  pre,
  onClose,
  onGuardar,
}: {
  pre:       PresupuestoDB | null;
  onClose:   () => void;
  onGuardar: (data: PresupuestoFormData) => Promise<void>;
}) {
  const esEdicion = !!pre;

  const [nombre,     setNombre]     = useState(pre?.cliente_nombre     ?? "");
  const [email,      setEmail]      = useState(pre?.cliente_email      ?? "");
  const [tel,        setTel]        = useState(pre?.cliente_telefono   ?? "");
  const [dir,        setDir]        = useState(pre?.cliente_direccion  ?? "");
  const [desc,       setDesc]       = useState(pre?.descripcion        ?? "");
  const [lineas,     setLineas]     = useState<LineaPresupuesto[]>(
    pre?.lineas?.length ? pre.lineas : [{ descripcion: "", importe: 0 }]
  );
  const [iva,        setIva]        = useState(pre?.iva_porcentaje ?? 21);
  const [valido,     setValido]     = useState(pre?.valido_hasta ?? "");
  const [notas,      setNotas]      = useState(pre?.notas ?? "");
  const [error,      setError]      = useState("");
  const [pending,    startTransition] = useTransition();

  const { base, total } = calcTotal(lineas, iva);

  function addLinea() {
    setLineas(l => [...l, { descripcion: "", importe: 0 }]);
  }
  function removeLinea(i: number) {
    setLineas(l => l.filter((_, idx) => idx !== i));
  }
  function updateLinea(i: number, field: keyof LineaPresupuesto, val: string) {
    setLineas(l => l.map((ln, idx) =>
      idx !== i ? ln : { ...ln, [field]: field === "importe" ? parseFloat(val) || 0 : val }
    ));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre del cliente es obligatorio."); return; }
    if (lineas.length === 0) { setError("Añade al menos una línea al presupuesto."); return; }
    setError("");
    startTransition(async () => {
      await onGuardar({ cliente_nombre: nombre, cliente_email: email, cliente_telefono: tel, cliente_direccion: dir, descripcion: desc, lineas, iva_porcentaje: iva, valido_hasta: valido, notas });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-[18px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ boxShadow: "0 24px 60px -12px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#f0f0f0]">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: BRAND + "18", color: BRAND }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6"/></svg>
          </div>
          <div>
            <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-text-muted">
              {esEdicion ? "EDITAR PRESUPUESTO" : "NUEVO PRESUPUESTO"}
            </p>
            <p className="font-barlow font-bold text-[16px] text-text-body">
              {esEdicion ? pre.numero : "Datos del presupuesto"}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto w-7 h-7 rounded-[7px] border border-[#e5e5e5] flex items-center justify-center text-text-muted hover:border-[#ccc] transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Datos cliente */}
          <div>
            <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-text-muted mb-3">Datos del cliente</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: "NOMBRE *",    v: nombre,    set: setNombre,    ph: "Nombre del cliente",          col: 2 },
                { l: "EMAIL",       v: email,     set: setEmail,     ph: "email@ejemplo.com",           col: 1 },
                { l: "TELÉFONO",    v: tel,       set: setTel,       ph: "612 345 678",                 col: 1 },
                { l: "DIRECCIÓN",   v: dir,       set: setDir,       ph: "Calle y número, localidad",   col: 2 },
              ].map((f, i) => (
                <div key={i} style={{ gridColumn: `span ${f.col}` }}>
                  <label className="font-barlow font-bold text-[9px] uppercase tracking-widest text-text-muted block mb-1.5">{f.l}</label>
                  <input value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full border border-[#e5e5e5] rounded-[7px] px-3 py-2 text-[13px] font-barlow text-text-body focus:outline-none focus:border-[#0369a1] bg-fog" />
                </div>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="font-barlow font-bold text-[9px] uppercase tracking-widest text-text-muted block mb-1.5">DESCRIPCIÓN DEL TRABAJO</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Resumen del trabajo a realizar..."
              className="w-full border border-[#e5e5e5] rounded-[7px] px-3 py-2 text-[13px] font-barlow text-text-body focus:outline-none focus:border-[#0369a1] bg-fog resize-none" />
          </div>

          {/* Líneas */}
          <div>
            <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-text-muted mb-3">Líneas del presupuesto *</p>

            {/* Cabecera */}
            <div className="grid gap-2 px-3 py-2 bg-fog rounded-t-[7px] border border-b-0 border-[#e5e5e5]" style={{ gridTemplateColumns: "1fr 110px 32px" }}>
              <span className="font-barlow font-bold text-[9px] uppercase tracking-widest text-text-muted">Descripción</span>
              <span className="font-barlow font-bold text-[9px] uppercase tracking-widest text-text-muted text-right">Importe</span>
              <span/>
            </div>

            {lineas.map((l, i) => (
              <div key={i} className="grid gap-2 px-3 py-2 border border-t-0 border-[#e5e5e5] bg-white" style={{ gridTemplateColumns: "1fr 110px 32px" }}>
                <input value={l.descripcion} onChange={e => updateLinea(i, "descripcion", e.target.value)}
                  placeholder="Concepto..." className="border border-[#e5e5e5] rounded-[6px] px-2 py-1.5 text-[12px] font-barlow focus:outline-none focus:border-[#0369a1]" />
                <div className="flex items-center gap-1">
                  <input value={l.importe === 0 ? "" : l.importe} type="number" min={0} step="0.01"
                    onChange={e => updateLinea(i, "importe", e.target.value)}
                    className="w-full border border-[#e5e5e5] rounded-[6px] px-2 py-1.5 text-[12px] font-barlow text-right focus:outline-none focus:border-[#0369a1]" />
                  <span className="text-[11px] text-text-muted shrink-0">€</span>
                </div>
                <button type="button" onClick={() => removeLinea(i)} disabled={lineas.length === 1}
                  className="w-8 h-8 rounded-[6px] border flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ borderColor: "#c81b3a30", background: "#c81b3a08", color: "#c81b3a" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            ))}

            <button type="button" onClick={addLinea}
              className="w-full py-2 border border-t-0 border-dashed rounded-b-[7px] flex items-center justify-center gap-2 text-[12px] font-barlow font-semibold transition-colors"
              style={{ borderColor: BRAND + "50", background: BRAND + "05", color: BRAND }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Añadir línea
            </button>
          </div>

          {/* IVA + Totales + Validez */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-fog rounded-[10px] p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted flex-1">Base imponible</span>
                <span className="text-[13px] font-bold text-text-body">{fmt(base)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted flex-1">IVA</span>
                <select value={iva} onChange={e => setIva(parseInt(e.target.value))}
                  className="border border-[#e5e5e5] rounded-[6px] px-2 py-1 text-[12px] font-barlow bg-white focus:outline-none mr-1">
                  <option value={0}>0%</option>
                  <option value={10}>10%</option>
                  <option value={21}>21%</option>
                </select>
                <span className="text-[11px] text-text-muted">= {fmt(total - base)}</span>
              </div>
              <div className="border-t border-[#e5e5e5] pt-2 flex items-center gap-2">
                <span className="text-[12px] font-bold text-text-body flex-1">TOTAL</span>
                <span className="font-fraunces text-[18px] font-semibold text-text-body">{fmt(total)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-barlow font-bold text-[9px] uppercase tracking-widest text-text-muted block mb-1.5">VÁLIDO HASTA</label>
                <input type="date" value={valido} onChange={e => setValido(e.target.value)}
                  className="w-full border border-[#e5e5e5] rounded-[7px] px-3 py-2 text-[13px] font-barlow focus:outline-none focus:border-[#0369a1] bg-fog" />
              </div>
              <div className="flex-1">
                <label className="font-barlow font-bold text-[9px] uppercase tracking-widest text-text-muted block mb-1.5">NOTAS PARA EL CLIENTE</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
                  placeholder="Ej: Garantía 6 meses sobre el material..."
                  className="w-full border border-[#e5e5e5] rounded-[7px] px-3 py-2 text-[12px] font-barlow focus:outline-none focus:border-[#0369a1] bg-fog resize-none" />
              </div>
            </div>
          </div>

          {error && <p className="text-[13px] font-barlow text-[#c81b3a]">{error}</p>}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#f0f0f0]">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-[9px] bg-fog border border-[#e5e5e5] font-barlow font-semibold text-[13px] text-text-body hover:border-[#ccc] transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={pending}
            className="px-6 py-2.5 rounded-[9px] text-white font-barlow font-bold text-[13px] flex items-center gap-2 disabled:opacity-60 transition-opacity"
            style={{ background: BRAND }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            {pending ? "Guardando…" : (esEdicion ? "Guardar cambios" : "Crear presupuesto")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de presupuesto ──────────────────────────────────────────────────────

function PresupuestoRow({
  pre,
  esSolicitud,
  onEdit,
  onEnviar,
  onCrearParte,
  onGenerarPDF,
  onVerPdf,
}: {
  pre:          PresupuestoDB;
  esSolicitud:  boolean;
  onEdit:       () => void;
  onEnviar:     () => void;
  onCrearParte: () => void;
  onGenerarPDF: () => void;
  onVerPdf:     (id: string) => Promise<{ ok: boolean; url?: string; error?: string }>;
}) {
  const [copied, setCopied]   = useState(false);
  const [pending, start]      = useTransition();

  return (
    <div className="bg-white border border-[#f0f0f0] rounded-[12px] p-4 flex items-start gap-4 hover:border-[#d0d0d0] transition-colors cursor-pointer"
      onClick={onEdit}>
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: BRAND + "12", color: BRAND }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6"/></svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-barlow font-bold text-[14px] text-text-body">{pre.cliente_nombre}</span>
          <Badge estado={pre.estado} esSolicitud={esSolicitud} />
        </div>
        {pre.numero !== "" && (
          <span className="font-barlow text-[11px] text-text-muted mr-2">{pre.numero}</span>
        )}
        {pre.descripcion && (
          <p className="font-barlow text-[12px] text-text-body truncate">{pre.descripcion}</p>
        )}
        {!pre.descripcion && pre.lineas?.length > 0 && (
          <p className="font-barlow text-[12px] text-text-muted truncate">{pre.lineas[0].descripcion}</p>
        )}
        <div className="flex gap-3 mt-1.5 flex-wrap">
          {pre.cliente_telefono && (
            <span className="font-barlow text-[11px] text-text-muted">{pre.cliente_telefono}</span>
          )}
          <span className="font-barlow text-[11px] text-text-muted">{fmtDate(pre.created_at)}</span>
          {pre.valido_hasta && pre.estado === "enviado" && (
            <span className="font-barlow text-[11px] text-[#d97706]">
              Válido hasta {fmtDate(pre.valido_hasta)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        {pre.importe_total > 0 && (
          <span className="font-fraunces text-[18px] font-semibold text-text-body">{fmt(pre.importe_total)}</span>
        )}
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          {pre.estado === "borrador" && (
            <button onClick={onEnviar} disabled={pending}
              className="px-3 py-1.5 rounded-[7px] text-white text-[11px] font-barlow font-bold flex items-center gap-1.5 disabled:opacity-60 transition-opacity"
              style={{ background: BRAND }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Enviar
            </button>
          )}
          {pre.estado === "aceptado" && (
            <button onClick={onCrearParte}
              className="px-3 py-1.5 rounded-[7px] text-white text-[11px] font-barlow font-bold flex items-center gap-1.5"
              style={{ background: "#1f1f1f" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              Crear parte
            </button>
          )}
          {pre.pdf_url ? (
            <button
              onClick={async () => {
                const r = await onVerPdf(pre.id);
                if (r.ok && r.url) window.open(r.url, "_blank", "noopener");
              }}
              className="w-7 h-7 rounded-[7px] border border-[#e5e5e5] flex items-center justify-center text-text-muted hover:border-[#ccc] transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          ) : (
            <button onClick={onGenerarPDF}
              className="w-7 h-7 rounded-[7px] border border-[#e5e5e5] flex items-center justify-center text-text-muted hover:border-[#ccc] transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          )}
        </div>
        {/* Copiado del link */}
        {copied && <span className="font-barlow text-[10px] text-[#059669]">Link copiado</span>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PresupuestosView({
  solicitudes, borradores, enviados, aceptados, archivados,
  onCrear, onActualizar, onEnviar, onGenerarPDF, onVerPdf, onCrearParte, appUrl,
}: Props) {
  const [tab,     setTab]     = useState<Tab>("solicitudes");
  const [modal,   setModal]   = useState<PresupuestoDB | null | "nuevo">(null);
  const [toast,   setToast]   = useState("");
  const [linkModal, setLinkModal] = useState<{ link: string; numero: string } | null>(null);
  const [pending, start]      = useTransition();

  const tabData: Record<Tab, PresupuestoDB[]> = {
    solicitudes, borradores, enviados, aceptados, archivados,
  };

  const stats = [
    { label: "Solicitudes nuevas",    val: solicitudes.length,  color: "#d53b00" },
    { label: "Enviados pendientes",   val: enviados.length,     color: BRAND      },
    { label: "Aceptados este mes",    val: aceptados.length,    color: "#059669"  },
    {
      label: "Facturado (aceptados)",
      val:   aceptados.reduce((s, p) => s + p.importe_total, 0)
               .toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €",
      color: "#1f1f1f",
    },
  ];

  async function handleGuardar(data: PresupuestoFormData) {
    if (modal === "nuevo") {
      const r = await onCrear(data);
      if (r.ok) { setModal(null); showToast("Presupuesto creado"); }
      else showToast(r.error ?? "Error al crear");
    } else if (modal && typeof modal !== "string") {
      const r = await onActualizar(modal.id, data);
      if (r.ok) { setModal(null); showToast("Presupuesto actualizado"); }
      else showToast(r.error ?? "Error al actualizar");
    }
  }

  async function handleEnviar(pre: PresupuestoDB) {
    start(async () => {
      const r = await onEnviar(pre.id);
      if (r.ok && r.link) {
        setLinkModal({ link: r.link, numero: pre.numero });
      } else {
        showToast(r.error ?? "Error al enviar");
      }
    });
  }

  async function handleGenerarPDF(pre: PresupuestoDB) {
    start(async () => {
      const r = await onGenerarPDF(pre.id);
      if (r.ok) showToast("PDF generado");
      else showToast(r.error ?? "Error al generar PDF");
    });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  const listaActual = tabData[tab];
  const esSolicitudTab = tab === "solicitudes";

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Stats */}
      <div className="bg-white border-b border-[#f0f0f0] px-4 md:px-7 py-4 shrink-0">
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-fog border border-[#f0f0f0] rounded-[10px] px-4 py-3 flex flex-col md:min-w-[160px]">
              <span className="font-fraunces text-[22px] font-semibold leading-none mb-1" style={{ color: s.color }}>
                {typeof s.val === "number" ? s.val : s.val}
              </span>
              <span className="font-barlow text-[11px] text-text-muted">{s.label}</span>
            </div>
          ))}
          <button onClick={() => setModal("nuevo")}
            className="col-span-2 md:col-span-1 md:ml-auto shrink-0 px-4 py-2.5 rounded-[9px] text-white font-barlow font-bold text-[13px] flex items-center justify-center gap-2 md:self-center"
            style={{ background: "#1f1f1f" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo presupuesto
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#f0f0f0] px-4 md:px-7 flex gap-0 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {TABS.map(t => {
          const count = tabData[t.id].length;
          const active = t.id === tab;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-3 font-barlow font-semibold text-[13px] border-b-2 transition-colors whitespace-nowrap"
              style={{
                borderColor:  active ? BRAND : "transparent",
                color:        active ? "#1f1f1f" : "#6b6b6b",
                marginBottom: "-1px",
              }}>
              {t.label}
              {count > 0 && (
                <span style={{
                  background: active ? BRAND : "#cccccc50",
                  color:      active ? "#fff" : "#6b6b6b",
                  fontSize:   10, fontWeight: 700,
                  padding:    "1px 7px", borderRadius: 999,
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-3">
        {esSolicitudTab && listaActual.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] border text-[12px] font-barlow font-medium"
            style={{ background: "#d53b0010", borderColor: "#d53b0030", color: "#d53b00" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {listaActual.length} cliente{listaActual.length > 1 ? "s" : ""} espera{listaActual.length === 1 ? "" : "n"} presupuesto. Responder en &lt;24 h mejora la conversión.
          </div>
        )}

        {listaActual.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: BRAND + "12", color: BRAND }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6"/></svg>
            </div>
            <p className="font-fraunces text-[18px] text-text-body">Sin presupuestos</p>
            <p className="font-barlow text-[13px] text-text-muted">
              {tab === "solicitudes" ? "No hay solicitudes nuevas." : `Nada en la pestaña ${TABS.find(t => t.id === tab)?.label?.toLowerCase()}.`}
            </p>
          </div>
        ) : (
          listaActual.map(pre => (
            <PresupuestoRow
              key={pre.id}
              pre={pre}
              esSolicitud={esSolicitudTab}
              onEdit={() => setModal(pre)}
              onEnviar={() => handleEnviar(pre)}
              onCrearParte={() => onCrearParte(pre.id)}
              onGenerarPDF={() => handleGenerarPDF(pre)}
              onVerPdf={onVerPdf}
            />
          ))
        )}
      </div>

      {/* Modal presupuesto */}
      {modal !== null && (
        <PresupuestoModal
          pre={modal === "nuevo" ? null : modal}
          onClose={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}

      {/* Modal link enviado */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-[18px] p-6 w-full max-w-md flex flex-col gap-4" style={{ boxShadow: "0 24px 60px -12px rgba(0,0,0,0.3)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#05966918", color: "#059669" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <p className="font-barlow font-bold text-[15px] text-text-body">Presupuesto enviado</p>
                <p className="font-barlow text-[12px] text-text-muted">{linkModal.numero}</p>
              </div>
            </div>
            <div>
              <p className="font-barlow text-[12px] text-text-muted mb-2">Link de aceptación para el cliente:</p>
              <div className="flex gap-2">
                <input readOnly value={linkModal.link} className="flex-1 border border-[#e5e5e5] rounded-[7px] px-3 py-2 text-[11px] font-barlow text-text-muted bg-fog" />
                <button onClick={() => { navigator.clipboard.writeText(linkModal.link); }}
                  className="px-3 py-2 rounded-[7px] border border-[#e5e5e5] text-[12px] font-barlow font-semibold text-text-body hover:border-[#ccc] transition-colors">
                  Copiar
                </button>
              </div>
            </div>
            <button onClick={() => setLinkModal(null)}
              className="w-full py-2.5 rounded-[9px] text-white font-barlow font-bold text-[13px]"
              style={{ background: "#1f1f1f" }}>
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1f1f1f] text-white px-4 py-2.5 rounded-[10px] font-barlow text-[13px] font-medium shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
