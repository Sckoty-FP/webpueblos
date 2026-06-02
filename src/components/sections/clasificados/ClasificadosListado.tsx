"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ClasificadoDB } from "@/types";

const TIPO_DISPLAY: Record<string, string> = {
  venta:    "Venta",
  alquiler: "Alquiler",
  busco:    "Busco",
  regalo:   "Regalo",
  servicio: "Servicio",
};

const TIPO_COLOR: Record<string, string> = {
  venta:    "#0070cc",
  alquiler: "#14a06b",
  busco:    "#7c3aed",
  regalo:   "#d97706",
  servicio: "#B8956A",
};

const CAT_GRADS: Record<string, string> = {
  inmobiliaria: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 60%, #7dd3fc 100%)",
  vehiculos:    "linear-gradient(135deg, #1e293b 0%, #334155 60%, #94a3b8 100%)",
  electronica:  "linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #c4b5fd 100%)",
  hogar:        "linear-gradient(135deg, #064e3b 0%, #059669 60%, #6ee7b7 100%)",
  moda:         "linear-gradient(135deg, #831843 0%, #db2777 60%, #f9a8d4 100%)",
  deporte:      "linear-gradient(135deg, #7c2d12 0%, #ea580c 60%, #fdba74 100%)",
  trabajo:      "linear-gradient(135deg, #134e4a 0%, #0d9488 60%, #5eead4 100%)",
  servicios:    "linear-gradient(135deg, #713f12 0%, #ca8a04 60%, #fde68a 100%)",
  otros:        "linear-gradient(135deg, #374151 0%, #6b7280 60%, #d1d5db 100%)",
};

function formatPrecio(precio: number | null, moneda: string, tipo: string): string {
  if (!precio) return "A consultar";
  const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda ?? "EUR", maximumFractionDigits: 0 });
  return tipo === "alquiler" ? `${fmt.format(precio)}/mes` : fmt.format(precio);
}

function ClasificadoCard({ c, puebloSlug }: { c: ClasificadoDB; puebloSlug: string }) {
  const grad = CAT_GRADS[c.categoria] ?? "linear-gradient(135deg,#334155,#475569)";
  const tipoColor = TIPO_COLOR[c.tipo] ?? "#6b6b6b";

  return (
    <Link
      href={`/${puebloSlug}/clasificados/${c.id}`}
      className="group block bg-white rounded-[19px] overflow-hidden border border-[#f0f0f0] hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-200 no-underline"
    >
      {/* Image / gradient — portrait 4:5 */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
        {c.imagenes_urls?.length > 0 ? (
          <Image src={c.imagenes_urls[0]} alt={c.titulo} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <>
            <div className="w-full h-full" style={{ background: grad }} />
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                backgroundSize: "200px",
              }}
            />
          </>
        )}

        {/* Tipo badge */}
        <span
          className="absolute top-2.5 left-2.5 font-barlow text-[10px] font-bold uppercase tracking-wide text-white px-2 py-0.5 rounded-pill backdrop-blur-sm"
          style={{ background: tipoColor + "cc" }}
        >
          {TIPO_DISPLAY[c.tipo] ?? c.tipo}
        </span>

        {c.destacado && (
          <span className="absolute top-2.5 right-2.5 font-barlow text-[10px] font-semibold text-white px-2 py-0.5 rounded-pill" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
            Destacado
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-[14px] py-3.5">
        <h3 className="font-fraunces text-sm font-semibold text-text-body line-clamp-2 leading-snug mb-1.5">
          {c.titulo}
        </h3>
        <p
          className="font-fraunces text-base font-bold"
          style={{ color: tipoColor }}
        >
          {formatPrecio(c.precio, c.moneda, c.tipo)}
        </p>
      </div>
    </Link>
  );
}

const TIPOS = ["todos", "venta", "alquiler", "busco", "regalo", "servicio"] as const;

export default function ClasificadosListado({
  clasificados,
  puebloSlug,
  puebloNombre: _puebloNombre,
}: {
  clasificados: ClasificadoDB[];
  puebloSlug: string;
  puebloNombre: string;
}) {
  const [tipo, setTipo] = useState<string>("todos");

  const filtered = clasificados.filter((c) => tipo === "todos" || c.tipo === tipo);

  return (
    <>
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-fog border-b border-[#ebeef2] py-4">
        <div className="container-app">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {TIPOS.map(t => {
              const active = tipo === t;
              return (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-shrink-0 inline-flex items-center px-3.5 py-[7px] rounded-pill border font-barlow text-[13px] font-medium whitespace-nowrap transition-all duration-150 ${
                    active
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-[#e5e7eb] text-text-body hover:border-text-body"
                  }`}
                >
                  {t === "todos" ? "Todos" : TIPO_DISPLAY[t]}
                </button>
              );
            })}

            <span className="ml-auto font-barlow text-sm text-text-muted self-center shrink-0 pl-4">
              {filtered.length} {filtered.length === 1 ? "anuncio" : "anuncios"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container-app py-8 md:py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-fraunces text-2xl text-text-muted mb-2">Sin anuncios</p>
            <p className="font-barlow text-base text-text-muted">
              {clasificados.length === 0
                ? "Todavía no hay clasificados en este pueblo."
                : "Probá con otro filtro."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((c) => (
              <ClasificadoCard key={c.id} c={c} puebloSlug={puebloSlug} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
