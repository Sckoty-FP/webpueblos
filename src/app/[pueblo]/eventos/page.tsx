import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getEventos } from "@/lib/supabase/queries/eventos";
import EventosListado from "@/components/pueblo/eventos/EventosListado";

export const revalidate = 1800;

interface Props {
  params: Promise<{ pueblo: string }>;
  searchParams: Promise<{ categoria?: string; cuando?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slugParam } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  return {
    title: `Eventos en ${pueblo.nombre}`,
    description: `Descubrí todos los eventos y actividades en ${pueblo.nombre}.`,
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/eventos` },
  };
}

export default async function EventosPage({ params, searchParams }: Props) {
  const { pueblo: slugParam } = await params;
  const { categoria, cuando } = await searchParams;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) notFound();

  const eventos = await getEventos(pueblo.id, {
    categoria: categoria || undefined,
    cuando: cuando || undefined,
  });

  return (
    <div className="min-h-screen bg-fog">
      {/* Hero */}
      <div className="pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="container-app">
          <p className="font-fraunces text-xs font-medium uppercase tracking-[0.18em] text-accent-warm mb-3">
            Eventos
          </p>
          <h1
            className="font-fraunces font-semibold text-text-body mb-4 leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            Qué pasa en {pueblo.nombre}.
          </h1>
          <p className="font-barlow text-base md:text-lg text-text-muted max-w-xl leading-relaxed">
            Agenda de fiestas, conciertos, mercados y actividades culturales del pueblo.
          </p>
        </div>
      </div>

      <EventosListado
        eventos={eventos}
        puebloSlug={pueblo.slug}
        categoria={categoria ?? ""}
        cuando={cuando ?? ""}
      />
    </div>
  );
}
