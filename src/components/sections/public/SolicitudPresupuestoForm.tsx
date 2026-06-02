"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

interface Props {
  prestadorNombre: string;
  puebloNombre:    string;
  puebloSlug:      string;
  slug:            string;
  onSolicitar:     (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
}

const BRAND = "#0369a1";

export default function SolicitudPresupuestoForm({
  prestadorNombre,
  puebloNombre,
  puebloSlug,
  onSolicitar,
}: Props) {
  const [ok,      setOk]      = useState(false);
  const [error,   setError]   = useState("");
  const [pending, startTrans] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTrans(async () => {
      const res = await onSolicitar(fd);
      if (res.ok) {
        setOk(true);
      } else {
        setError(res.error ?? "Error al enviar la solicitud.");
      }
    });
  }

  if (ok) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-[#f0f0f0] p-10" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#e0f2fe" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-fraunces font-semibold text-[24px] text-[#1f1f1f] mb-3">
            Solicitud enviada
          </h1>
          <p className="font-barlow text-[14px] text-[#666] mb-8 leading-relaxed">
            <strong>{prestadorNombre}</strong> ha recibido tu solicitud de presupuesto. Te contactarán en breve.
          </p>
          <Link
            href={`/${puebloSlug}`}
            className="inline-block font-barlow font-bold text-white rounded-xl px-6 py-3 no-underline hover:opacity-90 transition-opacity"
            style={{ background: BRAND }}
          >
            Volver a {puebloNombre}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Hero */}
      <div style={{ background: "linear-gradient(160deg, #0c1a2e 0%, #0f2744 100%)" }} className="py-12">
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Link href={`/${puebloSlug}`} className="font-barlow text-sm text-white/40 no-underline hover:text-white/70 transition-colors">{puebloNombre}</Link>
            <span className="text-white/25 text-sm">/</span>
            <span className="font-barlow text-sm text-white/70">{prestadorNombre}</span>
          </div>
          <p className="font-barlow font-bold text-[11px] uppercase tracking-widest mb-2" style={{ color: `${BRAND}cc` }}>
            SOLICITUD DE PRESUPUESTO
          </p>
          <h1 className="font-fraunces font-semibold text-white mb-2" style={{ fontSize: "clamp(24px, 5vw, 36px)" }}>
            {prestadorNombre}
          </h1>
          <p className="font-barlow text-white/50 text-[14px]">
            Describí tu trabajo y recibís respuesta en menos de 24 horas.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#f0f0f0] p-6 space-y-5" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

          <div>
            <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">
              Tu nombre <span className="text-red-500">*</span>
            </label>
            <input
              name="nombre"
              type="text"
              required
              autoComplete="name"
              placeholder="Nombre completo"
              className="w-full font-barlow text-[15px] px-4 py-3 rounded-xl border border-[#e5e5e5] bg-white text-[#1f1f1f] focus:outline-none focus:border-[#0369a1] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full font-barlow text-[15px] px-4 py-3 rounded-xl border border-[#e5e5e5] bg-white text-[#1f1f1f] focus:outline-none focus:border-[#0369a1] transition-colors"
              />
            </div>
            <div>
              <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">
                Teléfono
              </label>
              <input
                name="telefono"
                type="tel"
                autoComplete="tel"
                placeholder="+34 6XX XXX XXX"
                className="w-full font-barlow text-[15px] px-4 py-3 rounded-xl border border-[#e5e5e5] bg-white text-[#1f1f1f] focus:outline-none focus:border-[#0369a1] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="font-barlow font-semibold text-[11px] uppercase tracking-widest text-[#888] block mb-1.5">
              Describí el trabajo <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion"
              required
              rows={5}
              placeholder="Ej: Necesito cambiar la instalación eléctrica del salón principal. La casa tiene 80 m² y la instalación es de los años 80..."
              className="w-full font-barlow text-[15px] px-4 py-3 rounded-xl border border-[#e5e5e5] bg-white text-[#1f1f1f] focus:outline-none focus:border-[#0369a1] transition-colors resize-none"
            />
            <p className="font-barlow text-[12px] text-[#aaa] mt-1.5">
              Cuanto más detallés, más preciso será el presupuesto.
            </p>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 font-barlow text-[13px] text-red-700 bg-red-50 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full font-barlow font-bold text-[15px] py-4 rounded-xl text-white disabled:opacity-60 transition-opacity"
            style={{ background: BRAND }}
          >
            {pending ? "Enviando solicitud…" : "Enviar solicitud de presupuesto"}
          </button>

          <p className="font-barlow text-[11px] text-[#aaa] text-center">
            Tu información solo se compartirá con {prestadorNombre}.
          </p>
        </form>
      </div>
    </div>
  );
}
