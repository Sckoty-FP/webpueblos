"use client";

import { useState, useTransition } from "react";
import type { ProfesionalConServiciosDB } from "@/types/profesionales";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Servicio {
  id:                string;
  nombre:            string;
  duracion_minutos:  number | null;
  precio_desde:      number | null;
  activo:            boolean;
}

interface Props {
  profesionales: ProfesionalConServiciosDB[];
  servicios:     Servicio[];
  onCrear:       (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  onActualizar:  (id: string, fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  onToggle:      (id: string, activo: boolean) => Promise<{ ok: boolean }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORES = [
  "#9333ea", "#7c3aed", "#6d28d9", "#a855f7",
  "#0070cc", "#059669", "#d97706", "#c81b3a",
];

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Avatar({
  nombre,
  color,
  size,
  fotoUrl,
}: {
  nombre: string;
  color:  string;
  size:   number;
  fotoUrl?: string | null;
}) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size,
        background: color + "22",
        border: `2px solid ${color}44`,
        color,
        fontSize: Math.round(size * 0.38),
      }}
      className="rounded-full flex items-center justify-center font-bold shrink-0"
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Modal crear/editar ───────────────────────────────────────────────────────

function ProfesionalModal({
  profesional,
  servicios,
  onClose,
  onGuardar,
}: {
  profesional: ProfesionalConServiciosDB | null;
  servicios:   Servicio[];
  onClose:     () => void;
  onGuardar:   (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const esEdicion = profesional !== null;

  const serviciosAsignados = new Set(
    (profesional?.servicio_profesionales ?? []).map(
      (sp) => sp.servicios?.id,
    ).filter(Boolean),
  );

  const [color, setColor]           = useState(profesional?.color ?? "#9333ea");
  const [selectedSvcs, setSelectedSvcs] = useState<Set<string>>(serviciosAsignados as Set<string>);
  const [error, setError]           = useState<string | null>(null);
  const [pending, startTransition]  = useTransition();

  function toggleServicio(id: string) {
    setSelectedSvcs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", color);
    // inyectar servicios seleccionados
    fd.delete("servicio_ids[]");
    for (const id of selectedSvcs) fd.append("servicio_ids[]", id);

    startTransition(async () => {
      const result = await onGuardar(fd);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error ?? "Error al guardar");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[540px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#f3f3f3]">
          <div
            style={{ background: color + "18", color }}
            className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/>
              <line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
          </div>
          <div>
            <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#6b6b6b]">
              {esEdicion ? "EDITAR PROFESIONAL" : "NUEVO PROFESIONAL"}
            </p>
            <p className="font-barlow font-bold text-[16px] text-[#1f1f1f]">
              {esEdicion ? `${profesional.nombre} ${profesional.apellidos}` : "Datos del profesional"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-7 h-7 rounded-[7px] border border-[#f3f3f3] flex items-center justify-center text-[#6b6b6b] hover:bg-[#f5f7fa] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 flex flex-col gap-5 max-h-[66vh] overflow-y-auto">
            {/* Nombre + Apellidos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-barlow font-semibold text-[10px] uppercase tracking-[1px] text-[#6b6b6b] block mb-1.5">
                  Nombre
                </label>
                <input
                  name="nombre"
                  required
                  defaultValue={profesional?.nombre ?? ""}
                  className="w-full border border-[#cccccc] rounded-[6px] px-3 py-2.5 text-[14px] font-barlow text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#9333ea]/30 focus:border-[#9333ea]"
                />
              </div>
              <div>
                <label className="font-barlow font-semibold text-[10px] uppercase tracking-[1px] text-[#6b6b6b] block mb-1.5">
                  Apellidos
                </label>
                <input
                  name="apellidos"
                  defaultValue={profesional?.apellidos ?? ""}
                  className="w-full border border-[#cccccc] rounded-[6px] px-3 py-2.5 text-[14px] font-barlow text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#9333ea]/30 focus:border-[#9333ea]"
                />
              </div>
            </div>

            {/* Especialidad */}
            <div>
              <label className="font-barlow font-semibold text-[10px] uppercase tracking-[1px] text-[#6b6b6b] block mb-1.5">
                Especialidad
              </label>
              <input
                name="especialidad"
                defaultValue={profesional?.especialidad ?? ""}
                placeholder="Ej: Colorista experta, Estilista junior…"
                className="w-full border border-[#cccccc] rounded-[6px] px-3 py-2.5 text-[14px] font-barlow text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#9333ea]/30 focus:border-[#9333ea]"
              />
            </div>

            {/* Color en agenda */}
            <div>
              <label className="font-barlow font-semibold text-[10px] uppercase tracking-[1px] text-[#6b6b6b] block mb-2">
                Color en agenda
              </label>
              <div className="flex gap-2">
                {COLORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                      border: "3px solid transparent",
                      outline: c === color ? `3px solid ${c}` : "none",
                      outlineOffset: 2,
                      transition: "outline .12s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Servicios que realiza */}
            {servicios.length > 0 && (
              <div>
                <label className="font-barlow font-semibold text-[10px] uppercase tracking-[1px] text-[#6b6b6b] block mb-2">
                  Servicios que realiza
                </label>
                <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
                  {servicios.map((s) => {
                    const sel = selectedSvcs.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleServicio(s.id)}
                        style={{
                          border: sel ? `1px solid ${color}50` : "1px solid #f3f3f3",
                          background: sel ? color + "0a" : "#f5f7fa",
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-left transition-all"
                      >
                        <div
                          style={{
                            width: 16, height: 16,
                            border: sel ? `2px solid ${color}` : "2px solid #cccccc",
                            background: sel ? color : "transparent",
                            color: "#fff",
                          }}
                          className="rounded-[4px] flex items-center justify-center shrink-0 transition-all"
                        >
                          {sel && (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <span className="font-barlow text-[13px] font-medium text-[#1f1f1f] flex-1">{s.nombre}</span>
                        {s.duracion_minutos && (
                          <span className="font-barlow text-[11px] text-[#6b6b6b]">{s.duracion_minutos} min</span>
                        )}
                        {s.precio_desde && (
                          <span className="font-barlow text-[12px] font-semibold text-[#1f1f1f]">
                            {s.precio_desde} €
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bio opcional */}
            <div>
              <label className="font-barlow font-semibold text-[10px] uppercase tracking-[1px] text-[#6b6b6b] block mb-1.5">
                Bio <span className="normal-case font-normal">(visible para clientes, opcional)</span>
              </label>
              <textarea
                name="bio"
                defaultValue={profesional?.bio ?? ""}
                rows={3}
                placeholder="Cuéntanos algo sobre este profesional…"
                className="w-full border border-[#cccccc] rounded-[6px] px-3 py-2.5 text-[14px] font-barlow text-[#1f1f1f] resize-none focus:outline-none focus:ring-2 focus:ring-[#9333ea]/30 focus:border-[#9333ea]"
              />
            </div>

            {error && (
              <p className="font-barlow text-[13px] text-[#c81b3a] bg-[#c81b3a]/8 rounded-[8px] px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 justify-end px-6 py-4 border-t border-[#f3f3f3]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-[9px] bg-[#f5f7fa] border border-[#f3f3f3] font-barlow font-semibold text-[13px] text-[#3a3a3a] hover:bg-[#eef0f4] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2.5 rounded-[9px] bg-black border-none font-barlow font-bold text-[13px] text-white flex items-center gap-2 disabled:opacity-50 transition-opacity"
            >
              {pending ? "Guardando…" : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {esEdicion ? "Guardar cambios" : "Crear profesional"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card profesional ─────────────────────────────────────────────────────────

function ProfesionalCard({
  profesional,
  onEditar,
  onToggle,
}: {
  profesional: ProfesionalConServiciosDB;
  onEditar:    () => void;
  onToggle:    () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { nombre, apellidos, especialidad, color, activo, foto_url } = profesional;
  const nombreCompleto = [nombre, apellidos].filter(Boolean).join(" ");

  const tags = (profesional.servicio_profesionales ?? [])
    .map((sp) => sp.servicios?.nombre)
    .filter(Boolean)
    .slice(0, 3) as string[];

  return (
    <div
      style={{ opacity: activo ? 1 : 0.6 }}
      className="bg-white rounded-2xl border border-[#f3f3f3] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
    >
      {/* Barra de color en top */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${color}, ${color}80)` }} />

      <div className="p-4">
        {/* Avatar + badge activo */}
        <div className="flex items-start justify-between mb-3">
          <Avatar nombre={nombre} color={color} size={48} fotoUrl={foto_url} />
          <span
            style={{
              background: activo ? "#05966915" : "#cccccc30",
              color:      activo ? "#059669"   : "#6b6b6b",
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-barlow font-bold text-[10px]"
          >
            <span
              style={{ background: "currentColor" }}
              className="w-1.5 h-1.5 rounded-full"
            />
            {activo ? "ACTIVA" : "INACTIVA"}
          </span>
        </div>

        {/* Nombre + especialidad */}
        <p className="font-barlow font-bold text-[15px] text-[#1f1f1f] leading-tight">
          {nombreCompleto}
        </p>
        {especialidad && (
          <p className="font-barlow text-[12px] text-[#6b6b6b] mt-0.5 mb-3">{especialidad}</p>
        )}

        {/* Tags servicios */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((t) => (
              <span
                key={t}
                style={{ background: color + "12", color }}
                className="font-barlow font-semibold text-[10px] px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
            {(profesional.servicio_profesionales?.length ?? 0) > 3 && (
              <span className="font-barlow text-[10px] text-[#6b6b6b] px-2 py-0.5">
                +{(profesional.servicio_profesionales?.length ?? 0) - 3} más
              </span>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-3 border-t border-[#f3f3f3]">
          <button
            onClick={onEditar}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-[#f5f7fa] border border-[#f3f3f3] font-barlow font-semibold text-[11px] text-[#3a3a3a] hover:bg-[#eef0f4] transition-colors cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Editar
          </button>
          <button
            onClick={() => { startTransition(() => { onToggle(); }); }}
            disabled={pending}
            style={{
              background: activo ? "#c81b3a12" : "#05966912",
              border:     activo ? "1px solid #c81b3a30" : "1px solid #05966930",
              color:      activo ? "#c81b3a"   : "#059669",
            }}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center disabled:opacity-50 cursor-pointer transition-colors"
            title={activo ? "Desactivar" : "Activar"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export default function ProfesionalesView({ profesionales, servicios, onCrear, onActualizar, onToggle }: Props) {
  const [modal, setModal]     = useState<"crear" | ProfesionalConServiciosDB | null>(null);
  const [optimistic, setOptimistic] = useState(profesionales);

  const activos   = optimistic.filter((p) => p.activo).length;
  const inactivos = optimistic.filter((p) => !p.activo).length;

  async function handleGuardar(fd: FormData) {
    if (modal === "crear") {
      const result = await onCrear(fd);
      if (result.ok) window.location.reload();
      return result;
    } else if (modal && typeof modal === 'object') {
      const result = await onActualizar(modal.id, fd);
      if (result.ok) window.location.reload();
      return result;
    }
    return { ok: false };
  }

  function handleToggle(pro: ProfesionalConServiciosDB) {
    // Optimistic update
    setOptimistic((prev) =>
      prev.map((p) => p.id === pro.id ? { ...p, activo: !p.activo } : p),
    );
    onToggle(pro.id, !pro.activo).then((r) => {
      if (!r.ok) {
        // revert
        setOptimistic((prev) =>
          prev.map((p) => p.id === pro.id ? { ...p, activo: pro.activo } : p),
        );
      }
    });
  }

  return (
    <>
      {/* Stats */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { label: "Profesionales activos",  val: activos,                  color: "#059669" },
          { label: "Inactivos",              val: inactivos,                color: "#6b6b6b" },
          { label: "Servicios configurados", val: servicios.length,         color: "#0070cc" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#f3f3f3] rounded-xl px-4 py-3 flex items-center gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <span style={{ color: s.color }} className="font-barlow font-bold text-[22px] leading-none">{s.val}</span>
            <span className="font-barlow text-[12px] text-[#6b6b6b]">{s.label}</span>
          </div>
        ))}
        <button
          onClick={() => setModal("crear")}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-[9px] font-barlow font-bold text-[13px] hover:bg-[#1f1f1f] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Añadir profesional
        </button>
      </div>

      {/* Grid */}
      {optimistic.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div style={{ background: "#9333ea12", color: "#9333ea" }} className="w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/>
              <line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
          </div>
          <p className="font-barlow font-bold text-[16px] text-[#1f1f1f] mb-2">Sin profesionales aún</p>
          <p className="font-barlow text-[13px] text-[#6b6b6b] mb-5 max-w-xs">
            Añadí los profesionales de tu equipo para que los clientes puedan elegirlos al reservar.
          </p>
          <button
            onClick={() => setModal("crear")}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-[9px] font-barlow font-bold text-[13px] hover:bg-[#1f1f1f] transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Añadir el primero
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {optimistic.map((pro) => (
            <ProfesionalCard
              key={pro.id}
              profesional={pro}
              onEditar={() => setModal(pro)}
              onToggle={() => handleToggle(pro)}
            />
          ))}
          {/* Card "Añadir" */}
          <button
            onClick={() => setModal("crear")}
            className="bg-white rounded-2xl border-2 border-dashed border-[#9333ea]/30 flex flex-col items-center justify-center gap-3 p-8 cursor-pointer hover:border-[#9333ea]/60 transition-colors min-h-[220px]"
          >
            <div style={{ background: "#9333ea12", color: "#9333ea" }} className="w-12 h-12 rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <span style={{ color: "#9333ea" }} className="font-barlow font-semibold text-[13px]">Añadir profesional</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <ProfesionalModal
          profesional={modal === "crear" ? null : modal}
          servicios={servicios}
          onClose={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </>
  );
}
