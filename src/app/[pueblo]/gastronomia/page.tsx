import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getPrestadoresGastronomia } from "@/lib/supabase/queries/pueblo-home";
import GastronomiaListado from "@/components/pueblo/gastronomia/GastronomiaListado";

export const revalidate = 3600;

interface Props {
  params: Promise<{ pueblo: string }>;
  searchParams: Promise<{ tipo?: string; abierto?: string; delivery?: string; q?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slug } = await params;
  const pueblo = await getPuebloBySlug(slug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  return {
    title: `Gastronomía en ${pueblo.nombre}`,
    description: `Restaurantes, bares y cafeterías en ${pueblo.nombre}. Carta digital, reservas y delivery.`,
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/gastronomia` },
  };
}

export default async function GastronomiaPage({ params, searchParams }: Props) {
  const { pueblo: puebloSlug } = await params;
  const filtros = await searchParams;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();

  const items = await getPrestadoresGastronomia(pueblo.id, {
    tipoCocina: filtros.tipo,
    abiertoAhora: filtros.abierto === "true",
    soloDelivery: filtros.delivery === "true",
    busqueda: filtros.q,
  });

  return (
    <div className="min-h-screen bg-fog">
      {/* Hero */}
      <div className="pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="container-app">
          <p className="font-fraunces text-xs font-medium uppercase tracking-[0.18em] text-accent-warm mb-3">
            Gastronomía
          </p>
          <h1
            className="font-fraunces font-semibold text-text-body mb-4 leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            Dónde comer en {pueblo.nombre}.
          </h1>
          <p className="font-barlow text-base md:text-lg text-text-muted max-w-xl leading-relaxed">
            Restaurantes, bares y cafeterías con carta digital. Algunos llevan a domicilio.
          </p>
        </div>
      </div>

      <GastronomiaListado puebloSlug={pueblo.slug} items={items} filtrosIniciales={filtros} />
    </div>
  );
}
