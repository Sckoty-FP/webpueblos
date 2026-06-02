import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getActividadesPublicas } from "@/lib/supabase/queries/pueblo-home";
import { getRutas } from "@/lib/supabase/queries/contenido";
import ActividadesListado from "@/components/pueblo/actividades/ActividadesListado";
import RutasBanner from "@/components/pueblo/rutas/RutasBanner";

export const revalidate = 3600;

interface Props {
  params: Promise<{ pueblo: string }>;
  searchParams: Promise<{ tipo?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slug } = await params;
  const pueblo = await getPuebloBySlug(slug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  return {
    title: `Actividades en ${pueblo.nombre}`,
    description: `Alquileres, escuelas náuticas, experiencias y rutas en ${pueblo.nombre}.`,
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/actividades` },
  };
}

export default async function ActividadesPage({ params, searchParams }: Props) {
  const { pueblo: puebloSlug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();
  const filtros = await searchParams;

  const [actividades, rutas] = await Promise.all([
    getActividadesPublicas(pueblo.id, { tipo: filtros.tipo }),
    getRutas(pueblo.id),
  ]);

  return (
    <div className="min-h-screen bg-fog">
      {/* Hero */}
      <div className="pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="container-app">
          <p className="font-fraunces text-xs font-medium uppercase tracking-[0.18em] text-accent-warm mb-3">
            Actividades
          </p>
          <h1
            className="font-fraunces font-semibold text-text-body mb-4 leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            Vivir {pueblo.nombre}.
          </h1>
          <p className="font-barlow text-base md:text-lg text-text-muted max-w-xl leading-relaxed">
            Kayak, bicis, moto de agua y experiencias únicas — el pueblo al aire libre.
          </p>
        </div>
      </div>

      {/* Filters + listado */}
      <ActividadesListado
        puebloSlug={pueblo.slug}
        items={actividades}
        filtrosIniciales={filtros}
      />

      {/* Rutas banner */}
      {rutas.length > 0 && (
        <div className="container-app pb-10">
          <RutasBanner puebloSlug={pueblo.slug} totalRutas={rutas.length} />
        </div>
      )}
    </div>
  );
}
