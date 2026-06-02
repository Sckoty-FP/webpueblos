"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import BusinessCard from "@/components/ui/BusinessCard";
import type { PrestadorCard } from "@/types";

interface Props {
  puebloSlug: string;
  items: PrestadorCard[];
  filtrosIniciales: { categoria?: string; q?: string; abierto?: string; reserva?: string };
}

const CATS = [
  { value: "",             label: "Todas",        color: null },
  { value: "peluqueria",   label: "Peluquería",   color: "#8b5cf6" },
  { value: "estetica",     label: "Estética",     color: "#ec4899" },
  { value: "hospedaje",    label: "Hospedaje",    color: "#14b8a6" },
  { value: "servicios_pro",label: "Profesionales",color: "#d97706" },
  { value: "comercio",     label: "Comercio",     color: "#0070cc" },
  { value: "salud",        label: "Salud",        color: "#14a06b" },
  { value: "otros",        label: "Otros",        color: "#6b6b6b" },
];

export default function ServiciosListado({ puebloSlug, items, filtrosIniciales }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [busqueda,  setBusqueda]  = useState(filtrosIniciales.q ?? "");
  const [categoria, setCategoria] = useState(filtrosIniciales.categoria ?? "");
  const [abierto,   setAbierto]   = useState(filtrosIniciales.abierto === "true");
  const [reserva,   setReserva]   = useState(filtrosIniciales.reserva === "true");

  function buildUrl(cat: string, q: string, ab: boolean, res: boolean) {
    const p = new URLSearchParams();
    if (cat) p.set("categoria", cat);
    if (q)   p.set("q", q);
    if (ab)  p.set("abierto", "true");
    if (res) p.set("reserva", "true");
    return `${pathname}${p.size ? "?" + p.toString() : ""}`;
  }

  function setAndPush(
    cat = categoria, q = busqueda, ab = abierto, res = reserva
  ) {
    router.push(buildUrl(cat, q, ab, res));
  }

  return (
    <>
      {/* ── Sticky filter bar ──────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 bg-fog border-b border-[#ebeef2] py-4">
        <div className="container-app">

          {/* Category chips — horizontal scroll on mobile */}
          <div className="relative mb-3">
            <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              {CATS.map(c => {
                const active = categoria === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => {
                      setCategoria(c.value);
                      setAndPush(c.value);
                    }}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-pill border font-barlow text-[13px] font-medium whitespace-nowrap transition-all duration-150 ${
                      active
                        ? "bg-primary border-primary text-white"
                        : "bg-white border-[#e5e7eb] text-text-body hover:border-text-body"
                    }`}
                  >
                    {c.color && !active && (
                      <span
                        className="shrink-0 rounded-full"
                        style={{ width: 7, height: 7, background: c.color }}
                      />
                    )}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search + checkboxes + count ──────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") setAndPush(undefined, busqueda);
                }}
                onBlur={() => setAndPush(undefined, busqueda)}
                placeholder="Buscar por nombre…"
                className="w-full pl-9 pr-3 py-[7px] bg-white border border-[#e5e7eb] rounded-pill font-barlow text-sm text-text-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-4 flex-wrap">
              <label className="inline-flex items-center gap-2 font-barlow text-sm text-text-body cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={abierto}
                  onChange={e => {
                    setAbierto(e.target.checked);
                    setAndPush(undefined, undefined, e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-[#d1d5db] accent-primary"
                />
                Abierto ahora
              </label>
              <label className="inline-flex items-center gap-2 font-barlow text-sm text-text-body cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reserva}
                  onChange={e => {
                    setReserva(e.target.checked);
                    setAndPush(undefined, undefined, undefined, e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-[#d1d5db] accent-primary"
                />
                Con reserva online
              </label>
            </div>

            {/* Result count */}
            <span className="font-barlow text-sm text-text-muted sm:ml-auto shrink-0">
              {items.length} {items.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <div className="container-app py-8 md:py-10">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-fraunces text-2xl text-text-muted mb-2">
              Ningún resultado
            </p>
            <p className="font-barlow text-base text-text-muted">
              Probá quitando algún filtro.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map(p => (
              <BusinessCard
                key={p.id}
                prestador={p}
                hrefBase={`/${puebloSlug}/servicios`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
