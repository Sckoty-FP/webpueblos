import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EventoCard } from "@/types";
import { CATEGORIA_EVENTO_COLOR } from "@/types";

interface Props {
  puebloSlug: string;
  puebloNombre: string;
  eventos: EventoCard[];
}

export default function PreviewEventos({ puebloSlug, puebloNombre, eventos }: Props) {
  if (eventos.length === 0) return null;

  return (
    <section id="eventos" className="bg-white py-16 md:py-20">
      <div className="container-app">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="font-fraunces text-xs uppercase tracking-[0.18em] text-accent-warm mb-3">
              Agenda
            </p>
            <h2 className="display-section text-text-body">
              Este mes en {puebloNombre}.
            </h2>
          </div>
          <Link
            href={`/${puebloSlug}/eventos`}
            className="font-barlow text-sm text-primary hover:underline no-underline whitespace-nowrap"
          >
            Ver calendario completo →
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {eventos.map(ev => {
            const catColor = CATEGORIA_EVENTO_COLOR[ev.categoria] ?? "#6b7280";
            return (
              <Link
                key={ev.id}
                href={`/${puebloSlug}/eventos/${ev.slug}`}
                className="group grid items-center gap-4 sm:gap-6 bg-white rounded-2xl px-5 py-5 sm:px-6 border border-black/5 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:border-[#0070cc22]"
                style={{ gridTemplateColumns: "80px 1fr auto auto" }}
              >
                <div
                  className="w-16 h-16 rounded-[14px] flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: "#0070cc12", color: "#0070cc" }}
                >
                  <span className="font-fraunces text-[26px] font-semibold leading-none">
                    {ev.diaNumero}
                  </span>
                  <span className="font-barlow text-[10px] font-bold tracking-[1px] mt-0.5">
                    {ev.diaMesAbrev}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="font-fraunces text-[18px] font-semibold text-text-body leading-[1.25] mb-1 line-clamp-1">
                    {ev.titulo}
                  </h3>
                  {ev.descripcionCorta && (
                    <p className="font-barlow text-[13px] text-text-muted line-clamp-1">
                      {ev.descripcionCorta}
                    </p>
                  )}
                </div>

                <span
                  className="font-barlow text-[11px] font-bold uppercase tracking-[0.3px] px-3 py-[5px] rounded-full hidden sm:inline-flex"
                  style={{
                    background: catColor + "18",
                    color: catColor,
                  }}
                >
                  {ev.categoriaLabel}
                </span>

                <ChevronRight
                  size={18}
                  strokeWidth={2}
                  className="text-text-muted transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
