"use client";

import { useState, useEffect, useCallback } from "react";
import type { Service } from "@/types";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface Step1Data { date: string; slot: string }
interface Step2Data { people: number; note: string }
interface Step3Data { name: string; email: string; phone: string }

/* ─── Constants ──────────────────────────────────────────────────────────────── */
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
const NEXT_DAYS = 14;

function buildDates() {
  const today = new Date();
  return Array.from({ length: NEXT_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d;
  });
}

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

function fmtDisplay(d: Date) {
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

/* ─── Step Indicator ─────────────────────────────────────────────────────────── */
function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className="transition-all duration-200"
            style={{
              width: n === step ? 24 : 8,
              height: 8,
              borderRadius: 999,
              background: n <= step ? "#d53b00" : "#e5e7eb",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Step 1: Fecha + Hora ───────────────────────────────────────────────────── */
function Step1({ data, onChange }: { data: Step1Data; onChange: (d: Step1Data) => void }) {
  const dates = buildDates();

  return (
    <div>
      <h3 className="font-fraunces font-semibold text-[22px] text-text-body mb-1">¿Cuándo venís?</h3>
      <p className="font-barlow text-sm text-text-muted mb-5">Seleccioná fecha y hora de llegada</p>

      {/* Date scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-6">
        {dates.map((d) => {
          const key = fmt(d);
          const parts = fmtDisplay(d).split(" ");
          const selected = data.date === key;
          return (
            <button
              key={key}
              onClick={() => onChange({ ...data, date: key })}
              className="flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-card border transition-all duration-150 cursor-pointer"
              style={{
                minWidth: 62,
                borderColor: selected ? "#d53b00" : "#e5e7eb",
                background: selected ? "#fff4f0" : "#fff",
                color: selected ? "#d53b00" : "#374151",
              }}
            >
              <span className="font-barlow text-[10px] font-medium uppercase tracking-wide opacity-70 mb-0.5">{parts[0]}</span>
              <span className="font-barlow font-bold text-[18px] leading-none">{parts[1]}</span>
              <span className="font-barlow text-[11px] opacity-70 mt-0.5">{parts[2]}</span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      <p className="font-barlow text-[13px] font-semibold text-text-muted uppercase tracking-wide mb-3">Hora</p>
      <div className="grid grid-cols-4 gap-2">
        {TIME_SLOTS.map((slot) => {
          const selected = data.slot === slot;
          return (
            <button
              key={slot}
              onClick={() => onChange({ ...data, slot })}
              className="font-barlow font-medium text-[14px] py-2 rounded-input border transition-all duration-150 cursor-pointer"
              style={{
                borderColor: selected ? "#d53b00" : "#e5e7eb",
                background: selected ? "#d53b00" : "#fff",
                color: selected ? "#fff" : "#374151",
              }}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 2: Personas + Nota ────────────────────────────────────────────────── */
function Step2({ data, onChange }: { data: Step2Data; onChange: (d: Step2Data) => void }) {
  return (
    <div>
      <h3 className="font-fraunces font-semibold text-[22px] text-text-body mb-1">¿Cuántos son?</h3>
      <p className="font-barlow text-sm text-text-muted mb-6">Número de personas y detalles extra</p>

      {/* People counter */}
      <div className="flex items-center justify-between bg-fog rounded-card px-5 py-4 mb-6">
        <div>
          <p className="font-barlow font-semibold text-[15px] text-text-body">Personas</p>
          <p className="font-barlow text-[12px] text-text-muted">Adultos y niños</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChange({ ...data, people: Math.max(1, data.people - 1) })}
            className="w-9 h-9 rounded-full border-2 border-primary text-primary font-bold text-lg flex items-center justify-center cursor-pointer bg-white hover:bg-primary hover:text-white transition-colors"
          >
            −
          </button>
          <span className="font-barlow font-bold text-[22px] text-text-body w-6 text-center">{data.people}</span>
          <button
            onClick={() => onChange({ ...data, people: Math.min(20, data.people + 1) })}
            className="w-9 h-9 rounded-full border-2 border-primary text-primary font-bold text-lg flex items-center justify-center cursor-pointer bg-white hover:bg-primary hover:text-white transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block font-barlow text-[13px] font-semibold text-text-muted uppercase tracking-wide mb-2">
          Nota especial <span className="normal-case font-normal">(opcional)</span>
        </label>
        <textarea
          value={data.note}
          onChange={(e) => onChange({ ...data, note: e.target.value })}
          placeholder="Alergias, ocasión especial, preferencias de mesa..."
          rows={3}
          className="w-full font-barlow text-[14px] text-text-body border border-divisor rounded-card px-4 py-3 resize-none outline-none focus:border-primary transition-colors placeholder:text-text-muted"
        />
      </div>
    </div>
  );
}

/* ─── Step 3: Datos de Contacto ──────────────────────────────────────────────── */
function Step3({ data, onChange, summary }: { data: Step3Data; onChange: (d: Step3Data) => void; summary: string }) {
  return (
    <div>
      <h3 className="font-fraunces font-semibold text-[22px] text-text-body mb-1">Tus datos</h3>
      <p className="font-barlow text-sm text-text-muted mb-5">Confirmamos la reserva por email</p>

      {/* Summary chip */}
      <div className="flex items-center gap-2 bg-fog rounded-card px-4 py-3 mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0070cc" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="font-barlow text-[13px] font-medium text-primary">{summary}</span>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3.5">
        {[
          { key: "name" as const, label: "Nombre completo", placeholder: "Juan García", type: "text" },
          { key: "email" as const, label: "Email", placeholder: "juan@email.com", type: "email" },
          { key: "phone" as const, label: "Teléfono", placeholder: "+34 600 000 000", type: "tel" },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">{label}</label>
            <input
              type={type}
              value={data[key]}
              onChange={(e) => onChange({ ...data, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full font-barlow text-[15px] text-text-body border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary transition-colors placeholder:text-text-muted"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Confirmed ──────────────────────────────────────────────────────────────── */
function Confirmed({ service, name, onClose }: { service: Service; name: string; onClose: () => void }) {
  return (
    <div className="text-center py-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: "#dcfce7" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3 className="font-fraunces font-semibold text-[24px] text-text-body mb-2">¡Reserva enviada!</h3>
      <p className="font-barlow text-[15px] text-text-muted leading-relaxed mb-2">
        Hola <strong className="text-text-body">{name || "viajero"}</strong>, te confirmamos que recibimos tu solicitud en
      </p>
      <p className="font-barlow font-semibold text-[16px] text-primary mb-6">{service.name}</p>
      <p className="font-barlow text-[13px] text-text-muted mb-8">
        El establecimiento te contactará en las próximas horas para confirmar la disponibilidad.
      </p>
      <button
        onClick={onClose}
        className="w-full font-barlow font-bold text-base text-white bg-primary rounded-pill py-3.5 cursor-pointer hover:opacity-90 transition-opacity"
      >
        Entendido
      </button>
    </div>
  );
}

/* ─── ReservaModal ───────────────────────────────────────────────────────────── */
interface Props { service: Service; isOpen: boolean; onClose: () => void }

export default function ReservaModal({ service, isOpen, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [s1, setS1] = useState<Step1Data>({ date: "", slot: "" });
  const [s2, setS2] = useState<Step2Data>({ people: 2, note: "" });
  const [s3, setS3] = useState<Step3Data>({ name: "", email: "", phone: "" });

  /* reset on open */
  useEffect(() => {
    if (isOpen) {
      setStep(1); setConfirmed(false);
      setS1({ date: "", slot: "" });
      setS2({ people: 2, note: "" });
      setS3({ name: "", email: "", phone: "" });
    }
  }, [isOpen]);

  /* trap escape */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  const canNext = step === 1
    ? !!(s1.date && s1.slot)
    : step === 2
    ? s2.people >= 1
    : !!(s3.name && s3.email);

  const summary = s1.date && s1.slot && s2.people
    ? `${new Date(s1.date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })} · ${s1.slot} · ${s2.people} persona${s2.people !== 1 ? "s" : ""}`
    : "";

  function handleNext() {
    if (step < 3) setStep(s => s + 1);
    else { setConfirmed(true); }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet */}
      <div
        className="bg-white w-full sm:max-w-md rounded-t-[24px] sm:rounded-card-lg overflow-hidden"
        style={{ maxHeight: "92dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-divisor flex-shrink-0">
          <div>
            <p className="font-barlow text-[11px] font-semibold text-text-muted uppercase tracking-wider">Reservar</p>
            <p className="font-barlow font-semibold text-[15px] text-text-body leading-tight">{service.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-fog text-text-muted hover:bg-divisor transition-colors cursor-pointer border-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {confirmed ? (
            <Confirmed service={service} name={s3.name} onClose={onClose} />
          ) : (
            <>
              <StepDots step={step} />
              {step === 1 && <Step1 data={s1} onChange={setS1} />}
              {step === 2 && <Step2 data={s2} onChange={setS2} />}
              {step === 3 && <Step3 data={s3} onChange={setS3} summary={summary} />}
            </>
          )}
        </div>

        {/* Footer */}
        {!confirmed && (
          <div className="px-6 py-4 border-t border-divisor flex-shrink-0 flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 font-barlow font-semibold text-[15px] text-primary bg-white border-2 border-primary rounded-pill py-3 cursor-pointer hover:bg-fog transition-colors"
              >
                Atrás
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canNext}
              className="font-barlow font-bold text-[15px] text-white bg-commerce rounded-pill py-3 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ flex: step > 1 ? 2 : 1, width: step === 1 ? "100%" : undefined }}
            >
              {step === 3 ? "Confirmar reserva" : "Continuar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
