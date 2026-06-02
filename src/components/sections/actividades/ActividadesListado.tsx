"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePuebloSlug } from "@/lib/hooks/usePuebloSlug";
import type { RutaDB } from "@/types";

/* ─── Mapping helpers ────────────────────────────────────────────────────────── */
const TIPO_DISPLAY: Record<string, string> = {
  senderismo: "Senderismo",
  ciclismo:   "Ciclismo",
  btt:        "BTT",
  kayak:      "Kayak",
  coche:      "Coche",
};

const TIPO_COLOR: Record<string, string> = {
  senderismo: "#059669",
  ciclismo:   "#0070cc",
  btt:        "#ea580c",
  kayak:      "#0891b2",
  coche:      "#6b7280",
};

const TIPO_GRAD: Record<string, string> = {
  senderismo: "linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)",
  ciclismo:   "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)",
  btt:        "linear-gradient(135deg, #7c2d12 0%, #b45309 50%, #d97706 100%)",
  kayak:      "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #22d3ee 100%)",
  coche:      "linear-gradient(135deg, #374151 0%, #6b7280 50%, #9ca3af 100%)",
};

const DIFICULTAD_DISPLAY: Record<string, string> = {
  facil:      "Fácil",
  moderada:   "Moderada",
  dificil:    "Difícil",
  muy_dificil:"Muy difícil",
};

const LEVEL_COLOR: Record<string, string> = {
  Fácil:       "#059669",
  Moderada:    "#d97706",
  Difícil:     "#dc2626",
  "Muy difícil":"#7c3aed",
};

const LEVEL_BG: Record<string, string> = {
  Fácil:       "#ecfdf5",
  Moderada:    "#fffbeb",
  Difícil:     "#fef2f2",
  "Muy difícil":"#f5f3ff",
};

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ─── Card ───────────────────────────────────────────────────────────────────── */
function RutaCard({ ruta, featured = false }: { ruta: RutaDB; featured?: boolean }) {
  const puebloSlug = usePuebloSlug();
  const grad = TIPO_GRAD[ruta.tipo] ?? "linear-gradient(135deg,#334155,#475569)";
  const cat = TIPO_DISPLAY[ruta.tipo] ?? ruta.tipo;
  const catColor = TIPO_COLOR[ruta.tipo] ?? "#6b7280";
  const nivel = DIFICULTAD_DISPLAY[ruta.dificultad] ?? ruta.dificultad;

  return (
    <Link
      href={puebloSlug ? `/${puebloSlug}/actividades/${ruta.id}` : `/actividades/${ruta.id}`}
      className="group block rounded-card-lg overflow-hidden bg-white border border-divisor no-underline"
      style={{
        boxShadow: featured ? "rgba(0,0,0,0.10) 0px 8px 24px" : "rgba(0,0,0,0.05) 0px 2px 8px",
        transition: "box-shadow 200ms, transform 200ms",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "rgba(0,0,0,0.14) 0px 12px 32px"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = featured ? "rgba(0,0,0,0.10) 0px 8px 24px" : "rgba(0,0,0,0.05) 0px 2px 8px"; e.currentTarget.style.transform = ""; }}
    >
      {/* Photo */}
      <div className="relative overflow-hidden" style={{ height: featured ? 240 : 180 }}>
        {ruta.imagen_principal_url ? (
          <Image src={ruta.imagen_principal_url} alt={ruta.nombre} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
        ) : (
          <>
            <div className="w-full h-full" style={{ background: grad }} />
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "200px" }} />
          </>
        )}
        {featured && ruta.destacado && (
          <div className="absolute top-4 right-4">
            <div className="font-barlow font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-pill" style={{ background: "#d53b00", color: "#fff" }}>
              Destacada
            </div>
          </div>
        )}
        <div className="absolute bottom-3 left-3">
          <span className="font-barlow font-semibold text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-pill" style={{ background: catColor + "ee", color: "#fff", backdropFilter: "blur(4px)" }}>
            {cat}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className="font-fraunces font-semibold text-text-body mb-2 leading-snug group-hover:text-primary transition-colors"
          style={{ fontSize: featured ? 20 : 17 }}
        >
          {ruta.nombre}
        </h3>
        <p className="font-barlow text-[13px] text-text-muted leading-relaxed mb-3 line-clamp-2">
          {ruta.descripcion_corta ?? ruta.descripcion}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className="font-barlow font-semibold text-[11px] px-2 py-0.5 rounded-input"
            style={{ color: LEVEL_COLOR[nivel] ?? "#6b6b6b", background: LEVEL_BG[nivel] ?? "#f3f4f6" }}
          >
            {nivel}
          </span>
          <span className="flex items-center gap-1 font-barlow text-[12px] text-text-muted bg-fog px-2 py-0.5 rounded-input">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {formatDuration(ruta.duracion_estimada_minutos)}
          </span>
          <span className="flex items-center gap-1 font-barlow text-[12px] text-text-muted bg-fog px-2 py-0.5 rounded-input">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            {ruta.distancia_km} km
          </span>
          {ruta.circular && (
            <span className="font-barlow text-[11px] text-text-muted bg-fog px-2 py-0.5 rounded-input">Circular</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-divisor">
          <div className="flex items-center gap-2">
            {ruta.apto_ninos && (
              <span className="font-barlow text-[11px] text-text-muted">👶 Niños</span>
            )}
            {ruta.apto_perros && (
              <span className="font-barlow text-[11px] text-text-muted">🐕 Perros</span>
            )}
          </div>
          <span className="font-barlow font-semibold text-[12px] text-primary">Ver ruta →</span>
        </div>
      </div>
    </Link>
  );
}

