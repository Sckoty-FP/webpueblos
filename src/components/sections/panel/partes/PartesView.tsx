"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import type { ParteConPresupuesto, MetodoCobro } from "@/types/servicios-pro";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParteFormData {
  presupuesto_id:    string;
  fecha_trabajo:     string;
  duracion_horas:    string;
  trabajo_realizado: string;
  materiales:        string;
  importe_final:     number;
}

interface Props {
  partes:           ParteConPresupuesto[];
  presupuestosOpen: { id: string; numero: string; cliente_nombre: string; importe_total: number }[];
  onCrear:          (data: ParteFormData) => Promise<{ ok: boolean; id?: string; error?: string }>;
  onCerrar:         (id: string, metodo: MetodoCobro) => Promise<{ ok: boolean; error?: string }>;
  onSubirFirma:     (id: string, firmaDataUrl: string) => Promise<{ ok: boolean; url?: string; error?: string }>;
  onGenerarPDF:     (id: string) => Promise<{ ok: boolean; url?: string; error?: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = "#0369a1";
const METODOS: { id: MetodoCobro; label: string }[] = [
  { id: "efectivo",      label: "Efectivo"      },
  { id: "tarjeta",       label: "Tarjeta"        },
  { id: "transferencia", label: "Transferencia"  },
  { id: "bizum",         label: "Bizum"          },
  { id: "otro",          label: "Otro"           },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Canvas Firma ─────────────────────────────────────────────────────────────

function CanvasFirma({
  onFirmar,
  disabled,
}: {
  onFirmar: (dataUrl: string) => void;
  disabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);
  const [hasFirma, setHasFirma] = useState(false);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    if (disabled) return;
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1f1f1f";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    setHasFirma(true);
  }

  function stopDraw() {
    drawing.current = false;
  }

  function limpiar() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasFirma(false);
  }

  function confirmar() {
    if (!hasFirma) return;
    onFirmar(canvasRef.current!.toDataURL("image/png"));
  }

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden border border-[#e5e5e5] bg-white" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={480}
          height={160}
          style={{ width: "100%", height: 160, display: "block", cursor: disabled ? "default" : "crosshair" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasFirma && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="font-barlow text-[13px] text-[#ccc]">Firma aquí</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={limpiar}
          disabled={!hasFirma || disabled}
          className="font-barlow text-[13px] text-[#888] underline underline-offset-2 disabled:opacity-40"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={confirmar}
          disabled={!hasFirma || disabled}
          className="ml-auto font-barlow font-semibold text-[13px] px-4 py-1.5 rounded-lg text-white disabled:opacity-40"
          style={{ background: BRAND }}
        >
          Guardar firma
        </button>
      </div>
    </div>
  );
}

// ─── Modal Crear Parte ────────────────────────────────────────────────────────

function CrearParteModal({
  presupuestosOpen,
  presupuestoPreseleccionado,
  onClose,
  onGuardar,
}: {
  presupuestosOpen:          { id: string; numero: string; cliente_nombre: string; importe_total: number }[];
  presupuestoPreseleccionado?: string;
  onClose:                   () => void;
  onGuardar:                 (data: ParteFormData) => Promise<void>;
}) {
  const [presId,    setPresId]    = useState(presupuestoPreseleccionado ?? "");
  const [fecha,     setFecha]     = useState(new Date().toISOString().slice(0, 10));
  const [horas,     setHoras]     = useState("");
  const [trabajo,   setTrabajo]   = useState("");
  const [mats,      setMats]      = useState("");
  const [importe,   setImporte]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  // Pre-fill importe from presupuesto
  useEffect(() => {
    const pre = presupuestosOpen.find(p => p.id === presId);
    if (pre && !importe) setImporte(pre.importe_total.toFixed(2));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trabajo.trim()) { setError("El trabajo realizado es obligatorio."); return; }
    const imp = parseFloat(importe);
    if (isNaN(imp) || imp <= 0) { setError("El importe debe ser un número positivo."); return; }
    setSaving(true);
    setError("");
    await onGuardar({
      presupuesto_id:    presId,
      fecha_trabajo:     fecha,
      duracion_horas:    horas,
      trabajo_realizado: trabajo.trim(),
      materiales:        mats.trim(),
      importe_final:     imp,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl overflow-hidden" style={{ maxHeight: "92dvh", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
          <h2 className="font-fraunces font-semibold text-[18px] text-[#1f1f1f]">Nuevo parte</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center text-[#888]">✕</button>
        </div>

        <form id="crear-parte-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Presupuesto origen */}
          <div>
            <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">
              Presupuesto de origen
            </label>
            <select
              value={presId}
              onChange={e => setPresId(e.target.value)}
              className="w-full font-barlow text-[14px] px-3 py-2.5 rounded-xl border border-[#e5e5e5] bg-white text-[#1f1f1f] focus:outline-none"
            >
              <option value="">Sin presupuesto (parte libre)</option>
              {presupuestosOpen.map(p => (
                <option key={p.id} value={p.id}>{p.numero} — {p.cliente_nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha + duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">Fecha del trabajo</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                required
                className="w-full font-barlow text-[14px] px-3 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none"
              />
            </div>
            <div>
              <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">Horas</label>
              <input
                type="number"
                value={horas}
                onChange={e => setHoras(e.target.value)}
                min="0"
                step="0.5"
                placeholder="Ej: 3.5"
                className="w-full font-barlow text-[14px] px-3 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none"
              />
            </div>
          </div>

          {/* Trabajo realizado */}
          <div>
            <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">
              Trabajo realizado <span className="text-red-500">*</span>
            </label>
            <textarea
              value={trabajo}
              onChange={e => setTrabajo(e.target.value)}
              rows={4}
              required
              placeholder="Describe el trabajo ejecutado..."
              className="w-full font-barlow text-[14px] px-3 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none resize-none"
            />
          </div>

          {/* Materiales */}
          <div>
            <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">
              Materiales utilizados
            </label>
            <textarea
              value={mats}
              onChange={e => setMats(e.target.value)}
              rows={2}
              placeholder="Lista de materiales usados..."
              className="w-full font-barlow text-[14px] px-3 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none resize-none"
            />
          </div>

          {/* Importe */}
          <div>
            <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">
              Importe final (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={importe}
              onChange={e => setImporte(e.target.value)}
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full font-barlow font-semibold text-[18px] px-3 py-2.5 rounded-xl border border-[#e5e5e5] focus:outline-none"
            />
          </div>

          {error && <p className="font-barlow text-[13px] text-red-500">{error}</p>}
        </form>

        <div className="px-5 py-4 border-t border-[#f0f0f0] flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 font-barlow font-semibold text-[14px] px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-[#888]">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={e => { e.preventDefault(); document.querySelector<HTMLFormElement>("#crear-parte-form")?.requestSubmit(); }}
            className="flex-1 font-barlow font-semibold text-[14px] px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {saving ? "Guardando…" : "Crear parte"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Drawer Parte Detail ──────────────────────────────────────────────────────

function ParteDrawer({
  parte,
  onClose,
  onCerrar,
  onSubirFirma,
  onGenerarPDF,
}: {
  parte:        ParteConPresupuesto;
  onClose:      () => void;
  onCerrar:     (metodo: MetodoCobro) => Promise<void>;
  onSubirFirma: (dataUrl: string) => Promise<void>;
  onGenerarPDF: () => Promise<{ url?: string }>;
}) {
  const [metodo,        setMetodo]        = useState<MetodoCobro>("efectivo");
  const [cerrando,      setCerrando]      = useState(false);
  const [firmando,      setFirmando]      = useState(false);
  const [firmaDone,     setFirmaDone]     = useState(!!parte.cliente_firma_url);
  const [generandoPDF,  setGenerandoPDF]  = useState(false);
  const [pdfUrl,        setPdfUrl]        = useState<string | null>(null);
  const [toast,         setToast]         = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function handleCerrar() {
    setCerrando(true);
    await onCerrar(metodo);
    setCerrando(false);
    showToast("Parte cerrado y registrado en caja");
    onClose();
  }

  async function handleFirma(dataUrl: string) {
    setFirmando(true);
    await onSubirFirma(dataUrl);
    setFirmaDone(true);
    setFirmando(false);
    showToast("Firma guardada");
  }

  async function handlePDF() {
    setGenerandoPDF(true);
    const res = await onGenerarPDF();
    if (res.url) setPdfUrl(res.url);
    setGenerandoPDF(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl overflow-hidden" style={{ maxHeight: "92dvh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
          <div>
            <p className="font-barlow font-bold text-[11px] uppercase tracking-widest text-[#888]">Parte de trabajo</p>
            <h2 className="font-fraunces font-semibold text-[20px] text-[#1f1f1f]">{parte.numero}</h2>
          </div>
          <div className="flex items-center gap-2">
            {parte.cobrado ? (
              <span className="font-barlow font-bold text-[11px] px-3 py-1 rounded-full" style={{ background: "#d1fae5", color: "#059669" }}>COBRADO</span>
            ) : (
              <span className="font-barlow font-bold text-[11px] px-3 py-1 rounded-full" style={{ background: "#fef3c7", color: "#d97706" }}>PENDIENTE</span>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center text-[#888]">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Info básica */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-[#f5f7fa]">
              <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-[#888] mb-1">Fecha</p>
              <p className="font-barlow font-semibold text-[14px] text-[#1f1f1f]">{fmtDate(parte.fecha_trabajo)}</p>
            </div>
            {parte.duracion_horas && (
              <div className="rounded-xl p-3 bg-[#f5f7fa]">
                <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-[#888] mb-1">Duración</p>
                <p className="font-barlow font-semibold text-[14px] text-[#1f1f1f]">{parte.duracion_horas}h</p>
              </div>
            )}
          </div>

          {/* Cliente */}
          {parte.presupuesto && (
            <div className="rounded-xl p-3 bg-[#f5f7fa]">
              <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-[#888] mb-2">Cliente</p>
              <p className="font-barlow font-semibold text-[14px] text-[#1f1f1f]">{parte.presupuesto.cliente_nombre}</p>
              {parte.presupuesto.cliente_telefono && (
                <p className="font-barlow text-[13px] text-[#666]">{parte.presupuesto.cliente_telefono}</p>
              )}
            </div>
          )}

          {/* Trabajo */}
          <div>
            <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-[#888] mb-2">Trabajo realizado</p>
            <p className="font-barlow text-[14px] text-[#3a3a3a] leading-relaxed bg-[#f5f7fa] rounded-xl p-3">{parte.trabajo_realizado}</p>
          </div>

          {/* Materiales */}
          {parte.materiales && (
            <div>
              <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-[#888] mb-2">Materiales</p>
              <p className="font-barlow text-[14px] text-[#3a3a3a] leading-relaxed bg-[#f5f7fa] rounded-xl p-3">{parte.materiales}</p>
            </div>
          )}

          {/* Importe */}
          <div className="rounded-xl p-4 text-white flex items-center justify-between" style={{ background: "#1f1f1f" }}>
            <div>
              <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-white/60">Importe final</p>
              {parte.cobrado && parte.metodo_cobro && (
                <p className="font-barlow text-[11px] text-white/50 mt-0.5">Cobrado en {parte.metodo_cobro}</p>
              )}
            </div>
            <p className="font-fraunces font-semibold text-[26px]">{fmt(parte.importe_final)}</p>
          </div>

          {/* Firma */}
          {!parte.cobrado && (
            <div>
              <p className="font-barlow font-bold text-[10px] uppercase tracking-widest text-[#888] mb-2">Firma del cliente</p>
              {parte.cliente_firma_url || firmaDone ? (
                <div className="rounded-xl overflow-hidden border border-[#e5e5e5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={parte.cliente_firma_url ?? ""}
                    alt="Firma"
                    className="w-full"
                    style={{ maxHeight: 120, objectFit: "contain" }}
                  />
                </div>
              ) : (
                <CanvasFirma onFirmar={handleFirma} disabled={firmando} />
              )}
            </div>
          )}

          {/* Cerrar parte */}
          {!parte.cobrado && (
            <div className="rounded-xl border border-[#e5e5e5] p-4 space-y-3">
              <p className="font-barlow font-semibold text-[13px] text-[#1f1f1f]">Cerrar parte como cobrado</p>
              <div className="flex gap-2 flex-wrap">
                {METODOS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetodo(m.id)}
                    className="font-barlow font-semibold text-[12px] px-3 py-1.5 rounded-lg border transition-all"
                    style={{
                      background: metodo === m.id ? BRAND : "transparent",
                      color:      metodo === m.id ? "#fff" : "#555",
                      borderColor: metodo === m.id ? BRAND : "#e5e5e5",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCerrar}
                disabled={cerrando}
                className="w-full font-barlow font-semibold text-[14px] py-3 rounded-xl text-white disabled:opacity-60"
                style={{ background: "#059669" }}
              >
                {cerrando ? "Registrando…" : "Marcar como cobrado"}
              </button>
            </div>
          )}

          {/* PDF */}
          <div className="flex gap-2">
            {(pdfUrl || parte.cobrado) && (
              <a
                href={pdfUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 font-barlow font-semibold text-[13px] px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-[#555] text-center no-underline hover:bg-[#f5f7fa] transition-colors"
              >
                Abrir PDF
              </a>
            )}
            <button
              type="button"
              onClick={handlePDF}
              disabled={generandoPDF}
              className="flex-1 font-barlow font-semibold text-[13px] px-4 py-2.5 rounded-xl text-white disabled:opacity-60"
              style={{ background: BRAND }}
            >
              {generandoPDF ? "Generando…" : "Generar PDF"}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] font-barlow text-[13px] text-white px-4 py-2.5 rounded-xl shadow-lg" style={{ background: "#1f1f1f" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Parte Row ────────────────────────────────────────────────────────────────

function ParteRow({
  parte,
  onClick,
}: {
  parte:   ParteConPresupuesto;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white border border-[#f0f0f0] hover:border-[#e0e0e0] hover:shadow-sm transition-all"
    >
      {/* Status dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: parte.cobrado ? "#059669" : "#d97706" }}
      />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-barlow font-semibold text-[14px] text-[#1f1f1f]">{parte.numero}</span>
          {parte.presupuesto && (
            <span className="font-barlow text-[12px] text-[#888]">← Pres. {parte.presupuesto.numero}</span>
          )}
        </div>
        <p className="font-barlow text-[13px] text-[#888] truncate mt-0.5">
          {parte.presupuesto?.cliente_nombre ?? "Sin cliente"} · {fmtDate(parte.fecha_trabajo)}
        </p>
      </div>

      {/* Importe */}
      <div className="text-right shrink-0">
        <p className="font-barlow font-semibold text-[15px] text-[#1f1f1f]">{fmt(parte.importe_final)}</p>
        {parte.cobrado && parte.metodo_cobro && (
          <p className="font-barlow text-[11px] text-[#059669] capitalize">{parte.metodo_cobro}</p>
        )}
      </div>
    </button>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function PartesView({
  partes,
  presupuestosOpen,
  onCrear,
  onCerrar,
  onSubirFirma,
  onGenerarPDF,
}: Props) {
  const [tab,             setTab]             = useState<"pendientes" | "cobrados">("pendientes");
  const [showCrear,       setShowCrear]       = useState(false);
  const [parteActivo,     setParteActivo]     = useState<ParteConPresupuesto | null>(null);
  const [toast,           setToast]           = useState("");
  const [, startTransition] = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  const pendientes = partes.filter(p => !p.cobrado);
  const cobrados   = partes.filter(p => p.cobrado);
  const lista      = tab === "pendientes" ? pendientes : cobrados;

  // Stats
  const totalCobrado     = cobrados.reduce((s, p) => s + p.importe_final, 0);
  const totalPendiente   = pendientes.reduce((s, p) => s + p.importe_final, 0);

  const handleCrear = useCallback(async (data: ParteFormData) => {
    const res = await onCrear(data);
    if (res.ok) {
      setShowCrear(false);
      showToast("Parte creado");
    } else {
      showToast(res.error ?? "Error al crear el parte");
    }
  }, [onCrear]);

  const handleCerrar = useCallback(async (id: string, metodo: MetodoCobro) => {
    const res = await onCerrar(id, metodo);
    if (!res.ok) showToast(res.error ?? "Error al cerrar el parte");
  }, [onCerrar]);

  const handleSubirFirma = useCallback(async (id: string, dataUrl: string) => {
    await onSubirFirma(id, dataUrl);
  }, [onSubirFirma]);

  const handleGenerarPDF = useCallback(async (id: string) => {
    return await onGenerarPDF(id);
  }, [onGenerarPDF]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total partes",   value: partes.length.toString(),    sub: "registrados" },
          { label: "Pendientes",     value: pendientes.length.toString(), sub: "sin cobrar"  },
          { label: "Cobrado",        value: fmt(totalCobrado),            sub: "acumulado"   },
          { label: "Por cobrar",     value: fmt(totalPendiente),          sub: "pendiente"   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#f0f0f0] px-4 py-3" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#888] mb-1">{s.label}</p>
            <p className="font-fraunces font-semibold text-[22px] text-[#1f1f1f] leading-tight">{s.value}</p>
            <p className="font-barlow text-[11px] text-[#aaa]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 bg-[#f5f7fa] rounded-xl p-1">
          {(["pendientes", "cobrados"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="font-barlow font-semibold text-[13px] px-4 py-1.5 rounded-lg transition-all capitalize"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color:      tab === t ? "#1f1f1f" : "#888",
                boxShadow:  tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t} {t === "pendientes" ? `(${pendientes.length})` : `(${cobrados.length})`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCrear(true)}
          className="font-barlow font-semibold text-[13px] px-4 py-2 rounded-xl text-white flex items-center gap-1.5"
          style={{ background: BRAND }}
        >
          <span className="text-[16px] leading-none">+</span> Nuevo parte
        </button>
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#f0f7ff] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <p className="font-fraunces font-semibold text-[18px] text-[#1f1f1f] mb-1">Sin partes {tab === "pendientes" ? "pendientes" : "cobrados"}</p>
          <p className="font-barlow text-[14px] text-[#888]">
            {tab === "pendientes" ? "Creá un parte nuevo cuando completes un trabajo." : "Los partes cobrados aparecerán aquí."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map(p => (
            <ParteRow key={p.id} parte={p} onClick={() => setParteActivo(p)} />
          ))}
        </div>
      )}

      {/* Modal crear */}
      {showCrear && (
        <CrearParteModal
          presupuestosOpen={presupuestosOpen}
          onClose={() => setShowCrear(false)}
          onGuardar={handleCrear}
        />
      )}

      {/* Drawer detalle */}
      {parteActivo && (
        <ParteDrawer
          parte={parteActivo}
          onClose={() => setParteActivo(null)}
          onCerrar={metodo => handleCerrar(parteActivo.id, metodo)}
          onSubirFirma={dataUrl => handleSubirFirma(parteActivo.id, dataUrl)}
          onGenerarPDF={() => handleGenerarPDF(parteActivo.id)}
        />
      )}

      {/* Toast global */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] font-barlow text-[13px] text-white px-4 py-2.5 rounded-xl shadow-lg" style={{ background: "#1f1f1f" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
