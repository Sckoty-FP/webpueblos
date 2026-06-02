"use client";

import Image from "next/image";
import Link from "next/link";
import type { RutaDB } from "@/types";
import { usePuebloSlug } from "@/lib/hooks/usePuebloSlug";

const TIPO_DISPLAY: Record<string, string> = {
  senderismo: "Senderismo", ciclismo: "Ciclismo", btt: "BTT", kayak: "Kayak", coche: "Coche",
};

const TIPO_COLOR: Record<string, string> = {
  senderismo: "#059669", ciclismo: "#0070cc", btt: "#ea580c", kayak: "#0891b2", coche: "#6b7280",
};

const TIPO_GRAD: Record<string, string> = {
  senderismo: "linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)",
  ciclismo:   "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)",
  btt:        "linear-gradient(135deg, #7c2d12 0%, #b45309 50%, #d97706 100%)",
  kayak:      "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #22d3ee 100%)",
  coche:      "linear-gradient(135deg, #374151 0%, #6b7280 50%, #9ca3af 100%)",
};

const DIFICULTAD_DISPLAY: Record<string, string> = {
  facil: "Fácil", moderada: "Moderada", dificil: "Difícil", muy_dificil: "Muy difícil",
};

const LEVEL_COLOR: Record<string, string> = {
  Fácil: "#059669", Moderada: "#d97706", Difícil: "#dc2626", "Muy difícil": "#7c3aed",
};
const LEVEL_BG: Record<string, string> = {
  Fácil: "#ecfdf5", Moderada: "#fffbeb", Difícil: "#fef2f2", "Muy difícil": "#f5f3ff",
};

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const NOISE = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function ActividadDetalle({ ruta: r }: { ruta: RutaDB }) {
  const puebloSlug = usePuebloSlug();
  const grad = TIPO_GRAD[r.tipo] ?? "linear-gradient(135deg,#334155,#475569)";
  const cat = TIPO_DISPLAY[r.tipo] ?? r.tipo;
  const catColor = TIPO_COLOR[r.tipo] ?? "#6b7280";
  const nivel = DIFICULTAD_DISPLAY[r.dificultad] ?? r.dificultad;
  const duration = formatDuration(r.duracion_estimada_minutos);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(260px, 42vw, 400px)" }}>
        {r.imagen_principal_url ? (
          <Image src={r.imagen_principal_url} alt={r.nombre} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: grad }} />
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: NOISE, backgroundSize: "200px" }} />
          </>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />

        <div className="absolute top-4 left-4">
          <nav className="flex items-center gap-2">
            <Link href={puebloSlug ? `/${puebloSlug}` : "/"} className="font-barlow text-[12px] text-white/70 hover:text-white no-underline transition-colors">Inicio</Link>
            <span className="text-white/40">/</span>
            <Link href={puebloSlug ? `/${puebloSlug}/actividades` : "/actividades"} className="font-barlow text-[12px] text-white/70 hover:text-white no-underline transition-colors">Actividades</Link>
            <span className="text-white/40">/</span>
            <span className="font-barlow text-[12px] text-white/90 line-clamp-1 max-w-[160px]">{r.nombre}</span>
          </nav>
        </div>

        {r.destacado && (
          <div className="absolute top-4 right-4">
            <span className="font-barlow font-bold text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-pill" style={{ background: "#d53b00", color: "#fff" }}>Destacada</span>
          </div>
        )}

        <div className="absolute bottom-5 left-5 right-5">
          <span className="inline-flex font-barlow font-semibold text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-pill mb-2"
            style={{ background: catColor + "dd", color: "#fff", backdropFilter: "blur(4px)" }}
          >
            {cat}
          </span>
          <h1 className="font-fraunces font-semibold text-white leading-tight" style={{ fontSize: "clamp(22px, 4vw, 34px)" }}>
            {r.nombre}
          </h1>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-7">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left ──────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: "⏱️", label: "Duración", val: duration },
                { icon: "📍", label: "Distancia", val: `${r.distancia_km} km` },
                { icon: "👥", label: "Dificultad", val: nivel },
                { icon: "🔄", label: "Tipo", val: r.circular ? "Circular" : "Lineal" },
              ].map(({ icon, label, val }) => (
                <div key={label} className="bg-white rounded-card border border-divisor px-3 py-3 text-center">
                  <div className="text-[18px] mb-1">{icon}</div>
                  <div className="font-barlow font-bold text-[15px] text-text-body">{val}</div>
                  <div className="font-barlow text-[11px] text-text-muted">{label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-card-lg border border-divisor p-5 mb-5">
              <p className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-3">Descripción</p>
              <p className="font-barlow text-[14px] text-text-body leading-relaxed">{r.descripcion}</p>
            </div>

            {/* Features */}
            <div className="bg-white rounded-card-lg border border-divisor p-5 mb-5">
              <p className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-3">Características</p>
              <div className="grid grid-cols-2 gap-y-2">
                {[
                  { label: "Apto para niños", ok: r.apto_ninos },
                  { label: "Apto para perros", ok: r.apto_perros },
                  { label: "Ruta circular", ok: r.circular },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ok ? "#0070cc" : "#9ca3af"} strokeWidth="2">
                      {ok ? <polyline points="20 6 9 17 4 12"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                    </svg>
                    <span className="font-barlow text-[13px] text-text-body">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Level badge */}
            <div className="rounded-card-lg border p-4 flex items-center gap-4 mb-5"
              style={{ borderColor: LEVEL_COLOR[nivel] ?? "#6b7280", background: LEVEL_BG[nivel] ?? "#f3f4f6" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: (LEVEL_COLOR[nivel] ?? "#6b7280") + "22" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={LEVEL_COLOR[nivel] ?? "#6b7280"} strokeWidth="1.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <p className="font-barlow font-semibold text-[14px]" style={{ color: LEVEL_COLOR[nivel] ?? "#6b7280" }}>
                  Nivel {nivel}
                </p>
                <p className="font-barlow text-[12px] text-text-muted">
                  {r.dificultad === "facil" && "Apta para todos. Sin experiencia previa necesaria."}
                  {r.dificultad === "moderada" && "Requiere algo de forma física. Pausas disponibles."}
                  {r.dificultad === "dificil" && "Para personas con experiencia y buena condición física."}
                  {r.dificultad === "muy_dificil" && "Solo para expertos con excelente condición física."}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: Info widget ─────────────────────────────────────── */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-card-lg border border-divisor p-5 sticky top-20" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 24px" }}>
              <p className="font-fraunces font-semibold text-[28px] text-accent-warm leading-none mb-0.5">{duration}</p>
              <p className="font-barlow text-[12px] text-text-muted mb-4">{r.distancia_km} km · {cat}</p>

              <div className="flex flex-col gap-1.5 mb-5 text-[13px]">
                {[
                  { label: "Tipo", val: cat },
                  { label: "Dificultad", val: nivel },
                  { label: "Distancia", val: `${r.distancia_km} km` },
                  { label: "Duración", val: duration },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-divisor last:border-0">
                    <span className="font-barlow text-text-muted">{label}</span>
                    <span className="font-barlow font-semibold text-text-body">{val}</span>
                  </div>
                ))}
              </div>

              <div className="w-full text-center bg-fog rounded-pill py-3.5 mb-2.5">
                <span className="font-barlow font-semibold text-[14px] text-text-muted">Acceso libre · Sin reserva</span>
              </div>

              <div className="mt-4 pt-4 border-t border-divisor flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span className="font-barlow text-[12px] text-text-muted">Verificado por PUEBLO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
