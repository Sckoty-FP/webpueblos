"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import BusinessCard from "@/components/ui/BusinessCard";
import GastronomiaInlineAd from "@/components/pueblo/gastronomia/GastronomiaInlineAd";
import type { PrestadorCard } from "@/types";

interface Props {
  puebloSlug: string;
  items: PrestadorCard[];
  filtrosIniciales: { tipo?: string; abierto?: string; delivery?: string; q?: string };
}

const TIPOS_COCINA = [
  { value: "",            label: "Todas" },
  { value: "mediterranea",label: "Mediterránea" },
  { value: "espanola",    label: "Española" },
  { value: "italiana",    label: "Italiana" },
  { value: "asiatica",    label: "Asiática" },
  { value: "pizzeria",    label: "Pizzería" },
  { value: "tapas",       label: "Tapas" },
  { value: "vegana",      label: "Vegana" },
];

export default function GastronomiaListado({ puebloSlug, items, filtrosIniciales }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [busqueda, setBusqueda] = useState(filtrosIniciales.q ?? "");
  const [tipo,     setTipo]     = useState(filtrosIniciales.tipo ?? "");
  const [abierto,  setAbierto]  = useState(filtrosIniciales.abierto === "true");
  const [delivery, setDelivery] = useState(filtrosIniciales.delivery === "true");

  function buildUrl(t: string, q: string, ab: boolean, del: boolean) {
    const p = new URLSearchParams();
    if (t)   p.set("tipo", t);
    if (q)   p.set("q", q);
    if (ab)  p.set("abierto", "true");
    if (del) p.set("delivery", "true");
    return `${pathname}${p.size ? "?" + p.toString() : ""}`;
  }

  function push(t = tipo, q = busqueda, ab = abierto, del = delivery) {
    router.push(buildUrl(t, q, ab, del));
  }

  return (
    <>
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-fog border-b border-[#ebeef2] py-4">
        <div className="container-app">
          {/* Tipo chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar mb-3">
            {TIPOS_COCINA.map(t => {
              const active = tipo === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => { setTipo(t.value); push(t.value); }}
                  className={`flex-shrink-0 inline-flex items-center px-3.5 py-[7px] rounded-pill border font-barlow text-[13px] font-medium whitespace-nowrap transition-all duration-150 ${
                    active
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-[#e5e7eb] text-text-body hover:border-text-body"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search + checkboxes + count */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") push(undefined, busqueda); }}
                onBlur={() => push(undefined, busqueda)}
                placeholder="Buscar por nombre…"
                className="w-full pl-9 pr-3 py-[7px] bg-white border border-[#e5e7eb] rounded-pill font-barlow text-sm text-text-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="inline-flex items-center gap-2 font-barlow text-sm text-text-body cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={abierto}
                  onChange={e => { setAbierto(e.target.checked); push(undefined, undefined, e.target.checked); }}
                  className="w-4 h-4 rounded border-[#d1d5db] accent-primary"
                />
                Abierto ahora
              </label>
              <label className="inline-flex items-center gap-2 font-barlow text-sm text-text-body cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={delivery}
                  onChange={e => { setDelivery(e.target.checked); push(undefined, undefined, undefined, e.target.checked); }}
                  className="w-4 h-4 rounded border-[#d1d5db] accent-primary"
                />
                Con delivery
              </label>
            </div>

            <span className="font-barlow text-sm text-text-muted sm:ml-auto shrink-0">
              {items.length} {items.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container-app py-8 md:py-10">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-fraunces text-2xl text-text-muted mb-2">Ningún resultado</p>
            <p className="font-barlow text-base text-text-muted">Probá quitando algún filtro.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.slice(0, 4).map(p => (
              <BusinessCard
                key={p.id}
                prestador={p}
                hrefBase={`/${puebloSlug}/gastronomia`}
                showDeliveryBadge
              />
            ))}

            <GastronomiaInlineAd items={items.slice(0, 3)} puebloSlug={puebloSlug} />

            {items.slice(4).map(p => (
              <BusinessCard
                key={p.id}
                prestador={p}
                hrefBase={`/${puebloSlug}/gastronomia`}
                showDeliveryBadge
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
