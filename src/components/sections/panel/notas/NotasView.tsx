"use client";

import { useState, useTransition } from "react";
import type { NotaNegocioDB } from "@/types/notas";
import { fromNow, formatAbsolute } from "@/lib/format/relative-date";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isRecordatorioHoy(nota: NotaNegocioDB): boolean {
  if (!nota.recordatorio_fecha || nota.recordatorio_completado) return false;
  const diff = new Date(nota.recordatorio_fecha).getTime() - Date.now();
  return diff <= 24 * 60 * 60 * 1000 && diff > -24 * 60 * 60 * 1000;
}

function isRecordatorioVencido(nota: NotaNegocioDB): boolean {
  if (!nota.recordatorio_fecha || nota.recordatorio_completado) return false;
  return new Date(nota.recordatorio_fecha).getTime() < Date.now();
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────

function PulseDot({ color = "#c81b3a" }: { color?: string }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{
        backgroundColor: color,
        animation: "pulse-dot 1.5s ease-in-out infinite",
      }}
    />
  );
}

// ─── Nota card ────────────────────────────────────────────────────────────────

interface NotaCardProps {
  nota: NotaNegocioDB;
  isSelected: boolean;
  onClick: () => void;
}

function NotaCard({ nota, isSelected, onClick }: NotaCardProps) {
  const vencida  = isRecordatorioVencido(nota);
  const hoy      = isRecordatorioHoy(nota);

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
        isSelected
          ? "border-[#0070cc] border-2 bg-[rgba(0,112,204,0.06)]"
          : vencida
          ? "border-[rgba(217,119,6,0.4)] bg-[rgba(217,119,6,0.08)]"
          : "border-[#e5e5e5] bg-white hover:border-[#ccc]"
      }`}
    >
      <div className="flex items-start gap-2">
        {nota.importante && <span className="text-[14px] mt-0.5 flex-shrink-0">⭐</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {(vencida || hoy) && <PulseDot color={vencida ? "#d97706" : "#c81b3a"} />}
            <h3 className="text-[14px] font-barlow font-600 text-[#1f1f1f] truncate">{nota.titulo}</h3>
          </div>
          {nota.recordatorio_fecha && !nota.recordatorio_completado && (
            <p className={`text-[11px] font-mono mt-0.5 ${vencida ? "text-[#d97706] font-700" : "text-[#888]"}`}>
              🔔 {formatAbsolute(nota.recordatorio_fecha)}
            </p>
          )}
          {nota.contenido && (
            <p className="text-[12px] font-barlow text-[#888] mt-1 line-clamp-2">{nota.contenido}</p>
          )}
          <p className="text-[10px] font-mono text-[#aaa] mt-1.5">{fromNow(nota.created_at)} · {nota.autor?.nombre ?? "Tú"}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Composer / Detalle ───────────────────────────────────────────────────────

interface ComposerProps {
  nota: NotaNegocioDB | null;
  userId: string;
  isPropietario: boolean;
  onActualizar: (id: string, data: Partial<NotaNegocioDB>) => Promise<void>;
  onCompletar: (id: string) => Promise<void>;
  onPosponer: (id: string) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

function Composer({ nota, userId, isPropietario, onActualizar, onCompletar, onPosponer, onEliminar }: ComposerProps) {
  const [pending, startTransition] = useTransition();

  if (!nota) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-[#f7f7f5]">
        <div className="w-14 h-14 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <p className="text-[15px] font-barlow text-[#888]">Seleccioná una nota para verla</p>
      </div>
    );
  }

  const puedeEliminar = nota.autor_id === userId || isPropietario;
  const vencida = isRecordatorioVencido(nota);

  return (
    <div className="flex flex-col h-full bg-[#f7f7f5]">
      {/* Pills + acciones */}
      <div className="flex items-center gap-2 px-6 py-4 bg-[#f7f7f5] border-b border-[#e5e5e5]">
        {nota.importante && (
          <span className="text-[10px] font-barlow font-700 tracking-[0.06em] px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#d97706] border border-[#f0a800]/30">
            ⭐ IMPORTANTE
          </span>
        )}
        {nota.recordatorio_fecha && !nota.recordatorio_completado && (
          <span className={`text-[10px] font-barlow font-700 tracking-[0.06em] px-2.5 py-1 rounded-full border ${
            vencida ? "bg-[rgba(217,119,6,0.1)] text-[#d97706] border-[rgba(217,119,6,0.3)]"
                    : "bg-[rgba(5,150,105,0.1)] text-[#059669] border-[rgba(5,150,105,0.3)]"
          }`}>
            🔔 {vencida ? "VENCIDO" : "RECORDATORIO"}
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => startTransition(() => onActualizar(nota.id, { importante: !nota.importante }))}
          disabled={pending}
          className="w-8 h-8 rounded-lg border border-[#e5e5e5] flex items-center justify-center text-[14px] hover:border-[#999] transition-colors bg-white"
          title={nota.importante ? "Quitar importancia" : "Marcar importante"}
        >
          {nota.importante ? "⭐" : "☆"}
        </button>
        {puedeEliminar && (
          <button
            onClick={() => { if (confirm("¿Eliminar esta nota?")) startTransition(() => onEliminar(nota.id)); }}
            disabled={pending}
            className="w-8 h-8 rounded-lg border border-[#e5e5e5] flex items-center justify-center hover:border-[#c81b3a] hover:text-[#c81b3a] transition-colors bg-white"
            title="Eliminar nota"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        )}
      </div>

      {/* Título inline */}
      <div className="px-6 pt-6 pb-2">
        <input
          key={nota.id}
          defaultValue={nota.titulo}
          onBlur={e => {
            const nuevoTitulo = e.target.value.trim();
            if (nuevoTitulo && nuevoTitulo !== nota.titulo) {
              startTransition(() => onActualizar(nota.id, { titulo: nuevoTitulo }));
            }
          }}
          className="w-full font-fraunces font-semibold text-[28px] text-[#1f1f1f] leading-tight bg-transparent border-none outline-none resize-none"
          placeholder="Sin título"
        />
      </div>

      {/* Meta row */}
      <div className="px-6 pb-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] font-barlow font-600 text-[#aaa] uppercase tracking-[0.06em] mb-1">Recordatorio</p>
          <input
            key={nota.id + "-rec"}
            type="datetime-local"
            defaultValue={nota.recordatorio_fecha ? nota.recordatorio_fecha.slice(0,16) : ""}
            onBlur={e => {
              const val = e.target.value ? new Date(e.target.value).toISOString() : null;
              startTransition(() => onActualizar(nota.id, { recordatorio_fecha: val ?? undefined }));
            }}
            className="text-[12px] font-mono text-[#444] bg-transparent border-none outline-none w-full"
          />
        </div>
        <div>
          <p className="text-[10px] font-barlow font-600 text-[#aaa] uppercase tracking-[0.06em] mb-1">Creada por</p>
          <p className="text-[12px] font-barlow text-[#444]">{nota.autor?.nombre ?? "Tú"}</p>
        </div>
        <div>
          <p className="text-[10px] font-barlow font-600 text-[#aaa] uppercase tracking-[0.06em] mb-1">Creada</p>
          <p className="text-[12px] font-mono text-[#888]">{fromNow(nota.created_at)}</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-6 pb-4">
        <textarea
          key={nota.id + "-contenido"}
          defaultValue={nota.contenido}
          onBlur={e => {
            const val = e.target.value;
            if (val !== nota.contenido) {
              startTransition(() => onActualizar(nota.id, { contenido: val }));
            }
          }}
          className="w-full h-full bg-white border border-[#e5e5e5] rounded-xl p-4 text-[14px] font-barlow text-[#333] leading-relaxed resize-none focus:outline-none focus:border-[#0070cc]"
          placeholder="Escribe aquí el contenido de la nota…"
          style={{ textWrap: "pretty" } as React.CSSProperties}
        />
      </div>

      {/* Sticky bottom actions */}
      {nota.recordatorio_fecha && !nota.recordatorio_completado && (
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => startTransition(() => onCompletar(nota.id))}
            disabled={pending}
            className="flex-1 py-3 rounded-xl bg-[#1f1f1f] text-white text-[13px] font-barlow font-600 disabled:opacity-50 hover:bg-[#333] transition-colors"
          >
            ✓ Marcar como completada
          </button>
          <button
            onClick={() => startTransition(() => onPosponer(nota.id))}
            disabled={pending}
            className="py-3 px-5 rounded-xl border border-[#e5e5e5] text-[13px] font-barlow font-600 text-[#444] hover:border-[#999] transition-colors"
          >
            Posponer 1 día
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Nueva nota modal ─────────────────────────────────────────────────────────

interface NuevaNotaModalProps {
  onClose: () => void;
  onCreate: (data: FormData) => Promise<void>;
}

function NuevaNotaModal({ onClose, onCreate }: NuevaNotaModalProps) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await onCreate(fd);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-[18px] w-full max-w-md p-8" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.16)" }}>
        <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase mb-1">NUEVA NOTA</p>
        <h2 className="font-fraunces font-semibold text-[20px] text-[#1f1f1f] mb-6">Crear nota</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Título *</label>
            <input name="titulo" required className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" />
          </div>
          <div>
            <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Contenido</label>
            <textarea name="contenido" rows={4} className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc] resize-none" />
          </div>
          <div>
            <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Recordatorio (opcional)</label>
            <input name="recordatorio_fecha" type="datetime-local" className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="importante" type="checkbox" value="1" className="w-4 h-4 rounded accent-[#d97706]" />
            <span className="text-[13px] font-barlow text-[#444]">Marcar como importante</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#e5e5e5] text-[14px] font-barlow font-600 text-[#444] hover:border-[#999] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex-1 py-3 rounded-xl bg-[#1f1f1f] text-white text-[14px] font-barlow font-600 disabled:opacity-50 hover:bg-[#333] transition-colors">
              {pending ? "Creando…" : "Crear nota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface Props {
  notas: NotaNegocioDB[];
  userId: string;
  isPropietario: boolean;
  onCrear: (data: FormData) => Promise<void>;
  onActualizar: (id: string, data: Partial<NotaNegocioDB>) => Promise<void>;
  onCompletar: (id: string) => Promise<void>;
  onPosponer: (id: string) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export default function NotasView({ notas, userId, isPropietario, onCrear, onActualizar, onCompletar, onPosponer, onEliminar }: Props) {
  const [filtro, setFiltro] = useState<"todas" | "importantes" | "recordatorio" | "mias">("todas");
  const [selected, setSelected] = useState<NotaNegocioDB | null>(null);
  const [showNueva, setShowNueva] = useState(false);
  const [localNotas, setLocalNotas] = useState(notas);

  const hoy = localNotas.filter(n => isRecordatorioHoy(n));
  const proximas = localNotas.filter(n => n.recordatorio_fecha && !n.recordatorio_completado && !isRecordatorioHoy(n) && new Date(n.recordatorio_fecha).getTime() > Date.now());
  const sinRecordatorio = localNotas.filter(n => !n.recordatorio_fecha || n.recordatorio_completado);
  const importantes = localNotas.filter(n => n.importante);

  const filtered = localNotas.filter(n => {
    if (filtro === "importantes")  return n.importante;
    if (filtro === "recordatorio") return n.recordatorio_fecha && !n.recordatorio_completado;
    if (filtro === "mias")         return n.autor_id === userId;
    return true;
  });

  async function handleActualizar(id: string, data: Partial<NotaNegocioDB>) {
    await onActualizar(id, data);
    setLocalNotas(prev => prev.map(n => n.id === id ? { ...n, ...data } : n));
    setSelected(prev => prev?.id === id ? { ...prev, ...data } : prev);
  }

  async function handleCompletar(id: string) {
    await onCompletar(id);
    setLocalNotas(prev => prev.map(n => n.id === id ? { ...n, recordatorio_completado: true } : n));
    setSelected(prev => prev?.id === id ? { ...prev, recordatorio_completado: true } : prev);
  }

  async function handlePosponer(id: string) {
    await onPosponer(id);
    const nota = localNotas.find(n => n.id === id);
    if (nota?.recordatorio_fecha) {
      const nueva = new Date(nota.recordatorio_fecha);
      nueva.setDate(nueva.getDate() + 1);
      const nuevaFecha = nueva.toISOString();
      setLocalNotas(prev => prev.map(n => n.id === id ? { ...n, recordatorio_fecha: nuevaFecha } : n));
      setSelected(prev => prev?.id === id ? { ...prev, recordatorio_fecha: nuevaFecha } : prev);
    }
  }

  async function handleEliminar(id: string) {
    await onEliminar(id);
    setLocalNotas(prev => prev.filter(n => n.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function renderSection(titulo: string, items: NotaNegocioDB[], accent?: string) {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          {accent === "error" && <PulseDot color="#c81b3a" />}
          {accent === "warning" && <PulseDot color="#d97706" />}
          <h3 className="text-[11px] font-barlow font-700 tracking-[0.06em] text-[#888] uppercase">{titulo}</h3>
        </div>
        <div className="space-y-2">
          {items.map(n => (
            <NotaCard
              key={n.id}
              nota={n}
              isSelected={selected?.id === n.id}
              onClick={() => setSelected(selected?.id === n.id ? null : n)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#f7f7f5]">
      {showNueva && (
        <NuevaNotaModal
          onClose={() => setShowNueva(false)}
          onCreate={async (fd) => {
            await onCrear(fd);
            setShowNueva(false);
          }}
        />
      )}

      {/* Lista */}
      <div className="w-[560px] flex-shrink-0 flex flex-col h-full border-r border-[#e5e5e5] bg-white">
        {/* Header */}
        <div className="px-5 py-5 border-b border-[#e5e5e5]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-fraunces font-semibold text-[26px] text-[#1f1f1f]">Notas</h1>
            <button
              onClick={() => setShowNueva(true)}
              className="flex items-center gap-2 bg-[#1f1f1f] text-white text-[13px] font-barlow font-600 px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors"
            >
              <span className="text-[16px] leading-none">+</span>
              Nueva nota
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Total", value: localNotas.length, color: "#1f1f1f" },
              { label: "Importantes", value: importantes.length, color: "#d97706", highlight: importantes.length > 0 },
              { label: "Hoy", value: hoy.length, color: "#c81b3a", highlight: hoy.length > 0 },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-xl p-3 border text-center ${s.highlight ? "border-current" : "border-[#e5e5e5]"}`} style={{ color: s.highlight ? s.color : undefined }}>
                <p className="text-[10px] font-barlow text-[#888] uppercase tracking-[0.06em] mb-1">{s.label}</p>
                <p className="font-fraunces font-semibold text-[18px]" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex gap-1.5 flex-wrap">
            {(["todas","importantes","recordatorio","mias"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`text-[12px] font-barlow font-600 px-3 py-1.5 rounded-full border transition-colors capitalize ${
                  filtro === f ? "bg-[#1f1f1f] text-white border-[#1f1f1f]" : "border-[#e5e5e5] text-[#444] hover:border-[#999]"
                }`}
              >
                {f === "todas" ? "Todas" : f === "importantes" ? "⭐ Importantes" : f === "recordatorio" ? "Con recordatorio" : "Mías"}
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {filtro === "todas" ? (
            <>
              {renderSection("Recordatorio · hoy", hoy, "error")}
              {renderSection("Próximos recordatorios", proximas, "warning")}
              {renderSection("Sin recordatorio", sinRecordatorio)}
            </>
          ) : (
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <p className="text-[14px] font-barlow text-[#888] text-center py-10">Sin notas en esta categoría</p>
              ) : (
                filtered.map(n => (
                  <NotaCard key={n.id} nota={n} isSelected={selected?.id === n.id} onClick={() => setSelected(selected?.id === n.id ? null : n)} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="flex-1">
        <Composer
          nota={selected}
          userId={userId}
          isPropietario={isPropietario}
          onActualizar={handleActualizar}
          onCompletar={handleCompletar}
          onPosponer={handlePosponer}
          onEliminar={handleEliminar}
        />
      </div>
    </div>
  );
}
