import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import type { ActividadPreview } from "@/types/pueblo-home";

interface Props {
  puebloSlug: string;
  items: ActividadPreview[];
}

export default function PreviewActividades({ puebloSlug, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section id="actividades" className="bg-fog py-20 md:py-24">
      <div className="container-app">
        <SectionHeader
          eyebrow="Actividades"
          title="Qué hacer"
          subtitle="Alquileres, escuelas náuticas y experiencias para reservar online."
          cta={{ label: "Ver todas", href: `/${puebloSlug}/actividades` }}
          variant="light"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.slice(0, 4).map((a) => (
            <Link
              key={a.id}
              href={`/${puebloSlug}/actividades/${a.id}`}
              className="group block bg-white rounded-[19px] overflow-hidden border border-[#f0f0f0] hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-200 no-underline"
            >
              <div className="relative aspect-[4/3] bg-fog overflow-hidden">
                {a.imagenUrl ? (
                  <Image
                    src={a.imagenUrl}
                    alt={a.nombre}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 photo-surf" />
                )}
                {a.tipoRecursoLabel && (
                  <span className="absolute top-2.5 left-2.5 font-barlow text-[10px] font-semibold uppercase tracking-wider bg-surface-dark/75 text-white backdrop-blur-sm px-2 py-0.5 rounded-pill">
                    {a.tipoRecursoLabel}
                  </span>
                )}
              </div>

              <div className="px-[18px] py-4">
                <h3 className="font-fraunces text-[17px] font-semibold text-text-body line-clamp-1 mb-2">
                  {a.nombre}
                </h3>

                <div className="flex items-center justify-between">
                  {a.precioDesdeEur ? (
                    <span className="font-fraunces text-sm font-semibold text-text-body">
                      desde €{a.precioDesdeEur}/h
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
          ))}
        </div>
      </div>
    </section>
  );
}
