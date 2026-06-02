"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ActividadPublica } from "@/lib/supabase/queries/pueblo-home";

const TIPOS_RECURSO = [
  { value: "",              label: "Todas" },
  { value: "bici",          label: "Bicis" },
  { value: "kayak",         label: "Kayak" },
  { value: "moto_agua",     label: "Moto agua" },
  { value: "paddle_surf",   label: "Paddle" },
  { value: "barco",         label: "Barco" },
  { value: "snorkel",       label: "Snorkel" },
  { value: "escalada",      label: "Escalada" },
  { value: "ruta_guiada",   label: "Tours" },
  { value: "experiencia",   label: "Experiencias" },
];

function getTipoLabel(value: string) {
  return TIPOS_RECURSO.find(x => x.value === value)?.label ?? value;
}

interface Props {
  puebloSlug: string;
  items: ActividadPublica[];
  filtrosIniciales: { tipo?: string };
}

export default function ActividadesListado({ puebloSlug, items, filtrosIniciales }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const [tipo, setTipo] = useState(filtrosIniciales.tipo ?? "");

  function updateTipo(t: string) {
    setTipo(t);
    const params = new URLSearchParams();
    if (t) params.set("tipo", t);
    router.push(`${pathname}${params.size ? "?" + params.toString() : ""}`);
  }

  return (
    <>
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-fog border-b border-[#ebeef2] py-4">
        <div className="container-app">
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {TIPOS_RECURSO.map(t => {
              const active = tipo === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => updateTipo(t.value)}
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
        </div>
      </div>

      {/* Grid */}
      <div className="container-app py-8 md:py-10">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-fraunces text-2xl text-text-muted mb-2">Ninguna actividad</p>
            <p className="font-barlow text-base text-text-muted">Probá con otra categoría.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map(a => {
              const tipoLabel = a.tipos_recursos[0] ? getTipoLabel(a.tipos_recursos[0]) : null;
              return (
                <Link
                  key={a.prestador_id}
                  href={`/${puebloSlug}/actividades/${a.prestador_id}`}
                  className="group block bg-white rounded-[19px] overflow-hidden border border-[#f0f0f0] hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-200 no-underline"
                >
                  <div className="relative aspect-[4/3] bg-fog overflow-hidden">
                    {a.imagen ? (
                      <Image
                        src={a.imagen}
                        alt={a.nombre}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 photo-surf" />
                    )}
                    {tipoLabel && (
                      <span className="absolute top-2.5 left-2.5 font-barlow text-[10px] font-semibold uppercase tracking-wide text-white px-2 py-0.5 rounded-pill bg-surface-dark/75 backdrop-blur-sm">
                        {tipoLabel}
                      </span>
                    )}
                  </div>

                  <div className="px-[18px] py-4">
                    <h3 className="font-fraunces text-[17px] font-semibold text-text-body line-clamp-1 mb-2">
                      {a.nombre}
                    </h3>
                    <div className="flex items-center justify-between">
                      {a.precio_desde ? (
                        <span className="font-fraunces text-sm font-semibold text-text-body">
                          desde €{a.precio_desde}
                        </span>
                      ) : (
                        <span className="font-barlow text-[11px] text-text-muted uppercase tracking-[0.6px]">
                          Consultar precio
                        </span>
                      )}
                      <ArrowRight
                        size={14}
                        strokeWidth={2}
                        className="text-primary transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
