"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type EstadoReserva = "pendiente" | "confirmada" | "rechazada" | "cancelada" | "completada" | "no_show";
type MainView = "lista" | "dia" | "semana" | "mes" | "profesional";
type TabLista = "pendientes" | "hoy" | "proximas" | "historico";

interface Reserva {
  id: string;
  numero_reserva: string;
  fecha: string;
  hora: string;
  duracion_minutos: number;
  num_personas: number;
  estado: EstadoReserva;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string;
  notas_cliente: string | null;
  precio_final: number;
  created_at: string;
  profesional_id: string | null;
  recurso_id: string | null;
  servicios: { id: string; nombre: string; categoria: string } | null;
}

interface RecursoActividad {
  id:        string;
  nombre:    string;
  tipo:      string;
  estado:    string;
  capacidad: number;
  precio_hora: number | null;
  precio_dia:  number | null;
}

interface Profesional {
  id:        string;
  nombre:    string;
  apellidos: string;
  color:     string;
  foto_url:  string | null;
}

interface Mesa {
  id: string;
  numero: number;
  nombre: string | null;
  capacidad: number;
  zona: string;
  activa: boolean;
}

interface Servicio {
  id: string;
  nombre: string;
  categoria: string;
  duracion_minutos?: number;
}

interface Props {
  reservas:       Reserva[];
  prestadorId:    string;
  puebloId:       string;
  mesas:          Mesa[];
  servicios:      Servicio[];
  profesionales?: Profesional[];
  recursos?:      RecursoActividad[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADO_COLOR: Record<EstadoReserva, string> = {
  pendiente:  "#d97706",
  confirmada: "#059669",
  rechazada:  "#c81b3a",
  cancelada:  "#6b6b6b",
  completada: "#0070cc",
  no_show:    "#c81b3a",
};

const ESTADO_LABEL: Record<EstadoReserva, string> = {
  pendiente:  "PENDIENTE",
  confirmada: "CONFIRMADA",
  rechazada:  "RECHAZADA",
  cancelada:  "CANCELADA",
  completada: "COMPLETADA",
  no_show:    "NO SE PRESENTÓ",
};

const CAT_COLOR: Record<string, string> = {
  restaurante:   "#d53b00",
  peluqueria:    "#9333ea",
  actividad:     "#0891b2",
  servicios_pro: "#0070cc",
};

const HOURS = Array.from({ length: 15 }, (_, i) => i + 9);
const HOUR_H = 64;
const START_HOUR = 9;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date) { return d.toISOString().slice(0, 10); }

function getMondayOfWeek(offset = 0) {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatRango(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const s = start.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  const e = end.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  return `${s} — ${e}`;
}

function formatDiaSemana(d: Date) {
  return d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase().slice(0, 3);
}

function formatHora(hora: string) { return hora.slice(0, 5); }

function tiempoDesde(created_at: string) {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000);
  if (diff < 60) return `hace ${diff} min`;
  if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
  return `hace ${Math.floor(diff / 1440)}d`;
}

function getServicioPeriodo(hora: string): "comida" | "cena" | "otro" {
  const h = parseInt(hora.split(":")[0]);
  if (h >= 12 && h < 17) return "comida";
  if (h >= 19) return "cena";
  return "otro";
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function PillEstado({ estado, small }: { estado: EstadoReserva; small?: boolean }) {
  const color = ESTADO_COLOR[estado];
  return (
    <span
      className="font-barlow font-semibold rounded-pill whitespace-nowrap"
      style={{
        fontSize: small ? "10px" : "11px",
        padding: small ? "2px 8px" : "3px 10px",
        background: `${color}18`,
        color,
        letterSpacing: "0.3px",
      }}
    >
      {ESTADO_LABEL[estado]}
    </span>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div
      className="flex-1 bg-white rounded-card border px-4 py-3"
      style={{
        borderColor: accent ? `${accent}30` : "#f0f0f0",
        boxShadow: accent ? `0 0 0 1px ${accent}18` : "none",
      }}
    >
      <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest mb-1" style={{ color: accent ?? "#9b9b9b" }}>
        {label}
      </p>
      <p className="font-fraunces font-semibold text-[28px] leading-none text-[#1f1f1f]">{value}</p>
    </div>
  );
}

// ─── Mobile card (N5) ─────────────────────────────────────────────────────────

function MobileReservaCard({
  r,
  onAceptar,
  onRechazar,
  onClick,
  updating,
}: {
  r: Reserva;
  onAceptar: () => void;
  onRechazar: () => void;
  onClick: () => void;
  updating: boolean;
}) {
  const isPendiente = r.estado === "pendiente";
  return (
    <div
      className="bg-white rounded-card border mx-4 overflow-hidden"
      style={{
        borderColor: isPendiente ? `${ESTADO_COLOR.pendiente}40` : "#f0f0f0",
        boxShadow: isPendiente ? `0 2px 8px ${ESTADO_COLOR.pendiente}14` : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <button type="button" onClick={onClick} className="w-full text-left p-4 border-none bg-transparent cursor-pointer">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-barlow text-[11px] text-[#9b9b9b]">
            {r.numero_reserva} · {tiempoDesde(r.created_at)}
          </span>
          <PillEstado estado={r.estado} small />
        </div>
        {/* Name */}
        <p className="font-barlow font-bold text-[17px] text-[#1f1f1f] mb-2">{r.nombre_cliente}</p>
        {/* Meta */}
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-1.5 text-[#6b6b6b]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span className="font-barlow text-[13px]">
              {new Date(r.fecha + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · {formatHora(r.hora)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#6b6b6b]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span className="font-barlow text-[13px]">{r.num_personas} personas{r.servicios ? ` · ${r.servicios.nombre}` : ""}</span>
          </div>
        </div>
      </button>

      {/* Action buttons — N5 pattern */}
      {isPendiente && (
        <div className="flex gap-2 px-4 pb-4" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={onAceptar}
            disabled={updating}
            className="flex-1 flex items-center justify-center gap-2 font-barlow font-bold text-[14px] text-white bg-[#1f1f1f] rounded-xl py-3 border-none cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity"
            style={{ minHeight: 48 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Aceptar
          </button>
          <button
            type="button"
            onClick={onRechazar}
            disabled={updating}
            className="w-12 flex items-center justify-center border border-[#e5e5e5] rounded-xl bg-white cursor-pointer hover:bg-[#f8f8f8] disabled:opacity-50 transition-colors"
            style={{ minHeight: 48 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <a
            href={`tel:${r.telefono_cliente}`}
            className="w-12 flex items-center justify-center border border-[#e5e5e5] rounded-xl bg-white no-underline hover:bg-[#f8f8f8] transition-colors"
            style={{ minHeight: 48 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.32h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
          </a>
        </div>
      )}
      {r.estado === "confirmada" && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onAceptar}
            className="w-full font-barlow font-bold text-[14px] text-white bg-[#059669] rounded-xl py-3 border-none cursor-pointer hover:opacity-85 transition-opacity"
            style={{ minHeight: 48 }}
          >
            Marcar completada
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Mobile detail overlay (N6) ───────────────────────────────────────────────

function MobileDetail({
  r,
  mesas,
  onCambiarEstado,
  updating,
  onBack,
}: {
  r: Reserva;
  mesas: Mesa[];
  onCambiarEstado: (e: EstadoReserva) => void;
  updating: boolean;
  onBack: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-[#f5f7fa] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#f0f0f0] px-4 pt-4 pb-3 flex-none">
        <div className="flex items-center gap-3 mb-2">
          <button type="button" onClick={onBack} className="w-8 h-8 flex items-center justify-center border-none bg-transparent cursor-pointer text-[#1f1f1f]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-barlow text-[11px] text-[#9b9b9b]">{r.numero_reserva}</p>
            <p className="font-barlow font-bold text-[15px] text-[#1f1f1f] truncate">{r.nombre_cliente} · {r.num_personas} pers.</p>
          </div>
          <PillEstado estado={r.estado} small />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cliente card */}
        <div className="bg-white mx-4 mt-4 rounded-card border border-[#f0f0f0] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1f1f1f] flex items-center justify-center flex-none">
            <span className="font-fraunces font-semibold text-[16px] text-white">
              {r.nombre_cliente.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-barlow font-bold text-[15px] text-[#1f1f1f]">{r.nombre_cliente}</p>
            <p className="font-barlow text-[13px] text-[#6b6b6b]">{r.telefono_cliente} · <span className="text-[#059669] font-semibold">Cliente nuevo</span></p>
          </div>
          <a
            href={`tel:${r.telefono_cliente}`}
            className="w-10 h-10 bg-[#1f1f1f] rounded-full flex items-center justify-center no-underline flex-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.32h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
          </a>
        </div>

        {/* Detalle */}
        <div className="mx-4 mt-3">
          <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] mb-2">Detalle</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Fecha", value: new Date(r.fecha + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) },
              { label: "Hora", value: formatHora(r.hora) },
              { label: "Personas", value: `${r.num_personas} pers.` },
              { label: "Servicio", value: r.servicios?.nombre ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-[#f0f0f0] p-3">
                <p className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] mb-0.5">{label}</p>
                <p className="font-barlow font-semibold text-[14px] text-[#1f1f1f]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mesa picker (N6) — grid 5 cols */}
        {mesas.length > 0 && (
          <div className="mx-4 mt-3">
            <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] mb-2">Asignar mesa</p>
            <div className="bg-white rounded-card border border-[#f0f0f0] p-3">
              <div className="grid grid-cols-5 gap-2">
                {mesas.filter(m => m.activa).slice(0, 10).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className="aspect-square flex flex-col items-center justify-center rounded-xl border border-[#e8e8e8] bg-white cursor-pointer hover:border-[#0070cc] hover:bg-[#0070cc08] transition-colors"
                  >
                    <span className="font-fraunces font-semibold text-[13px] text-[#1f1f1f]">M{m.numero}</span>
                    <span className="font-barlow text-[9px] text-[#9b9b9b]">{m.capacidad}p</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Nota cliente (N6) — amber */}
        {r.notas_cliente && (
          <div className="mx-4 mt-3 mb-6">
            <div className="rounded-card border border-[#fcd34d40] p-4" style={{ background: "#fffbeb" }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <p className="font-barlow font-bold text-[11px] uppercase tracking-wider text-[#92400e]">Cliente</p>
              </div>
              <p className="font-barlow text-[14px] text-[#78350f]">"{r.notas_cliente}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom (N6) */}
      <div className="bg-white border-t border-[#f0f0f0] px-4 py-4 flex-none" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        {r.estado === "pendiente" && (
          <>
            <button
              type="button"
              onClick={() => onCambiarEstado("confirmada")}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 font-barlow font-bold text-[15px] text-white bg-[#1f1f1f] rounded-xl py-3.5 border-none cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity mb-3"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Aceptar reserva
            </button>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => onCambiarEstado("rechazada")}
                disabled={updating}
                className="flex-1 font-barlow font-bold text-[13px] text-[#c81b3a] border border-[#c81b3a40] rounded-xl py-2.5 bg-transparent cursor-pointer hover:bg-[#c81b3a06] disabled:opacity-50"
              >
                Rechazar
              </button>
              <a href={`mailto:${r.email_cliente}`} className="w-11 flex items-center justify-center border border-[#e5e5e5] rounded-xl no-underline hover:bg-[#f8f8f8]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </a>
              <button type="button" className="w-11 flex items-center justify-center border border-[#e5e5e5] rounded-xl cursor-pointer hover:bg-[#f8f8f8] bg-white">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
            </div>
          </>
        )}
        {r.estado === "confirmada" && (
          <button
            type="button"
            onClick={() => onCambiarEstado("completada")}
            disabled={updating}
            className="w-full font-barlow font-bold text-[15px] text-white bg-[#059669] rounded-xl py-3.5 border-none cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity"
          >
            Marcar completada
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Desktop/tablet card ───────────────────────────────────────────────────────

function ReservaCard({
  r, selected, onClick, onAceptar, onRechazar, updating,
}: {
  r: Reserva; selected: boolean; onClick: () => void;
  onAceptar: () => void; onRechazar: () => void; updating: boolean;
}) {
  const catColor = r.servicios ? (CAT_COLOR[r.servicios.categoria] ?? "#0070cc") : "#6b6b6b";
  const d = new Date(r.fecha + "T00:00:00");
  const isPendiente = r.estado === "pendiente";
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-card border transition-all duration-150 p-4 flex gap-3 items-start cursor-pointer"
      style={{
        borderColor: selected ? "#0070cc" : isPendiente ? `${ESTADO_COLOR.pendiente}50` : "#f0f0f0",
        boxShadow: selected ? "0 0 0 2px #0070cc30" : isPendiente ? `0 2px 8px ${ESTADO_COLOR.pendiente}18` : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex-none flex flex-col items-center justify-center rounded-xl w-[52px] h-[52px]" style={{ background: `${catColor}12` }}>
        <span className="font-fraunces font-semibold text-[19px] leading-none" style={{ color: catColor }}>{d.getDate().toString().padStart(2,"0")}</span>
        <span className="font-barlow font-semibold text-[9px] uppercase tracking-wider mt-0.5" style={{ color: catColor }}>
          {d.toLocaleDateString("es-ES", { month: "short" }).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-barlow font-bold text-[14px] text-[#1f1f1f] truncate">{r.nombre_cliente}</span>
          <PillEstado estado={r.estado} small />
        </div>
        <p className="font-barlow text-[12px] text-[#6b6b6b]">
          {d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase().slice(0,3)} · {formatHora(r.hora)} · {r.num_personas} pers.
        </p>
        {r.servicios && <p className="font-barlow text-[12px] text-[#9b9b9b] truncate">{r.servicios.nombre}</p>}
        {r.notas_cliente && <p className="font-barlow text-[11px] italic text-[#9b9b9b] mt-1 truncate">"{r.notas_cliente}"</p>}
        {isPendiente && (
          <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={onAceptar} disabled={updating}
              className="font-barlow font-bold text-[12px] text-white bg-[#1f1f1f] rounded-pill px-3 py-1.5 border-none cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity">
              Aceptar
            </button>
            <button type="button" onClick={onRechazar} disabled={updating}
              className="font-barlow font-bold text-[12px] text-[#c81b3a] bg-transparent border border-[#c81b3a40] rounded-pill px-3 py-1.5 cursor-pointer hover:bg-[#c81b3a06] disabled:opacity-50">
              Rechazar
            </button>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Detail pane (desktop) ────────────────────────────────────────────────────

function DetailPane({ r, mesas, onCambiarEstado, updating, onClose }: {
  r: Reserva; mesas: Mesa[]; onCambiarEstado: (e: EstadoReserva) => void; updating: boolean; onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white rounded-card border border-[#f0f0f0] overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
      <div className="px-5 pt-5 pb-4 border-b border-[#f5f5f5]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="font-barlow font-semibold text-[10px] text-[#9b9b9b] tracking-widest">{r.numero_reserva}</span>
            <h2 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f] leading-tight">{r.nombre_cliente}</h2>
          </div>
          <div className="flex items-center gap-2">
            <PillEstado estado={r.estado} />
            <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#f0f0f0] bg-[#f8f8f8] cursor-pointer hover:bg-[#f0f0f0]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`tel:${r.telefono_cliente}`} className="font-barlow text-[13px] text-[#0070cc] no-underline flex items-center gap-1 hover:underline">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.32h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
            {r.telefono_cliente}
          </a>
          <a href={`mailto:${r.email_cliente}`} className="font-barlow text-[13px] text-[#0070cc] no-underline flex items-center gap-1 hover:underline">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            {r.email_cliente}
          </a>
        </div>
      </div>
      <div className="px-5 py-4 border-b border-[#f5f5f5] grid grid-cols-2 gap-2">
        {[
          { label: "Fecha", value: new Date(r.fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) },
          { label: "Hora", value: formatHora(r.hora) },
          { label: "Personas", value: `${r.num_personas} persona${r.num_personas !== 1 ? "s" : ""}` },
          { label: "Servicio", value: r.servicios?.nombre ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#f8f8f8] rounded-xl p-3">
            <p className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] mb-1">{label}</p>
            <p className="font-barlow font-semibold text-[13px] text-[#1f1f1f] capitalize">{value}</p>
          </div>
        ))}
      </div>
      {mesas.length > 0 && (
        <div className="px-5 py-4 border-b border-[#f5f5f5]">
          <p className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] mb-3">Asignar mesa</p>
          <div className="grid grid-cols-5 gap-1.5">
            {mesas.filter(m => m.activa).slice(0, 10).map(m => (
              <button key={m.id} type="button" className="aspect-square flex flex-col items-center justify-center rounded-xl border border-[#e8e8e8] bg-white cursor-pointer hover:border-[#0070cc] hover:bg-[#0070cc08] transition-colors">
                <span className="font-fraunces font-semibold text-[13px] text-[#1f1f1f]">M{m.numero}</span>
                <span className="font-barlow text-[9px] text-[#9b9b9b]">{m.capacidad}p</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {r.notas_cliente && (
        <div className="px-5 py-4 border-b border-[#f5f5f5]">
          <div className="rounded-xl border border-[#fcd34d40] p-3" style={{ background: "#fffbeb" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <p className="font-barlow font-bold text-[10px] uppercase tracking-wider text-[#92400e]">Nota del cliente</p>
            </div>
            <p className="font-barlow text-[13px] text-[#78350f] italic">"{r.notas_cliente}"</p>
          </div>
        </div>
      )}
      <div className="px-5 py-4 flex-1 overflow-y-auto">
        <p className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] mb-3">Historial</p>
        <TimelineReserva r={r} />
      </div>
      <div className="px-5 py-4 border-t border-[#f5f5f5] flex gap-2">
        <a href={`tel:${r.telefono_cliente}`} className="flex items-center gap-1.5 font-barlow font-medium text-[13px] text-[#1f1f1f] border border-[#e5e5e5] rounded-xl px-3 py-2 no-underline hover:bg-[#f8f8f8] transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.32h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
          Llamar
        </a>
        {r.estado === "pendiente" && (<>
          <button type="button" onClick={() => onCambiarEstado("rechazada")} disabled={updating}
            className="font-barlow font-bold text-[13px] text-[#c81b3a] border border-[#c81b3a40] rounded-xl px-4 py-2 bg-transparent cursor-pointer hover:bg-[#c81b3a06] disabled:opacity-50">
            Rechazar
          </button>
          <button type="button" onClick={() => onCambiarEstado("confirmada")} disabled={updating}
            className="flex-1 font-barlow font-bold text-[13px] text-white bg-[#1f1f1f] rounded-xl px-4 py-2 border-none cursor-pointer hover:opacity-85 disabled:opacity-50">
            Aceptar reserva
          </button>
        </>)}
        {r.estado === "confirmada" && (
          <button type="button" onClick={() => onCambiarEstado("completada")} disabled={updating}
            className="flex-1 font-barlow font-bold text-[13px] text-white bg-[#059669] rounded-xl px-4 py-2 border-none cursor-pointer hover:opacity-85 disabled:opacity-50">
            Marcar completada
          </button>
        )}
      </div>
    </div>
  );
}

function TimelineReserva({ r }: { r: Reserva }) {
  const steps = [
    { label: "Solicitud recibida", date: r.created_at, done: true },
    { label: "Esperando confirmación", done: r.estado !== "pendiente" },
    { label: "Confirmación enviada", done: ["confirmada","completada"].includes(r.estado) },
    { label: "Recordatorio 24h", done: r.estado === "completada" },
    { label: "Reserva realizada", done: r.estado === "completada" },
  ];
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-none mt-0.5"
              style={{ background: step.done ? "#059669" : "#f0f0f0", border: step.done ? "none" : "2px dashed #d0d0d0" }}>
              {step.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            {i < steps.length - 1 && (
              <div className="my-1" style={{ width: 1, minHeight: 16, background: step.done ? "#059669" : "#e8e8e8", borderLeft: step.done ? "none" : "1px dashed #d0d0d0" }} />
            )}
          </div>
          <div className="pb-3">
            <p className="font-barlow font-medium text-[12px]" style={{ color: step.done ? "#1f1f1f" : "#9b9b9b" }}>{step.label}</p>
            {"date" in step && step.date && (
              <p className="font-barlow text-[11px] text-[#9b9b9b]">
                {new Date(step.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tablet día view (N4) ─────────────────────────────────────────────────────

function TabletDiaView({
  reservas, todayStr, onAceptar, onRechazar, updating, onOpenNueva,
}: {
  reservas: Reserva[]; todayStr: string; onAceptar: (id: string) => void;
  onRechazar: (id: string) => void; updating: string | null; onOpenNueva: () => void;
}) {
  const hoyReservas = reservas.filter(r => r.fecha === todayStr);
  const pendientes = hoyReservas.filter(r => r.estado === "pendiente");
  const todas = hoyReservas.sort((a, b) => a.hora.localeCompare(b.hora));
  const comida = todas.filter(r => getServicioPeriodo(r.hora) === "comida");
  const cena = todas.filter(r => getServicioPeriodo(r.hora) === "cena");
  const confirmadas = hoyReservas.filter(r => r.estado === "confirmada").length;
  const personas = hoyReservas.filter(r => ["confirmada","completada"].includes(r.estado)).reduce((s, r) => s + r.num_personas, 0);

  const today = new Date(todayStr + "T00:00:00");
  const diaLabel = today.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="flex gap-0 h-full min-h-[600px]">
      {/* Sidebar pendientes */}
      <div className="w-[260px] flex-none border-r border-[#f0f0f0] bg-white flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-[#f0f0f0]">
          {pendientes.length > 0
            ? <p className="font-barlow font-bold text-[12px] uppercase tracking-wider" style={{ color: ESTADO_COLOR.pendiente }}>● {pendientes.length} PENDIENTES</p>
            : <p className="font-barlow font-semibold text-[12px] uppercase tracking-wider text-[#9b9b9b]">Sin pendientes</p>
          }
        </div>
        <div className="flex-1 overflow-y-auto">
          {pendientes.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="font-barlow text-[13px] text-[#9b9b9b]">No hay reservas pendientes hoy</p>
            </div>
          ) : pendientes.map(r => (
            <div key={r.id} className="px-3 py-3 border-b border-[#f5f5f5]"
              style={{ background: `${ESTADO_COLOR.pendiente}06` }}>
              <div className="border rounded-xl border-[#d97706] bg-white p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-barlow font-bold text-[14px] text-[#1f1f1f]">{r.nombre_cliente.split(" ")[0]}</span>
                  <span className="font-fraunces font-semibold text-[14px]" style={{ color: ESTADO_COLOR.pendiente }}>{formatHora(r.hora)}</span>
                </div>
                <p className="font-barlow text-[12px] text-[#6b6b6b] mb-2">{r.num_personas}p · {tiempoDesde(r.created_at)}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onAceptar(r.id)} disabled={updating === r.id}
                    className="flex-1 flex items-center justify-center gap-1 font-barlow font-bold text-[12px] text-white bg-[#1f1f1f] rounded-lg py-2 border-none cursor-pointer hover:opacity-85 disabled:opacity-50">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Aceptar
                  </button>
                  <button type="button" onClick={() => onRechazar(r.id)} disabled={updating === r.id}
                    className="w-9 flex items-center justify-center border border-[#e5e5e5] rounded-lg bg-white cursor-pointer hover:bg-[#f8f8f8] disabled:opacity-50">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main timeline */}
      <div className="flex-1 overflow-y-auto bg-[#f9f9f9]">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-white border-b border-[#f0f0f0]">
          {[
            { label: "CONFIRMADAS HOY", value: confirmadas },
            { label: "PERSONAS", value: personas },
            { label: "MESAS OCUPADAS", value: `${hoyReservas.length} / ${Math.max(hoyReservas.length + 2, 8)}` },
            { label: "OCUPACIÓN", value: hoyReservas.length > 0 ? `${Math.round((hoyReservas.length / Math.max(hoyReservas.length + 2, 8)) * 100)} %` : "0 %" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-barlow font-semibold text-[9px] uppercase tracking-widest text-[#9b9b9b] mb-0.5">{label}</p>
              <p className="font-fraunces font-semibold text-[22px] text-[#1f1f1f]">{value}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="p-4 flex flex-col gap-4">
          {[
            { label: "COMIDA", items: comida },
            { label: "CENA", items: cena },
          ].map(({ label, items }) => items.length > 0 && (
            <div key={label}>
              <p className="font-barlow font-bold text-[11px] uppercase tracking-widest text-[#9b9b9b] mb-2">{label}</p>
              <div className="flex flex-col gap-2">
                {items.map(r => (
                  <div key={r.id} className="flex gap-4 bg-white rounded-xl border border-[#f0f0f0] px-4 py-3 items-center"
                    style={{ borderColor: r.estado === "pendiente" ? `${ESTADO_COLOR.pendiente}40` : "#f0f0f0" }}>
                    <div className="flex-none text-right w-14">
                      <p className="font-fraunces font-semibold text-[18px] text-[#1f1f1f] leading-none">{formatHora(r.hora)}</p>
                      <p className="font-barlow text-[10px] text-[#9b9b9b]">{r.duracion_minutos}min</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-barlow font-bold text-[14px] text-[#1f1f1f]">{r.nombre_cliente}</p>
                      <p className="font-barlow text-[12px] text-[#9b9b9b]">
                        {r.num_personas} personas{r.servicios ? ` · ${r.servicios.nombre}` : ""}
                      </p>
                    </div>
                    <PillEstado estado={r.estado} small />
                  </div>
                ))}
              </div>
            </div>
          ))}
          {hoyReservas.length === 0 && (
            <div className="text-center py-16">
              <p className="font-barlow text-[14px] text-[#9b9b9b]">Sin reservas para hoy</p>
              <button type="button" onClick={onOpenNueva}
                className="mt-4 font-barlow font-bold text-[13px] text-white bg-[#1f1f1f] rounded-xl px-4 py-2.5 border-none cursor-pointer hover:opacity-85">
                Crear reserva manual
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Calendario semana (N2) ───────────────────────────────────────────────────

function CalendarioSemanal({ reservas, weekDays, todayStr, onClickReserva, onClickSlot }: {
  reservas: Reserva[]; weekDays: Date[]; todayStr: string;
  onClickReserva: (id: string) => void; onClickSlot: (f: string, h: string) => void;
}) {
  const [nowTop, setNowTop] = useState<number | null>(null);
  const todayIdx = weekDays.findIndex(d => toDateStr(d) === todayStr);

  useEffect(() => {
    function upd() {
      const n = new Date();
      const mins = (n.getHours() - START_HOUR) * 60 + n.getMinutes();
      setNowTop(n.getHours() >= START_HOUR && n.getHours() < 24 ? (mins / 60) * HOUR_H : null);
    }
    upd();
    const id = setInterval(upd, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="overflow-auto rounded-card border border-[#f0f0f0] bg-white" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      {/* Day headers */}
      <div className="grid sticky top-0 z-10 bg-white border-b border-[#f0f0f0]" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
        <div className="border-r border-[#f0f0f0]" />
        {weekDays.map((d, i) => {
          const isToday = toDateStr(d) === todayStr;
          return (
            <div key={i} className={`py-2.5 text-center border-r border-[#f0f0f0] last:border-r-0 ${isToday ? "bg-[#0070cc06]" : ""}`}>
              <p className="font-barlow font-semibold text-[9px] uppercase tracking-widest text-[#9b9b9b] mb-1">{formatDiaSemana(d)}</p>
              <div className={`font-fraunces font-semibold text-[17px] w-8 h-8 mx-auto flex items-center justify-center rounded-full ${isToday ? "bg-[#0070cc] text-white" : "text-[#1f1f1f]"}`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="relative grid" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
        {/* Hour labels */}
        <div className="flex flex-col">
          {HOURS.map(h => (
            <div key={h} className="border-b border-r border-[#f5f5f5] flex items-start justify-end pr-2 pt-1" style={{ height: HOUR_H }}>
              <span className="font-barlow text-[10px] text-[#b0b0b0]">{h}:00</span>
            </div>
          ))}
        </div>
        {weekDays.map((d, ci) => {
          const dayStr = toDateStr(d);
          const dayR = reservas.filter(r => r.fecha === dayStr);
          const isToday = dayStr === todayStr;
          return (
            <div key={ci} className="relative border-r border-[#f0f0f0] last:border-r-0" style={{ background: isToday ? "#0070cc03" : "transparent" }}>
              {HOURS.map(h => (
                <div key={h} className="border-b border-[#f5f5f5] cursor-pointer hover:bg-[#0070cc05] transition-colors"
                  style={{ height: HOUR_H }}
                  onClick={() => onClickSlot(dayStr, `${h.toString().padStart(2,"0")}:00`)} />
              ))}
              {dayR.map(r => {
                const [h, m] = r.hora.split(":").map(Number);
                const top = ((h - START_HOUR) * 60 + m) / 60 * HOUR_H;
                const height = Math.max(((r.duracion_minutos || 60) - 4) / 60 * HOUR_H, 24);
                const color = ESTADO_COLOR[r.estado];
                return (
                  <button key={r.id} type="button"
                    onClick={e => { e.stopPropagation(); onClickReserva(r.id); }}
                    className="absolute left-0.5 right-0.5 rounded-lg overflow-hidden text-left border-none cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ top, height, background: `${color}18`, borderLeft: `3px solid ${color}`, padding: "3px 5px", zIndex: 2 }}>
                    <p className="font-barlow font-semibold text-[10px] truncate leading-tight" style={{ color }}>
                      {formatHora(r.hora)} {r.nombre_cliente.split(" ")[0]}
                    </p>
                    {height > 44 && <p className="font-barlow text-[9px] text-[#6b6b6b] truncate">{r.num_personas} pers.</p>}
                  </button>
                );
              })}
              {isToday && nowTop !== null && (
                <div className="absolute left-0 right-0 pointer-events-none" style={{ top: nowTop, zIndex: 3 }}>
                  <div className="relative">
                    <div className="absolute left-0 w-2 h-2 rounded-full -translate-y-1/2 -translate-x-0.5" style={{ background: "#c81b3a" }} />
                    <div className="h-0.5 ml-1" style={{ background: "#c81b3a" }} />
                    {ci === todayIdx && (
                      <span className="absolute left-2 font-barlow font-bold text-[9px] -translate-y-3 whitespace-nowrap" style={{ color: "#c81b3a", fontFamily: "monospace" }}>
                        AHORA · {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendario mes ───────────────────────────────────────────────────────────

function CalendarioMes({ reservas, todayStr }: { reservas: Reserva[]; todayStr: string }) {
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const d1 = new Date(year, month, 1);
  const d2 = new Date(year, month + 1, 0);

  const startDay = d1.getDay() === 0 ? 6 : d1.getDay() - 1;
  const cells: (Date | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= d2.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-card border border-[#f0f0f0]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
        <button type="button" onClick={() => setOffset(o => o - 1)} className="w-8 h-8 flex items-center justify-center border border-[#e5e5e5] rounded-xl cursor-pointer hover:bg-[#f8f8f8] bg-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="font-barlow font-semibold text-[14px] text-[#1f1f1f] capitalize">
          {d1.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        </span>
        <button type="button" onClick={() => setOffset(o => o + 1)} className="w-8 h-8 flex items-center justify-center border border-[#e5e5e5] rounded-xl cursor-pointer hover:bg-[#f8f8f8] bg-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7">
        {["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"].map(d => (
          <div key={d} className="py-2 text-center">
            <span className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b]">{d}</span>
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="border-t border-[#f5f5f5] h-16" />;
          const ds = toDateStr(cell);
          const dayR = reservas.filter(r => r.fecha === ds);
          const isToday = ds === todayStr;
          return (
            <div key={i} className={`border-t border-[#f5f5f5] h-16 p-1.5 ${isToday ? "bg-[#0070cc06]" : ""}`}>
              <div className={`font-fraunces font-semibold text-[13px] w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-[#0070cc] text-white" : "text-[#1f1f1f]"}`}>
                {cell.getDate()}
              </div>
              <div className="flex gap-0.5 flex-wrap">
                {dayR.slice(0, 4).map(r => (
                  <div key={r.id} className="w-1.5 h-1.5 rounded-full" style={{ background: ESTADO_COLOR[r.estado] }} />
                ))}
                {dayR.length > 4 && <span className="font-barlow text-[8px] text-[#9b9b9b]">+{dayR.length - 4}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Nueva reserva modal ──────────────────────────────────────────────────────

function NuevaReservaModal({
  onClose, prestadorId, puebloId, servicios, defaultFecha, defaultHora,
  profesionales, reservas: existingReservas, defaultProfesionalId, recursos,
}: {
  onClose: () => void;
  prestadorId: string;
  puebloId: string;
  servicios: Servicio[];
  defaultFecha?: string;
  defaultHora?: string;
  profesionales?: Profesional[];
  reservas?: Reserva[];
  defaultProfesionalId?: string;
  recursos?: RecursoActividad[];
}) {
  const [saving, setSaving] = useState(false);
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const [autoConfirmar, setAutoConfirmar] = useState(true);
  const [form, setForm] = useState({
    nombre: "", telefono: "", email: "",
    fecha: defaultFecha ?? new Date().toISOString().slice(0, 10),
    hora: defaultHora ?? "13:00",
    personas: "2",
    servicio_id: servicios[0]?.id ?? "",
    profesional_id: defaultProfesionalId ?? "",
    recurso_id: "",
    duracion_horas: "1",
    notas: "",
  });
  function set(field: string, value: string) {
    setOverlapError(null);
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const tieneProfesionales = (profesionales ?? []).length > 0;
  const servicioActual = servicios.find(s => s.id === form.servicio_id);
  const esActividad = servicioActual ? CATS_ACTIVIDADES.has(servicioActual.categoria) : false;
  const recursosDisponibles = (recursos ?? []).filter(r => r.estado !== "inactivo");

  function checkOverlap(): string | null {
    const servicio = servicios.find(s => s.id === form.servicio_id);
    const durNueva = esActividad
      ? Math.round(parseFloat(form.duracion_horas || "1") * 60)
      : (servicio?.duracion_minutos ?? 60);
    const [hN, mN] = form.hora.split(":").map(Number);
    const startNueva = hN * 60 + mN;
    const endNueva = startNueva + durNueva;

    if (esActividad && form.recurso_id) {
      // Overlap por recurso (actividades)
      const conflicto = (existingReservas ?? []).find(r => {
        if (r.recurso_id !== form.recurso_id) return false;
        if (r.fecha !== form.fecha) return false;
        if (!["pendiente", "confirmada"].includes(r.estado)) return false;
        const [hR, mR] = r.hora.split(":").map(Number);
        const startR = hR * 60 + mR;
        const endR = startR + (r.duracion_minutos || 60);
        return startNueva < endR && endNueva > startR;
      });
      if (!conflicto) return null;
      const rec = (recursos ?? []).find(r => r.id === form.recurso_id);
      return `${rec?.nombre ?? "El recurso"} ya está reservado de ${conflicto.hora} a las ${Math.floor((conflicto.hora.split(":").reduce((a, v, i) => a + (i === 0 ? +v * 60 : +v), 0) + (conflicto.duracion_minutos || 60)) / 60)}:${String((conflicto.hora.split(":").reduce((a, v, i) => a + (i === 0 ? +v * 60 : +v), 0) + (conflicto.duracion_minutos || 60)) % 60).padStart(2, "0")} (${conflicto.nombre_cliente}). Elegí otro horario o recurso.`;
    }

    if (!form.profesional_id || !existingReservas) return null;
    const conflicto = existingReservas.find(r => {
      if (r.profesional_id !== form.profesional_id) return false;
      if (r.fecha !== form.fecha) return false;
      if (!["pendiente", "confirmada"].includes(r.estado)) return false;
      const [hR, mR] = r.hora.split(":").map(Number);
      const startR = hR * 60 + mR;
      const endR = startR + (r.duracion_minutos || 60);
      return startNueva < endR && endNueva > startR;
    });
    if (!conflicto) return null;
    const pro = (profesionales ?? []).find(p => p.id === form.profesional_id);
    return `${pro?.nombre ?? "El profesional"} ya tiene una reserva a las ${conflicto.hora} (${conflicto.nombre_cliente}). Elegí otra hora o profesional.`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.telefono || !form.servicio_id) return;
    const error = checkOverlap();
    if (error) { setOverlapError(error); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const servicio = servicios.find(s => s.id === form.servicio_id);
    const durMinutos = esActividad
      ? Math.round(parseFloat(form.duracion_horas || "1") * 60)
      : (servicio?.duracion_minutos ?? 60);

    const { error: dbError } = await supabase.from("reservas").insert({
      prestador_id:     prestadorId,
      pueblo_id:        puebloId,
      usuario_id:       user.id,
      servicio_id:      form.servicio_id,
      fecha:            form.fecha,
      hora:             form.hora,
      duracion_minutos: durMinutos,
      num_personas:     parseInt(form.personas),
      estado:           autoConfirmar ? "confirmada" : "pendiente",
      nombre_cliente:   form.nombre,
      email_cliente:    form.email || `${form.telefono}@manual.pueblo`,
      telefono_cliente: form.telefono,
      notas_cliente:    form.notas || null,
      precio_base:      0,
      precio_final:     0,
      profesional_id:   form.profesional_id || null,
      recurso_id:       esActividad && form.recurso_id ? form.recurso_id : null,
    });
    setSaving(false);
    if (!dbError) { onClose(); window.location.reload(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div
        className="w-full md:max-w-lg bg-white md:rounded-[18px] rounded-t-[18px] overflow-hidden flex flex-col md:max-h-[calc(100vh-60px)] max-h-[90vh]"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-[#f5f5f5] flex-none">
          <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] mb-0.5">NUEVA</p>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f]">Reserva manual</h2>
              <p className="font-barlow text-[13px] text-[#9b9b9b]">Por teléfono o presencial</p>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#f0f0f0] bg-[#f8f8f8] cursor-pointer hover:bg-[#f0f0f0]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 flex flex-col gap-5">
            <div>
              <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] mb-3">Cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Nombre *</label>
                  <input type="text" required value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre del cliente"
                    className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors" />
                </div>
                <div>
                  <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Teléfono *</label>
                  <input type="tel" required value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+34 600 000 000"
                    className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors" />
                </div>
                <div>
                  <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Email (opcional)</label>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@ejemplo.com"
                    className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors" />
                </div>
              </div>
            </div>
            <div>
              <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] mb-3">Reserva</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Fecha *</label>
                  <input type="date" required value={form.fecha} onChange={e => set("fecha", e.target.value)}
                    className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors" />
                </div>
                <div>
                  <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Hora *</label>
                  <input type="time" required value={form.hora} onChange={e => set("hora", e.target.value)}
                    className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors" />
                </div>
                <div>
                  <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Personas</label>
                  <input type="number" min="1" max="100" value={form.personas} onChange={e => set("personas", e.target.value)}
                    className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {servicios.length > 0 && (
                  <div>
                    <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Servicio *</label>
                    <select required value={form.servicio_id} onChange={e => set("servicio_id", e.target.value)}
                      className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors bg-white">
                      {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                )}
                {esActividad && (
                  <>
                    <div>
                      <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Duración</label>
                      <select
                        value={form.duracion_horas}
                        onChange={e => set("duracion_horas", e.target.value)}
                        className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0891b2] transition-colors bg-white"
                      >
                        {[0.5, 1, 1.5, 2, 3, 4, 6, 8, 24].map(h => (
                          <option key={h} value={String(h)}>{h < 1 ? "30 min" : h === 24 ? "1 día" : `${h} h`}</option>
                        ))}
                      </select>
                    </div>
                    {recursosDisponibles.length > 0 && (
                      <div>
                        <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Recurso (opcional)</label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer font-barlow text-[13px]"
                            style={{ borderColor: !form.recurso_id ? "#1f1f1f" : "#e8e8e8", background: !form.recurso_id ? "#f8f8f8" : "white" }}>
                            <input type="radio" name="recurso_id" value="" checked={!form.recurso_id} onChange={() => set("recurso_id", "")} className="sr-only"/>
                            <span style={{ color: !form.recurso_id ? "#1f1f1f" : "#9b9b9b", fontWeight: !form.recurso_id ? 600 : 400 }}>Sin preferencia</span>
                          </label>
                          {recursosDisponibles.map(rec => {
                            const libre = rec.estado === "disponible";
                            return (
                              <label
                                key={rec.id}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer font-barlow text-[13px]"
                                style={{
                                  borderColor: form.recurso_id === rec.id ? "#0891b2" : "#e8e8e8",
                                  background: form.recurso_id === rec.id ? "#ecfeff" : "white",
                                  opacity: libre ? 1 : 0.5,
                                  cursor: libre ? "pointer" : "not-allowed",
                                }}
                              >
                                <input type="radio" name="recurso_id" value={rec.id} checked={form.recurso_id === rec.id} disabled={!libre}
                                  onChange={() => libre && set("recurso_id", rec.id)} className="sr-only"/>
                                <span style={{ color: form.recurso_id === rec.id ? "#0891b2" : "#3a3a3a", fontWeight: form.recurso_id === rec.id ? 600 : 400, flex: 1 }}>
                                  {rec.nombre}
                                </span>
                                {!libre && <span className="font-barlow text-[10px] font-bold text-[#b45309] uppercase">Mant.</span>}
                                {libre && rec.precio_hora != null && (
                                  <span className="font-barlow text-[11px] text-[#9b9b9b]">{rec.precio_hora} €/h</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {tieneProfesionales && !esActividad && (
                  <div>
                    <label className="font-barlow font-semibold text-[10px] uppercase tracking-wider text-[#9b9b9b] block mb-1.5">Profesional (opcional)</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => set("profesional_id", "")}
                        className="font-barlow font-semibold text-[12px] px-3 py-1.5 rounded-[10px] border transition-all cursor-pointer"
                        style={{
                          background: !form.profesional_id ? "#1f1f1f" : "white",
                          color: !form.profesional_id ? "white" : "#6b6b6b",
                          borderColor: !form.profesional_id ? "#1f1f1f" : "#e5e5e5",
                        }}
                      >
                        Sin preferencia
                      </button>
                      {(profesionales ?? []).map(pro => (
                        <button
                          key={pro.id}
                          type="button"
                          onClick={() => set("profesional_id", pro.id)}
                          className="font-barlow font-semibold text-[12px] px-3 py-1.5 rounded-[10px] border transition-all cursor-pointer flex items-center gap-1.5"
                          style={{
                            background: form.profesional_id === pro.id ? pro.color + "18" : "white",
                            color: form.profesional_id === pro.id ? pro.color : "#6b6b6b",
                            borderColor: form.profesional_id === pro.id ? pro.color + "60" : "#e5e5e5",
                          }}
                        >
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{ background: pro.color + "22", color: pro.color }}
                          >
                            {pro.nombre.charAt(0).toUpperCase()}
                          </span>
                          {pro.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {overlapError && (
                <div className="mt-3 flex items-start gap-2 bg-[#fef2f2] border border-[#fecaca] rounded-xl px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c81b3a" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p className="font-barlow text-[12px] text-[#c81b3a] leading-snug">{overlapError}</p>
                </div>
              )}
            </div>
            <div>
              <label className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b] block mb-1.5">Notas internas (no se muestran al cliente)</label>
              <textarea value={form.notas} onChange={e => set("notas", e.target.value)} placeholder="Observaciones..." rows={3}
                className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors resize-none" />
            </div>
            <div className="flex items-center justify-between bg-[#f8f8f8] rounded-xl px-4 py-3">
              <div>
                <p className="font-barlow font-semibold text-[13px] text-[#1f1f1f]">Confirmar automáticamente</p>
                <p className="font-barlow text-[12px] text-[#9b9b9b]">Crea la reserva directamente como confirmada</p>
              </div>
              <button type="button" onClick={() => setAutoConfirmar(p => !p)}
                className="relative w-10 h-6 rounded-full transition-colors cursor-pointer border-none flex-none"
                style={{ background: autoConfirmar ? "#0070cc" : "#d0d0d0" }}>
                <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: autoConfirmar ? "18px" : "2px" }} />
              </button>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-[#f5f5f5] flex gap-3">
            <button type="button" onClick={onClose}
              className="font-barlow font-medium text-[13px] text-[#6b6b6b] border border-[#e5e5e5] rounded-xl px-4 py-2.5 cursor-pointer hover:bg-[#f8f8f8] bg-transparent">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 font-barlow font-bold text-[14px] text-white bg-[#1f1f1f] rounded-xl py-2.5 border-none cursor-pointer hover:opacity-85 disabled:opacity-50">
              {saving ? "Creando…" : "Crear y confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNueva }: { onNueva: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 bg-[#f5f7fa] rounded-2xl flex items-center justify-center mb-5">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9b9b9b" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <h3 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f] mb-2">Sin reservas aquí</h3>
      <p className="font-barlow text-[14px] text-[#9b9b9b] mb-6 max-w-xs">
        Cuando lleguen reservas aparecerán aquí. También podés crear una reserva manual.
      </p>
      <button type="button" onClick={onNueva}
        className="font-barlow font-bold text-[13px] text-white bg-[#1f1f1f] rounded-xl px-5 py-2.5 border-none cursor-pointer hover:opacity-85 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva reserva
      </button>
    </div>
  );
}

// ─── Calendario por profesional ──────────────────────────────────────────────

function CalendarioProfesional({
  reservas,
  profesionales,
  todayStr,
  onClickReserva,
  onClickSlot,
}: {
  reservas:      Reserva[];
  profesionales: Profesional[];
  todayStr:      string;
  onClickReserva:(id: string) => void;
  onClickSlot:   (f: string, h: string, profesionalId?: string) => void;
}) {
  const [nowTop, setNowTop] = useState<number | null>(null);

  useEffect(() => {
    function upd() {
      const n = new Date();
      if (n.toISOString().slice(0, 10) !== todayStr) { setNowTop(null); return; }
      const mins = (n.getHours() - START_HOUR) * 60 + n.getMinutes();
      setNowTop(n.getHours() >= START_HOUR ? (mins / 60) * HOUR_H : null);
    }
    upd();
    const id = setInterval(upd, 60_000);
    return () => clearInterval(id);
  }, [todayStr]);

  const dayReservas = reservas.filter(r => r.fecha === todayStr);
  const COL_H = 56; // header height per professional column

  if (profesionales.length === 0) {
    return (
      <div className="bg-white rounded-card border border-[#f0f0f0] flex flex-col items-center justify-center py-20 text-center">
        <p className="font-barlow font-semibold text-[14px] text-[#6b6b6b] mb-2">Sin profesionales activos</p>
        <a href="/panel/profesionales" className="font-barlow font-bold text-[13px] text-[#9333ea] underline">
          Añadir profesionales
        </a>
      </div>
    );
  }

  return (
    <div
      className="overflow-auto rounded-card border border-[#f0f0f0] bg-white"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      {/* Professional header row */}
      <div
        className="grid sticky top-0 z-10 bg-white border-b border-[#f0f0f0]"
        style={{ gridTemplateColumns: `64px repeat(${profesionales.length}, 1fr)` }}
      >
        <div className="border-r border-[#f0f0f0]" style={{ height: COL_H }} />
        {profesionales.map((pro) => (
          <div
            key={pro.id}
            className="border-r border-[#f0f0f0] last:border-r-0 flex flex-col items-center justify-center gap-1 py-2"
            style={{ height: COL_H, background: pro.color + "06" }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: pro.color + "22",
                border: `2px solid ${pro.color}44`,
                color: pro.color,
                fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {pro.nombre.charAt(0).toUpperCase()}
            </div>
            <p className="font-barlow font-bold text-[11px] text-[#1f1f1f] text-center leading-tight px-1">
              {[pro.nombre, pro.apellidos].filter(Boolean).join(" ")}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div
        className="relative grid"
        style={{ gridTemplateColumns: `64px repeat(${profesionales.length}, 1fr)` }}
      >
        {/* Hour labels */}
        <div className="flex flex-col">
          {HOURS.map((h) => (
            <div
              key={h}
              className="border-b border-r border-[#f5f5f5] flex items-start justify-end pr-2 pt-1"
              style={{ height: HOUR_H }}
            >
              <span className="font-barlow text-[10px] text-[#b0b0b0]">{h}:00</span>
            </div>
          ))}
        </div>

        {/* Columnas por profesional */}
        {profesionales.map((pro, pi) => {
          const proReservas = dayReservas.filter(r => r.profesional_id === pro.id);
          return (
            <div
              key={pro.id}
              className="relative border-r border-[#f0f0f0] last:border-r-0"
              style={{ background: "transparent" }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="border-b border-[#f5f5f5] cursor-pointer transition-colors"
                  style={{ height: HOUR_H }}
                  onClick={() => onClickSlot(todayStr, `${h.toString().padStart(2, "0")}:00`, pro.id)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = pro.color + "08"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                />
              ))}

              {/* Events */}
              {proReservas.map((r) => {
                const [h, m] = r.hora.split(":").map(Number);
                const top = ((h - START_HOUR) * 60 + m) / 60 * HOUR_H;
                const height = Math.max(((r.duracion_minutos || 45) - 4) / 60 * HOUR_H, 24);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onClickReserva(r.id); }}
                    className="absolute left-0.5 right-0.5 rounded-lg overflow-hidden text-left border-none cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      top,
                      height,
                      background: pro.color + "16",
                      borderLeft: `3px solid ${pro.color}`,
                      padding: "3px 5px",
                      zIndex: 2,
                    }}
                  >
                    <p
                      className="font-barlow font-semibold text-[10px] truncate leading-tight"
                      style={{ color: pro.color }}
                    >
                      {formatHora(r.hora)} {r.nombre_cliente.split(" ")[0]}
                    </p>
                    {height > 40 && r.servicios && (
                      <p className="font-barlow text-[9px] text-[#6b6b6b] truncate mt-0.5">{r.servicios.nombre}</p>
                    )}
                  </button>
                );
              })}

              {/* Línea AHORA (solo primera columna para no repetirla) */}
              {pi === 0 && nowTop !== null && (
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: nowTop, zIndex: 3 }}
                >
                  <div className="relative">
                    <div
                      className="absolute left-0 w-2 h-2 rounded-full -translate-y-1/2 -translate-x-0.5"
                      style={{ background: "#c81b3a" }}
                    />
                    <div className="h-0.5 ml-1" style={{ background: "#c81b3a" }} />
                    <span
                      className="absolute left-2 font-barlow font-bold text-[9px] -translate-y-3 whitespace-nowrap"
                      style={{ color: "#c81b3a", fontFamily: "monospace" }}
                    >
                      AHORA · {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TAB_LISTA: { key: TabLista; label: string }[] = [
  { key: "pendientes", label: "Pendientes" },
  { key: "hoy", label: "Hoy" },
  { key: "proximas", label: "Próximas" },
  { key: "historico", label: "Histórico" },
];

const CATS_ACTIVIDADES = new Set([
  "alquiler_bicis", "alquiler_barcos", "escuela_nautica",
  "actividades_aventura", "tour_guiado",
]);

export default function ReservasManager({ reservas: initial, prestadorId, puebloId, mesas, servicios, profesionales, recursos }: Props) {
  const [reservas, setReservas] = useState<Reserva[]>(initial);
  const [view, setView] = useState<MainView>("lista");
  const [tabLista, setTabLista] = useState<TabLista>("pendientes");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailId, setMobileDetailId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showNueva, setShowNueva] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState<string | undefined>();
  const [nuevaHora, setNuevaHora] = useState<string | undefined>();
  const [nuevaProfesionalId, setNuevaProfesionalId] = useState<string | undefined>();
  const [updating, setUpdating] = useState<string | null>(null);

  const todayStr = toDateStr(new Date());
  const weekStart = getMondayOfWeek(weekOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const weekEnd = new Date(weekDays[6]); weekEnd.setHours(23, 59, 59);

  const today = new Date(todayStr + "T00:00:00");
  const diaLabel = today.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

  const thisMonday = getMondayOfWeek(0);
  const thisSunday = new Date(thisMonday); thisSunday.setDate(thisSunday.getDate() + 6);

  const stats = {
    pendientes: reservas.filter(r => r.estado === "pendiente").length,
    hoy: reservas.filter(r => r.fecha === todayStr).length,
    semana: reservas.filter(r => { const d = new Date(r.fecha + "T00:00:00"); return d >= thisMonday && d <= thisSunday; }).length,
  };

  const listaData: Record<TabLista, Reserva[]> = {
    pendientes: reservas.filter(r => r.estado === "pendiente"),
    hoy: reservas.filter(r => r.fecha === todayStr),
    proximas: reservas.filter(r => r.fecha > todayStr && !["rechazada","cancelada"].includes(r.estado)),
    historico: reservas.filter(r => ["completada","rechazada","cancelada","no_show"].includes(r.estado)),
  };

  const calReservas = reservas.filter(r => { const d = new Date(r.fecha + "T00:00:00"); return d >= weekStart && d <= weekEnd; });

  async function cambiarEstado(id: string, nuevoEstado: EstadoReserva) {
    setUpdating(id);
    const supabase = createClient();
    const extra = nuevoEstado === "confirmada" ? { fecha_confirmacion: new Date().toISOString() }
                : nuevoEstado === "completada" ? { fecha_completada: new Date().toISOString() } : {};
    const { error } = await supabase.from("reservas").update({ estado: nuevoEstado, ...extra }).eq("id", id);
    if (!error) setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r));
    setUpdating(null);
  }

  function openNueva(fecha?: string, hora?: string, profesionalId?: string) {
    setNuevaFecha(fecha);
    setNuevaHora(hora);
    setNuevaProfesionalId(profesionalId);
    setShowNueva(true);
  }

  const filteredLista = listaData[tabLista];
  const selectedDesktop = reservas.find(r => r.id === selectedId) ?? null;
  const selectedMobile = reservas.find(r => r.id === mobileDetailId) ?? null;

  // ── Mobile detail overlay (< md) ──
  if (selectedMobile) {
    return (
      <>
        <MobileDetail
          r={selectedMobile}
          mesas={mesas}
          onCambiarEstado={e => { cambiarEstado(selectedMobile.id, e); setMobileDetailId(null); }}
          updating={updating === selectedMobile.id}
          onBack={() => setMobileDetailId(null)}
        />
        {showNueva && <NuevaReservaModal onClose={() => setShowNueva(false)} prestadorId={prestadorId} puebloId={puebloId} servicios={servicios} defaultFecha={nuevaFecha} defaultHora={nuevaHora} profesionales={profesionales} reservas={reservas} defaultProfesionalId={nuevaProfesionalId} recursos={recursos} />}
      </>
    );
  }

  return (
    <div className="flex flex-col">

      {/* ── MOBILE HEADER (< md) ── */}
      <div className="flex items-center justify-between mb-4 md:hidden px-0">
        <div>
          <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-[#9b9b9b]">RESERVAS</p>
          <p className="font-fraunces font-semibold text-[20px] text-[#1f1f1f] capitalize">Hoy · {diaLabel}</p>
        </div>
        <button type="button" onClick={() => openNueva()}
          className="w-10 h-10 bg-[#1f1f1f] rounded-full flex items-center justify-center border-none cursor-pointer hover:opacity-85">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {/* ── STATS (shared) ── */}
      <div className="flex gap-2 mb-5 md:gap-3">
        <StatCard label="PENDIENTES" value={stats.pendientes} accent="#d97706" />
        <StatCard label="HOY" value={stats.hoy} />
        <StatCard label="ESTA SEMANA" value={stats.semana} />
      </div>

      {/* ── DESKTOP/TABLET HEADER ── */}
      <div className="hidden md:flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex gap-1 bg-[#f0f0f0] p-1 rounded-xl">
          {(["lista","dia","semana","mes","profesional"] as MainView[]).map(v => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={`font-barlow font-semibold text-[12px] px-4 py-1.5 rounded-[10px] transition-all cursor-pointer border-none capitalize ${
                view === v ? "bg-white text-[#1f1f1f] shadow-sm" : "text-[#6b6b6b] bg-transparent"
              }`}>
              {v === "dia" ? "Día" : v === "semana" ? "Semana" : v === "mes" ? "Mes" : v === "profesional" ? "Por profesional" : "Lista"}
            </button>
          ))}
        </div>
        {(view === "semana") && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setWeekOffset(0)} className="font-barlow font-semibold text-[12px] border border-[#e5e5e5] rounded-xl px-3 py-1.5 cursor-pointer hover:bg-[#f8f8f8] bg-white text-[#1f1f1f]">Hoy</button>
            <div className="flex gap-1">
              <button type="button" onClick={() => setWeekOffset(o => o - 1)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#e5e5e5] cursor-pointer hover:bg-[#f8f8f8] bg-white">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button type="button" onClick={() => setWeekOffset(o => o + 1)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#e5e5e5] cursor-pointer hover:bg-[#f8f8f8] bg-white">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <span className="font-barlow font-medium text-[13px] text-[#1f1f1f]">{formatRango(weekStart)}</span>
          </div>
        )}
        <button type="button" onClick={() => openNueva()}
          className="font-barlow font-bold text-[13px] text-white bg-[#1f1f1f] rounded-xl px-4 py-2 border-none cursor-pointer hover:opacity-85 flex items-center gap-2 ml-auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva reserva
        </button>
      </div>

      {/* ── MOBILE: tabs + cards ── */}
      <div className="md:hidden">
        {/* Tabs scroll */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
          {TAB_LISTA.map(t => {
            const count = listaData[t.key].length;
            const active = tabLista === t.key;
            return (
              <button key={t.key} type="button" onClick={() => setTabLista(t.key)}
                className="font-barlow font-semibold text-[13px] px-4 py-2 rounded-pill whitespace-nowrap cursor-pointer border transition-all flex items-center gap-1.5 flex-none"
                style={{ background: active ? "#1f1f1f" : "white", color: active ? "white" : "#374151", borderColor: active ? "#1f1f1f" : "#e5e7eb" }}>
                {t.label}
                {count > 0 && (
                  <span className="font-bold text-[11px] rounded-full w-5 h-5 inline-flex items-center justify-center"
                    style={{ background: active ? "rgba(255,255,255,0.2)" : "#f0f0f0", color: active ? "white" : "#6b6b6b" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Section header for pending */}
        {tabLista === "pendientes" && filteredLista.length > 0 && (
          <p className="font-barlow font-bold text-[11px] uppercase tracking-widest px-0 mb-3" style={{ color: ESTADO_COLOR.pendiente }}>
            Esperando respuesta
          </p>
        )}

        {filteredLista.length === 0 ? (
          <EmptyState onNueva={() => openNueva()} />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredLista.map(r => (
              <MobileReservaCard
                key={r.id} r={r}
                onAceptar={() => cambiarEstado(r.id, r.estado === "confirmada" ? "completada" : "confirmada")}
                onRechazar={() => cambiarEstado(r.id, "rechazada")}
                onClick={() => setMobileDetailId(r.id)}
                updating={updating === r.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP: lista view ── */}
      {view === "lista" && (
        <div className="hidden md:block">
          <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
            {TAB_LISTA.map(t => {
              const count = listaData[t.key].length;
              const active = tabLista === t.key;
              return (
                <button key={t.key} type="button" onClick={() => { setTabLista(t.key); setSelectedId(null); }}
                  className="font-barlow font-semibold text-[13px] px-4 py-2 rounded-pill whitespace-nowrap cursor-pointer border transition-all flex items-center gap-1.5"
                  style={{ background: active ? "#1f1f1f" : "white", color: active ? "white" : "#374151", borderColor: active ? "#1f1f1f" : "#e5e7eb" }}>
                  {t.label}
                  {count > 0 && (
                    <span className="font-bold text-[11px] rounded-full w-5 h-5 inline-flex items-center justify-center"
                      style={{ background: active ? "rgba(255,255,255,0.2)" : "#f0f0f0", color: active ? "white" : "#6b6b6b" }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {filteredLista.length === 0 ? (
            <EmptyState onNueva={() => openNueva()} />
          ) : (
            <div className={`grid gap-4 ${selectedDesktop ? "lg:grid-cols-[400px_1fr]" : "max-w-2xl"}`}>
              <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
                {filteredLista.map(r => (
                  <ReservaCard key={r.id} r={r}
                    selected={selectedId === r.id}
                    onClick={() => setSelectedId(prev => prev === r.id ? null : r.id)}
                    onAceptar={() => cambiarEstado(r.id, "confirmada")}
                    onRechazar={() => cambiarEstado(r.id, "rechazada")}
                    updating={updating === r.id} />
                ))}
              </div>
              {selectedDesktop && (
                <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
                  <DetailPane r={selectedDesktop} mesas={mesas}
                    onCambiarEstado={e => cambiarEstado(selectedDesktop.id, e)}
                    updating={updating === selectedDesktop.id}
                    onClose={() => setSelectedId(null)} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DESKTOP: día view (N4) ── */}
      {view === "dia" && (
        <div className="hidden md:block rounded-card border border-[#f0f0f0] overflow-hidden" style={{ minHeight: 500 }}>
          <TabletDiaView
            reservas={reservas} todayStr={todayStr}
            onAceptar={id => cambiarEstado(id, "confirmada")}
            onRechazar={id => cambiarEstado(id, "rechazada")}
            updating={updating}
            onOpenNueva={() => openNueva(todayStr)} />
        </div>
      )}

      {/* ── DESKTOP: semana view (N2) ── */}
      {view === "semana" && (
        <div className="hidden md:block">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {(["pendiente","confirmada","completada"] as EstadoReserva[]).map(e => (
              <div key={e} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: `${ESTADO_COLOR[e]}40`, borderLeft: `3px solid ${ESTADO_COLOR[e]}` }} />
                <span className="font-barlow text-[12px] text-[#6b6b6b]">{ESTADO_LABEL[e]}</span>
              </div>
            ))}
            {calReservas.length === 0 && (
              <p className="font-barlow text-[13px] text-[#9b9b9b] ml-4">Sin reservas esta semana — hacé click en una celda para crear una</p>
            )}
          </div>
          <CalendarioSemanal
            reservas={calReservas} weekDays={weekDays} todayStr={todayStr}
            onClickReserva={id => { setSelectedId(id); setView("lista"); const r = reservas.find(r => r.id === id); if (r) { if (["completada","rechazada","cancelada","no_show"].includes(r.estado)) setTabLista("historico"); else if (r.fecha === todayStr) setTabLista("hoy"); else if (r.estado === "pendiente") setTabLista("pendientes"); else setTabLista("proximas"); } }}
            onClickSlot={(f, h) => openNueva(f, h)} />
        </div>
      )}

      {/* ── DESKTOP: mes view ── */}
      {view === "mes" && (
        <div className="hidden md:block max-w-3xl">
          <CalendarioMes reservas={reservas} todayStr={todayStr} />
        </div>
      )}

      {/* ── DESKTOP: por profesional view ── */}
      {view === "profesional" && (
        <div className="hidden md:block">
          <CalendarioProfesional
            reservas={reservas}
            profesionales={profesionales ?? []}
            todayStr={todayStr}
            onClickReserva={id => {
              setSelectedId(id);
              setView("lista");
              const r = reservas.find(r => r.id === id);
              if (r) {
                if (["completada","rechazada","cancelada","no_show"].includes(r.estado)) setTabLista("historico");
                else if (r.fecha === todayStr) setTabLista("hoy");
                else if (r.estado === "pendiente") setTabLista("pendientes");
                else setTabLista("proximas");
              }
            }}
            onClickSlot={(f, h, proId) => openNueva(f, h, proId)}
          />
        </div>
      )}

      {/* Modal */}
      {showNueva && (
        <NuevaReservaModal onClose={() => setShowNueva(false)} prestadorId={prestadorId} puebloId={puebloId}
          servicios={servicios} defaultFecha={nuevaFecha} defaultHora={nuevaHora}
          profesionales={profesionales} reservas={reservas} defaultProfesionalId={nuevaProfesionalId}
          recursos={recursos} />
      )}
    </div>
  );
}
