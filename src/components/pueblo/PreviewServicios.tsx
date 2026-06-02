import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import BusinessCard from "@/components/ui/BusinessCard";
import EmptyState from "@/components/ui/EmptyState";
import type { PrestadorCard } from "@/types";

interface Props {
  puebloSlug: string;
  items: PrestadorCard[];
}

export default function PreviewServicios({ puebloSlug, items }: Props) {
  const hrefBase = `/${puebloSlug}/servicios`;

  return (
    <section id="servicios" className="bg-white py-20 md:py-24">
      <div className="container-app">
        <SectionHeader
          eyebrow="Servicios"
          title="Todo lo que necesitás"
          subtitle="Peluquería, estética, hospedaje, profesionales y más."
          cta={{ label: "Ver todos", href: hrefBase }}
          variant="light"
        />

        {items.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Aún no hay servicios"
            description="Los primeros negocios locales del pueblo están llegando."
            variant="light"
            bordered
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.slice(0, 6).map((p) => (
              <BusinessCard
                key={p.id}
                prestador={p}
                hrefBase={hrefBase}
              />
            ))}
          </div>
        )}

        {items.length > 3 && (
          <div className="mt-8 text-center">
            <Link
              href={hrefBase}
              className="inline-flex items-center gap-1.5 font-barlow font-medium text-sm text-primary hover:text-primary-hover transition-colors no-underline group"
            >
              Ver todos los servicios
              <ArrowRight
                size={14}
                strokeWidth={2}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
