import Link from "next/link";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import BusinessCard from "@/components/ui/BusinessCard";
import EmptyState from "@/components/ui/EmptyState";
import type { PrestadorCard } from "@/types";

interface Props {
  puebloSlug: string;
  items: Array<PrestadorCard & { deliveryActivo?: boolean }>;
}

export default function PreviewGastronomia({ puebloSlug, items }: Props) {
  const hrefBase = `/${puebloSlug}/gastronomia`;

  return (
    <section id="gastronomia" className="bg-fog py-20 md:py-24">
      <div className="container-app">
        <SectionHeader
          eyebrow="Gastronomía"
          title="Dónde comer"
          subtitle="Restaurantes, bares y cafeterías con carta digital."
          cta={{ label: "Ver todos", href: hrefBase }}
          variant="light"
        />

        {items.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="Aún no hay establecimientos"
            description="Los primeros restaurantes y bares del pueblo están llegando."
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
                showDeliveryBadge
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
              Ver todos los restaurantes
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
