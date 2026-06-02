import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import {
  getPrestadoresGastronomia,
  getPrestadoresServicios,
  getActividadesPreview,
  getEventosProximos,
  getDestacadosHome,
} from "@/lib/supabase/queries/pueblo-home";
import { getToursPublicosPorPueblo } from "@/lib/supabase/queries/free-tour";
import { getMuroPosts, getClasificados } from "@/lib/supabase/queries/contenido";

import PuebloHero from "@/components/pueblo/PuebloHero";
import QuickAccess from "@/components/pueblo/QuickAccess";
import BloqueDestacados from "@/components/pueblo/BloqueDestacados";
import PreviewGastronomia from "@/components/pueblo/PreviewGastronomia";
import PreviewServicios from "@/components/pueblo/PreviewServicios";
import PreviewActividades from "@/components/pueblo/PreviewActividades";
import PreviewFreeTour from "@/components/pueblo/PreviewFreeTour";
import PreviewMuro from "@/components/pueblo/PreviewMuro";
import PreviewClasificados from "@/components/pueblo/PreviewClasificados";
import PreviewEventos from "@/components/pueblo/PreviewEventos";
import PremiumCTA from "@/components/ui/PremiumCTA";
import AdSlot from "@/components/ui/AdSlot";

export const revalidate = 3600;

interface Props {
  params: Promise<{ pueblo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slugParam } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) return { title: "Pueblo no encontrado" };

  const title = pueblo.nombre;
  const description =
    pueblo.descripcion_corta ??
    `Descubrí gastronomía, actividades, servicios y muro 24h en ${pueblo.nombre}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es_ES",
      siteName: "PUEBLO",
      images: pueblo.imagen_portada
        ? [{ url: pueblo.imagen_portada, width: 1200, height: 630 }]
        : undefined,
    },
    alternates: {
      canonical: `https://pueblo.app/${pueblo.slug}`,
    },
  };
}

export default async function PuebloHomePage({ params }: Props) {
  const { pueblo: slugParam } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) notFound();

  const [
    destacados,
    gastronomia,
    servicios,
    actividades,
    freeTours,
    muroPosts,
    clasificados,
    eventos,
  ] = await Promise.all([
    getDestacadosHome(pueblo.id),
    getPrestadoresGastronomia(pueblo.id, { limit: 6, shuffle: true }),
    getPrestadoresServicios(pueblo.id, { limit: 6, shuffle: true }),
    getActividadesPreview(pueblo.id, { limit: 4 }),
    getToursPublicosPorPueblo(pueblo.id),
    getMuroPosts(pueblo.id),
    getClasificados(pueblo.id),
    getEventosProximos(pueblo.id, 3),
  ]);

  return (
    <>
      <PuebloHero
        pueblo={pueblo}
        hayDelivery={destacados.hayDelivery}
        stats={{
          negocios: gastronomia.length + servicios.length,
          actividades: actividades.length,
        }}
      />

      <QuickAccess puebloSlug={pueblo.slug} hayDelivery={destacados.hayDelivery} />

      <BloqueDestacados
        puebloSlug={pueblo.slug}
        items={[
          ...gastronomia.slice(0, 3).map(i => ({ ...i, href: `/${pueblo.slug}/gastronomia/${i.slug}` })),
          ...servicios.slice(0, 3).map(i => ({ ...i, href: `/${pueblo.slug}/servicios/${i.slug}` })),
        ].slice(0, 6)}
      />

      <PreviewGastronomia puebloSlug={pueblo.slug} items={gastronomia} />

      <PreviewServicios puebloSlug={pueblo.slug} items={servicios} />

      <PreviewActividades puebloSlug={pueblo.slug} items={actividades} />

      <PreviewFreeTour puebloSlug={pueblo.slug} tours={freeTours.slice(0, 3)} />

      <AdSlot slot="pueblo-home-mid" puebloId={pueblo.id} />

      <PreviewMuro puebloSlug={pueblo.slug} posts={muroPosts.slice(0, 4)} />

      <PreviewClasificados puebloSlug={pueblo.slug} items={clasificados.slice(0, 4)} />

      <PreviewEventos puebloSlug={pueblo.slug} puebloNombre={pueblo.nombre} eventos={eventos} />

      <PremiumCTA puebloSlug={pueblo.slug} />

      <AdSlot slot="pueblo-home-pre-footer" puebloId={pueblo.id} />

      <PuebloJsonLd pueblo={pueblo} />
    </>
  );
}

function PuebloJsonLd({
  pueblo,
}: {
  pueblo: {
    nombre: string;
    nombre_completo: string | null;
    slug: string;
    descripcion_corta: string | null;
  };
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: pueblo.nombre_completo ?? pueblo.nombre,
    url: `https://pueblo.app/${pueblo.slug}`,
    description: pueblo.descripcion_corta ?? `${pueblo.nombre} en PUEBLO`,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
