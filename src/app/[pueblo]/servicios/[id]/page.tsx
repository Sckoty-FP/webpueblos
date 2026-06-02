import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getPrestadorBySlug } from "@/lib/supabase/queries/prestadores";

export const revalidate = 3600;
import ServicioDetalle from "@/components/pueblo/servicios/ServicioDetalle";
import JsonLd from "@/components/seo/JsonLd";

interface Props {
  params: Promise<{ pueblo: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: puebloSlug, id } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  const prestador = await getPrestadorBySlug(id);
  if (!prestador) return { title: "Servicio no encontrado" };
  return {
    title: `${prestador.nombre} · ${pueblo.nombre}`,
    description: prestador.descripcion_corta ?? `Servicio en ${pueblo.nombre}`,
    openGraph: {
      title: prestador.nombre,
      description: prestador.descripcion_corta ?? "",
      images: prestador.imagen_portada_url ? [{ url: prestador.imagen_portada_url }] : undefined,
    },
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/servicios/${id}` },
  };
}

export default async function ServicioPage({ params }: Props) {
  const { pueblo: puebloSlug, id } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();
  const prestador = await getPrestadorBySlug(id);
  if (!prestador || prestador.pueblo_id !== pueblo.id) notFound();

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app";

  const businessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE}/${pueblo.slug}/servicios/${id}#business`,
    name: prestador.nombre,
    description: prestador.descripcion_corta,
    image: prestador.imagen_portada_url,
    telephone: prestador.telefono,
    url: `${SITE}/${pueblo.slug}/servicios/${id}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: prestador.direccion,
      addressLocality: pueblo.nombre,
      addressRegion: pueblo.provincia,
      addressCountry: "ES",
    },
    aggregateRating:
      prestador.rating_promedio > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: prestador.rating_promedio,
            reviewCount: prestador.total_reviews,
          }
        : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: pueblo.nombre, item: `${SITE}/${pueblo.slug}` },
      { "@type": "ListItem", position: 3, name: "Servicios", item: `${SITE}/${pueblo.slug}/servicios` },
      { "@type": "ListItem", position: 4, name: prestador.nombre },
    ],
  };

  return (
    <>
      <ServicioDetalle prestador={prestador} puebloSlug={pueblo.slug} />
      <JsonLd data={businessLd} />
      <JsonLd data={breadcrumbLd} />
    </>
  );
}