/* ─── ActividadesListado ─────────────────────────────────────────────────────── */
export default function ActividadesListado({
  rutas,
  puebloNombre,
}: {
  rutas: RutaDB[];
  puebloNombre: string;
}) {
  const [cat, setCat] = useState<string>("Todas");
  const [level, setLevel] = useState<string>("Todos");

  const tiposDisponibles = Array.from(new Set(rutas.map(r => TIPO_DISPLAY[r.tipo] ?? r.tipo)));
  const categorias = ["Todas", ...tiposDisponibles];

  const filtered = rutas.filter((r) => {
    const matchCat = cat === "Todas" || (TIPO_DISPLAY[r.tipo] ?? r.tipo) === cat;
    const nivel = DIFICULTAD_DISPLAY[r.dificultad] ?? r.dificultad;
    const matchLevel = level === "Todos" || nivel === level;
    return matchCat && matchLevel;
  });

  const featured = filtered.filter((r) => r.destacado);
  const rest = filtered.filter((r) => !r.destacado);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative px-4 py-12 sm:py-16"
        style={{ background: "linear-gradient(135deg, #0a2540 0%, #0070cc 100%)" }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: "#fff", transform: "translate(30%, -30%)" }} />
        <div className="max-w-3xl mx-auto relative">
          <h1 className="font-fraunces font-semibold text-white leading-tight mb-2" style={{ fontSize: "clamp(28px, 5vw, 42px)" }}>
            Actividades en {puebloNombre}
          </h1>
          <p className="font-barlow text-white/70 text-[15px] max-w-lg">
            Senderismo, deportes acuáticos, tours y más. Explorá el entorno natural.
          </p>
          <div className="flex gap-5 mt-6">
            {[
              { n: rutas.length, label: "rutas y actividades" },
              { n: rutas.filter(r => r.dificultad === "facil").length, label: "fáciles" },
              { n: rutas.filter(r => r.destacado).length, label: "destacadas" },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="font-fraunces font-semibold text-white text-[24px] leading-none">{n}</div>
                <div className="font-barlow text-white/60 text-[12px]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky Filters ────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 bg-white/95 border-b border-divisor" style={{ backdropFilter: "blur(12px)" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="flex-shrink-0 font-barlow font-medium text-[13px] px-3.5 py-1.5 rounded-pill border transition-all duration-150 cursor-pointer"
              style={{
                background: cat === c ? "#0070cc" : "#fff",
                color: cat === c ? "#fff" : "#374151",
                borderColor: cat === c ? "#0070cc" : "#e5e7eb",
              }}
            >
              {c}
            </button>
          ))}
          <div className="h-5 w-px bg-divisor flex-shrink-0 mx-1" />
          {(["Todos", "Fácil", "Moderada", "Difícil", "Muy difícil"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className="flex-shrink-0 font-barlow font-medium text-[13px] px-3 py-1.5 rounded-pill border transition-all duration-150 cursor-pointer"
              style={{
                background: level === l ? (l === "Todos" ? "#1f1f1f" : LEVEL_BG[l] ?? "#f3f4f6") : "#fff",
                color: level === l ? (l === "Todos" ? "#fff" : LEVEL_COLOR[l] ?? "#374151") : "#6b6b6b",
                borderColor: level === l ? (l === "Todos" ? "#1f1f1f" : LEVEL_COLOR[l] ?? "#374151") : "#e5e7eb",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-barlow font-semibold text-[17px] text-text-body mb-2">Sin resultados</p>
            <p className="font-barlow text-text-muted text-[14px] mb-5">
              {rutas.length === 0 ? "Todavía no hay rutas en este pueblo." : "Probá con otro filtro."}
            </p>
            {rutas.length > 0 && (
              <button
                onClick={() => { setCat("Todas"); setLevel("Todos"); }}
                className="font-barlow font-semibold text-[14px] text-primary border-2 border-primary rounded-pill px-5 py-2 cursor-pointer bg-white hover:bg-fog transition-colors"
              >
                Ver todas
              </button>
            )}
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="mb-6">
                <p className="font-barlow text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3">Destacadas</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {featured.map((r) => <RutaCard key={r.id} ruta={r} featured />)}
                </div>
              </div>
            )}
            {rest.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <p className="font-barlow text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3">Todas las actividades</p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {rest.map((r) => <RutaCard key={r.id} ruta={r} />)}
                </div>
              </div>
            )}
            <p className="font-barlow text-[13px] text-text-muted text-center mt-8">
              {filtered.length} actividad{filtered.length !== 1 ? "es" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
            </p>
          </>
        )}

        <div
          className="mt-10 rounded-card-lg px-6 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #0a2540 0%, #0070cc 100%)" }}
        >
          <div>
            <p className="font-fraunces font-semibold text-white text-[18px] mb-1">¿Organizás actividades?</p>
            <p className="font-barlow text-white/70 text-[13px]">Publicá tu oferta en PUEBLO y llegá a miles de turistas.</p>
          </div>
          <button className="flex-shrink-0 font-barlow font-bold text-[14px] bg-white text-primary rounded-pill px-5 py-2.5 cursor-pointer hover:bg-fog transition-colors">
            Registrar actividad
          </button>
        </div>
      </div>
    </>
  );
}
