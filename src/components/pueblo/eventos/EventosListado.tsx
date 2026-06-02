"use client";

import { useRouter, usePathname } from "next/navigation";
import EventoCard from "./EventoCard";
import type { EventoCard as EventoCardType, CategoriaEvento } from "@/types/eventos";
import { CATEGORIA_EVENTO_LABEL } from "@/types/eventos";

interface Props {
  eventos: EventoCardType[];
  puebloSlug: string;
  categoria?: string;
  cuando?: string;
}

const CUANDO_OPTS = [
  { value: "",        label: "Próximos" },
  { value: "hoy",     label: "Hoy" },
  { value: "semana",  label: "Esta semana" },
  { value: "mes",     label: "Este mes" },
];

const CATEGORIAS: Array<{ value: CategoriaEvento | ""; label: string }> = [
  { value: "", label: "Todas" },
  ...Object.entries(CATEGORIA_EVENTO_LABEL).map(([value, label]) => ({
    value: value as CategoriaEvento,
    label,
  })),
];

export default function EventosListado({ eventos, puebloSlug, categoria = "", cuando = "" }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  function navigate(nextCat: string, nextCuando: string) {
    const params = new URLSearchParams();
    if (nextCat)    params.set("categoria", nextCat);
    if (nextCuando) params.set("cuando", nextCuando);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-fog border-b border-[#ebeef2] py-4">
        <div className="container-app flex flex-col gap-3">
          {/* Cuando row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CUANDO_OPTS.map(opt => {
              const active = cuando === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => navigate(categoria, opt.value)}
                  className={`flex-shrink-0 inline-flex items-center px-3.5 py-[7px] rounded-pill border font-barlow text-[13px] font-medium whitespace-nowrap transition-all duration-150 ${
                    active
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-[#e5e7eb] text-text-body hover:border-text-body"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Categoría row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIAS.map(cat => {
              const active = categoria === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => navigate(cat.value, cuando)}
                  className={`flex-shrink-0 inline-flex items-center px-3 py-[5px] rounded-pill border font-barlow text-[12px] font-medium whitespace-nowrap transition-all duration-150 ${
                    active
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-[#e5e7eb] text-text-body hover:border-text-body"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="container-app py-8 md:py-10">
        {eventos.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-fraunces text-2xl text-text-muted mb-2">Sin eventos</p>
            <p className="font-barlow text-base text-text-muted">
              No hay eventos en este período. Probá con otro filtro.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl flex flex-col gap-3">
            {eventos.map(e => (
              <EventoCard key={e.id} evento={e} puebloSlug={puebloSlug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
