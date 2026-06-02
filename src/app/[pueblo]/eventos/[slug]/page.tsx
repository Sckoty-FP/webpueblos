import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getEventoBySlug } from "@/lib/supabase/queries/eventos";
import EventoDetalle from "@/components/pueblo/eventos/EventoDetalle";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 3600;

interface Props {
  params: Promise<{ pueblo: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: puebloSlug, slug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  const evento = await getEventoBySlug(pueblo.id, slug);
  if (!evento) return { title: "Evento no encontrado" };
  return {
    title: `${evento.titulo} · ${pueblo.nombre}`,
    description: evento.descripcion_corta ?? evento.descripcion.slice(0, 160),
    openGraph: {
      title: evento.titulo,
      description: evento.descripcion_corta ?? "",
      images: evento.imagen_url ? [{ url: evento.imagen_url }] : undefined,
    },
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/eventos/${slug}` },
  };
}

export default async function EventoDetallePage({ params }: Props) {
  const { pueblo: puebloSlug, slug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();
  const evento = await getEventoBySlug(pueblo.id, slug);
  if (!evento) notFound();

  return (
    <>
      <EventoDetalle evento={evento} puebloNombre={pueblo.nombre} puebloSlug={pueblo.slug} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: evento.titulo,
          startDate: evento.fecha_inicio,
          endDate: evento.fecha_fin ?? undefined,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: evento.lugar ?? pueblo.nombre,
            address: evento.direccion ?? pueblo.nombre,
          },
          organizer: evento.organizador
            ? { "@type": "Organization", name: evento.organizador }
            : { "@type": "Organization", name: "PUEBLO", url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app" },
          offers: {
            "@type": "Offer",
            price: evento.gratis ? "0" : String(evento.precio ?? 0),
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
          },
          image: evento.imagen_url ? [evento.imagen_url] : undefined,
          description: evento.descripcion_corta ?? evento.descripcion.slice(0, 160),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app" },
            { "@type": "ListItem", position: 2, name: pueblo.nombre, item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}` },
            { "@type": "ListItem", position: 3, name: "Eventos", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}/eventos` },
            { "@type": "ListItem", position: 4, name: evento.titulo },
          ],
        }}
      />
    </>
  );
}
