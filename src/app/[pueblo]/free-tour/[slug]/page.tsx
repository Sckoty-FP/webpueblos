import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getTourPublicoPorSlug, getSesionesDisponibles } from "@/lib/supabase/queries/free-tour";

export const revalidate = 3600;
import FreeTourDetalle from "@/components/pueblo/free-tour/FreeTourDetalle";
import JsonLd from "@/components/seo/JsonLd";
import type { FreeTourSesionDB } from "@/types/free-tour";

interface Props {
  params: Promise<{ pueblo: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: puebloSlug, slug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  const tour = await getTourPublicoPorSlug(slug, pueblo.id);
  if (!tour) return { title: "Tour no encontrado" };
  return {
    title: `${tour.titulo} · ${pueblo.nombre}`,
    description: tour.descripcion_corta ?? tour.descripcion.slice(0, 160),
    openGraph: {
      title: tour.titulo,
      description: tour.descripcion_corta ?? "",
      images: tour.imagen_portada_url ? [{ url: tour.imagen_portada_url }] : undefined,
    },
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/free-tour/${slug}` },
  };
}

export default async function FreeTourDetallePage({ params }: Props) {
  const { pueblo: puebloSlug, slug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();
  const tour = await getTourPublicoPorSlug(slug, pueblo.id);
  if (!tour) notFound();
  const sesiones = await getSesionesDisponibles(tour.id);

  return (
    <>
      <FreeTourDetalle pueblo={pueblo} tour={tour} sesiones={sesiones} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            sesiones.slice(0, 5).map((s: FreeTourSesionDB) => ({
              "@context": "https://schema.org",
              "@type": "Event",
              name: tour.titulo,
              startDate: `${s.fecha}T${s.hora}`,
              eventStatus: "https://schema.org/EventScheduled",
              eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
              location: {
                "@type": "Place",
                name: tour.punto_encuentro_nombre ?? pueblo.nombre,
                address: pueblo.nombre,
              },
              organizer: {
                "@type": "Organization",
                name: "PUEBLO",
                url: "https://pueblo.app",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
                availability: "https://schema.org/InStock",
              },
            })),
          ),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app" },
            { "@type": "ListItem", position: 2, name: pueblo.nombre, item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}` },
            { "@type": "ListItem", position: 3, name: "Free Tours", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}/free-tour` },
            { "@type": "ListItem", position: 4, name: tour.titulo },
          ],
        }}
      />
    </>
  );
}
