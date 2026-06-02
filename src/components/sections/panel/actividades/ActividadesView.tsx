"use client";

import { useState, useTransition } from "react";
import type { RecursoActividadDB, TipoRecurso, EstadoRecurso } from "@/types/actividades";
import { TIPO_RECURSO_LABEL, TIPO_RECURSO_EMOJI, TIPOS_RECURSO } from "@/types/actividades";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecursoFormData {
  tipo:            TipoRecurso;
  nombre:          string;
  identificador:   string;
  capacidad:       string;
  precio_hora:     string;
  precio_dia:      string;
  estado:          EstadoRecurso;
  servicio_id:     string;
  caracteristicas: string;
}

interface Servicio {
  id:     string;
  nombre: string;
}

interface Props {
  recursos:  RecursoActividadDB[];
  servicios: Servicio[];
  onCrear:   (fd: RecursoFormData) => Promise<{ ok: boolean; error?: string }>;
  onActualizar: (id: string, fd: RecursoFormData) => Promise<{ ok: boolean; error?: string }>;
  onToggle:  (id: string, activo: boolean) => Promise<{ ok: boolean }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_COLOR: Record<EstadoRecurso, { bg: string; text: string; label: string }> = {
  disponible:    { bg: "#dcfce7", text: "#16a34a", label: "Disponible" },
  mantenimiento: { bg: "#fef9c3", text: "#b45309", label: "Mantenimiento" },
  inactivo:      { bg: "#f3f4f6", text: "#6b7280", label: "Inactivo" },
};

function groupByTipo(recursos: RecursoActividadDB[]) {
  const groups: Record<string, RecursoActividadDB[]> = {};
  for (const r of recursos) {
    if (!groups[r.tipo]) groups[r.tipo] = [];
    groups[r.tipo].push(r);
  }
  return groups;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function RecursoModal({
  recurso,
  servicios,
  onClose,
  onGuardar,
}: {
  recurso:   RecursoActividadDB | null;
  servicios: Servicio[];
  onClose:   () => void;
  onGuardar: (fd: RecursoFormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [saving, startSaving] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<RecursoFormData>({
    tipo:            recurso?.tipo            ?? "moto_agua",
    nombre:          recurso?.nombre          ?? "",
    identificador:   recurso?.identificador   ?? "",
    capacidad:       String(recurso?.capacidad ?? 1),
    precio_hora:     recurso?.precio_hora != null ? String(recurso.precio_hora) : "",
    precio_dia:      recurso?.precio_dia  != null ? String(recurso.precio_dia)  : "",
    estado:          recurso?.estado          ?? "disponible",
    servicio_id:     recurso?.servicio_id     ?? "",
    caracteristicas: recurso?.caracteristicas
      ? JSON.stringify(recurso.caracteristicas, null, 2)
      : "",
  });

  function set(k: keyof RecursoFormData, v: string) {
    setErr(null);
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setErr("El nombre es obligatorio"); return; }
    startSaving(async () => {
      const res = await onGuardar(form);
      if (res.ok) onClose();
      else setErr(res.error ?? "Error al guardar");
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#f0f0f0] flex-none">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-fraunces font-semibold text-[20px] text-[#1f1f1f]">
                {recurso ? "Editar recurso" : "Nuevo recurso"}
              </h2>
              <p className="font-barlow text-[12px] text-[#9b9b9b] mt-0.5">
                Unidad física disponible para alquiler
              </p>
            </div>
            <button
              type="button" onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#f0f0f0] hover:bg-[#f5f5f5] cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 flex flex-col gap-4">

            {/* Tipo + Nombre */}
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">
                <label className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] block mb-1.5">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => set("tipo", e.target.value)}
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] text-[#1f1f1f] outline-none focus:border-[#0070cc] bg-white cursor-pointer"
                >
                  {TIPOS_RECURSO.map(t => (
                    <option key={t} value={t}>{TIPO_RECURSO_EMOJI[t]} {TIPO_RECURSO_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <label className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] block mb-1.5">Nombre *</label>
                <input
                  required
                  value={form.nombre}
                  onChange={e => set("nombre", e.target.value)}
                  placeholder="Yamaha FX HO #1"
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc]"
                />
              </div>
            </div>

            {/* Servicio vinculado */}
            {servicios.length > 0 && (
              <div>
                <label className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] block mb-1.5">Servicio vinculado</label>
                <select
                  value={form.servicio_id}
                  onChange={e => set("servicio_id", e.target.value)}
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] text-[#1f1f1f] outline-none focus:border-[#0070cc] bg-white cursor-pointer"
                >
                  <option value="">Sin vincular (aparece en todos)</option>
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Matrícula + Capacidad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] block mb-1.5">Matrícula <span className="font-normal">(opcional)</span></label>
                <input
                  value={form.identificador}
                  onChange={e => set("identificador", e.target.value)}
                  placeholder="ESP-3456-AC"
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc]"
                />
              </div>
              <div>
                <label className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] block mb-1.5">Plazas</label>
                <input
                  type="number" min="1" max="50"
                  value={form.capacidad}
                  onChange={e => set("capacidad", e.target.value)}
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc]"
                />
              </div>
            </div>

            {/* Precios */}
            <div>
              <label className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] block mb-1.5">Tarifas</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-barlow text-[13px] text-[#9b9b9b]">€</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.precio_hora}
                    onChange={e => set("precio_hora", e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-[#e8e8e8] rounded-xl pl-7 pr-14 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-barlow text-[11px] text-[#9b9b9b]">/ hora</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-barlow text-[13px] text-[#9b9b9b]">€</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.precio_dia}
                    onChange={e => set("precio_dia", e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-[#e8e8e8] rounded-xl pl-7 pr-12 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-barlow text-[11px] text-[#9b9b9b]">/ día</span>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] block mb-2">Estado</label>
              <div className="flex gap-2 flex-wrap">
                {(["disponible", "mantenimiento", "inactivo"] as EstadoRecurso[]).map(st => {
                  const cfg = ESTADO_COLOR[st];
                  const active = form.estado === st;
                  return (
                    <label
                      key={st}
                      style={{
                        background:   active ? cfg.bg    : "transparent",
                        color:        active ? cfg.text  : "#6b6b6b",
                        borderColor:  active ? cfg.text  : "#e8e8e8",
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer font-barlow text-[13px] font-medium"
                    >
                      <input
                        type="radio"
                        name="estado"
                        value={st}
                        checked={active}
                        onChange={() => set("estado", st)}
                        className="sr-only"
                      />
                      {cfg.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Características JSON */}
            <div>
              <label className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] block mb-1.5">
                Características <span className="font-normal">(JSON, opcional)</span>
              </label>
              <textarea
                rows={3}
                value={form.caracteristicas}
                onChange={e => set("caracteristicas", e.target.value)}
                placeholder={'{"cilindrada":"1812cc","potencia":"250hp"}'}
                className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-mono text-[12px] outline-none focus:border-[#0070cc] resize-none"
              />
            </div>

            {err && (
              <p className="font-barlow text-[13px] text-[#c81b3a] bg-[#c81b3a10] px-3 py-2 rounded-lg">{err}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end gap-2 flex-none">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#e8e8e8] font-barlow text-[13px] font-semibold text-[#6b6b6b] cursor-pointer hover:bg-[#f5f5f5]"
            >Cancelar</button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#1f1f1f] border-none font-barlow text-[13px] font-bold text-white cursor-pointer hover:bg-[#333] disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? "Guardando…" : recurso ? "Guardar cambios" : "Añadir recurso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Vista disponibilidad (timeline simplificado) ─────────────────────────────

function DisponibilidadHoy({ recursos }: { recursos: RecursoActividadDB[] }) {
  const HOUR_H = 48;
  const START_H = 8;
  const END_H = 21;
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const totalH = (END_H - START_H) * HOUR_H;

  if (recursos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#9b9b9b] font-barlow text-[14px]">
        No hay recursos registrados
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1 px-6 py-4">
      <p className="font-barlow text-[12px] text-[#9b9b9b] mb-4">
        Vista de disponibilidad de hoy — las reservas aparecen en tiempo real una vez creadas.
      </p>
      <div className="flex gap-0" style={{ minWidth: 600 }}>
        {/* Horas */}
        <div style={{ width: 48, flexShrink: 0 }}>
          <div style={{ height: 40 }} />
          {hours.map(h => (
            <div key={h} style={{ height: HOUR_H, display: "flex", alignItems: "flex-start", paddingTop: 4 }}>
              <span className="font-barlow text-[10px] text-[#9b9b9b] font-semibold">{h}:00</span>
            </div>
          ))}
        </div>

        {/* Columnas por recurso */}
        {recursos.filter(r => r.activo).map(rec => (
          <div key={rec.id} style={{ flex: 1, borderLeft: "1px solid #f3f3f3", minWidth: 80 }}>
            <div
              style={{ height: 40, borderBottom: "1px solid #f3f3f3" }}
              className="flex items-center justify-center px-1"
            >
              <span className="font-barlow text-[10px] font-bold text-[#3a3a3a] text-center truncate">
                {TIPO_RECURSO_EMOJI[rec.tipo]} {rec.nombre}
              </span>
            </div>

            <div style={{ position: "relative", height: totalH }}>
              {/* Línea AHORA */}
              {nowH >= START_H && nowH <= END_H && (
                <div
                  style={{
                    position: "absolute",
                    left: 0, right: 0,
                    top: (nowH - START_H) * HOUR_H,
                    borderTop: "2px dashed #c81b3a",
                    zIndex: 10,
                  }}
                />
              )}
              {/* Fondo horas alternas */}
              {hours.map((h, hi) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    top: hi * HOUR_H, left: 0, right: 0,
                    height: HOUR_H,
                    background: hi % 2 === 0 ? "transparent" : "#fafafa",
                    borderBottom: "1px solid #f3f3f3",
                  }}
                />
              ))}
              {/* Badge estado mantenimiento */}
              {rec.estado === "mantenimiento" && (
                <div
                  style={{ position: "absolute", inset: 0, background: "#fef9c344", zIndex: 5 }}
                  className="flex items-center justify-center"
                >
                  <span className="font-barlow text-[9px] font-bold text-[#b45309] text-center leading-tight px-1">
                    🔧<br />MANT.
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export default function ActividadesView({ recursos, servicios, onCrear, onActualizar, onToggle }: Props) {
  const [tab, setTab] = useState<"recursos" | "disponibilidad">("recursos");
  const [modal, setModal] = useState<null | "nuevo" | RecursoActividadDB>(null);
  const [, startToggle] = useTransition();

  const groups = groupByTipo(recursos);
  const activos   = recursos.filter(r => r.activo && r.estado === "disponible").length;
  const mant      = recursos.filter(r => r.estado === "mantenimiento").length;

  async function handleGuardar(fd: RecursoFormData) {
    if (modal && modal !== "nuevo") {
      return onActualizar((modal as RecursoActividadDB).id, fd);
    }
    return onCrear(fd);
  }

  function handleToggle(recurso: RecursoActividadDB) {
    startToggle(async () => {
      await onToggle(recurso.id, !recurso.activo);
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats */}
      <div className="px-6 py-4 bg-white border-b border-[#f3f3f3] flex gap-3 flex-none flex-wrap">
        {[
          { label: "Recursos totales",  val: recursos.length, color: "#1f1f1f" },
          { label: "Disponibles",        val: activos,          color: "#059669" },
          { label: "En mantenimiento",   val: mant,             color: "#d97706" },
          { label: "Tipos distintos",    val: Object.keys(groups).length, color: "#0891b2" },
        ].map((s, i) => (
          <div key={i} className="bg-[#f8f8f8] border border-[#f0f0f0] rounded-xl px-4 py-3 min-w-[140px]">
            <div className="font-fraunces font-semibold text-[22px] leading-none" style={{ color: s.color }}>{s.val}</div>
            <div className="font-barlow text-[11px] text-[#9b9b9b] mt-1">{s.label}</div>
          </div>
        ))}

        <div className="ml-auto flex items-center">
          <button
            onClick={() => setModal("nuevo")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f1f1f] border-none font-barlow text-[13px] font-bold text-white cursor-pointer hover:bg-[#333]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Añadir recurso
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#f3f3f3] px-6 flex gap-0 flex-none">
        {(["recursos", "disponibilidad"] as const).map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-3 border-none bg-transparent cursor-pointer font-barlow text-[13px] font-semibold"
            style={{
              color:        tab === t ? "#1f1f1f" : "#9b9b9b",
              borderBottom: tab === t ? "2px solid #0891b2" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {i === 0 ? "Todos los recursos" : "Disponibilidad hoy"}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "recursos" ? (
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {recursos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <span className="text-4xl">🚤</span>
              <p className="font-barlow text-[15px] text-[#9b9b9b]">No hay recursos todavía</p>
              <button
                onClick={() => setModal("nuevo")}
                className="px-4 py-2.5 rounded-xl bg-[#1f1f1f] border-none font-barlow text-[13px] font-bold text-white cursor-pointer hover:bg-[#333]"
              >
                + Añadir el primero
              </button>
            </div>
          ) : (
            Object.entries(groups).map(([tipo, items]) => (
              <div key={tipo}>
                {/* Cabecera grupo */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[16px]">{TIPO_RECURSO_EMOJI[tipo as TipoRecurso]}</span>
                  <span className="font-barlow font-bold text-[11px] uppercase tracking-widest text-[#9b9b9b]">
                    {TIPO_RECURSO_LABEL[tipo as TipoRecurso]}
                  </span>
                  <span className="font-barlow text-[11px] text-[#cccccc]">({items.length})</span>
                </div>

                {/* Filas */}
                <div className="flex flex-col gap-2">
                  {items.map(rec => {
                    const estadoCfg = ESTADO_COLOR[rec.estado];
                    return (
                      <div
                        key={rec.id}
                        className="bg-white border border-[#f0f0f0] rounded-xl px-4 py-3 flex items-center gap-4"
                        style={{ opacity: rec.activo ? 1 : 0.55 }}
                      >
                        {/* Icono tipo */}
                        <div
                          className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl shrink-0"
                          style={{ background: "#0891b215" }}
                        >
                          {TIPO_RECURSO_EMOJI[rec.tipo]}
                        </div>

                        {/* Nombre + matrícula */}
                        <div className="flex-1 min-w-0">
                          <p className="font-barlow font-semibold text-[14px] text-[#1f1f1f] truncate">{rec.nombre}</p>
                          {rec.identificador && (
                            <p className="font-barlow text-[11px] text-[#9b9b9b]">Matr. {rec.identificador}</p>
                          )}
                        </div>

                        {/* Estado badge */}
                        <span
                          className="font-barlow font-bold text-[10px] uppercase tracking-wide px-3 py-1 rounded-full shrink-0"
                          style={{ background: estadoCfg.bg, color: estadoCfg.text }}
                        >
                          {estadoCfg.label}
                        </span>

                        {/* Plazas */}
                        <span className="font-barlow text-[12px] text-[#9b9b9b] shrink-0 min-w-[60px] text-center">
                          👥 {rec.capacidad}
                        </span>

                        {/* Precios */}
                        <div className="text-right shrink-0 min-w-[100px]">
                          {rec.precio_hora != null && (
                            <p className="font-barlow font-bold text-[14px] text-[#1f1f1f]">{rec.precio_hora} €/h</p>
                          )}
                          {rec.precio_dia != null && (
                            <p className="font-barlow text-[11px] text-[#9b9b9b]">{rec.precio_dia} €/día</p>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setModal(rec)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f0] bg-[#f8f8f8] cursor-pointer hover:bg-[#eee]"
                            title="Editar"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2" strokeLinecap="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggle(rec)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#f0f0f0] cursor-pointer hover:bg-[#eee]"
                            style={{
                              background: rec.activo ? "#f8f8f8" : "#dcfce7",
                              borderColor: rec.activo ? "#f0f0f0" : "#16a34a40",
                            }}
                            title={rec.activo ? "Desactivar" : "Activar"}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"
                              stroke={rec.activo ? "#9b9b9b" : "#16a34a"}>
                              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <DisponibilidadHoy recursos={recursos} />
      )}

      {/* Modal */}
      {modal && (
        <RecursoModal
          recurso={modal === "nuevo" ? null : modal}
          servicios={servicios}
          onClose={() => setModal(null)}
          onGuardar={handleGuardar}
        />
      )}
    </div>
  );
}
