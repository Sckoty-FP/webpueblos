import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getRestauranteCompleto } from "@/lib/supabase/queries/pueblo-home";

export const revalidate = 3600;
import RestauranteDetalle from "@/components/pueblo/gastronomia/RestauranteDetalle";
import JsonLd from "@/components/seo/JsonLd";

interface Props {
  params: Promise<{ pueblo: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: puebloSlug, slug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  const result = await getRestauranteCompleto(pueblo.id, slug);
  if (!result) return { title: "Restaurante no encontrado" };
  const { prestador } = result;
  return {
    title: `${prestador.nombre} · ${pueblo.nombre}`,
    description: prestador.descripcion_corta ?? `Restaurante en ${pueblo.nombre}. Carta digital y delivery si está disponible.`,
    openGraph: {
      title: prestador.nombre,
      description: prestador.descripcion_corta ?? "",
      type: "website",
      images: prestador.imagen_portada_url ? [{ url: prestador.imagen_portada_url }] : undefined,
    },
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/gastronomia/${slug}` },
  };
}

export default async function RestaurantePage({ params }: Props) {
  const { pueblo: puebloSlug, slug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();

  const result = await getRestauranteCompleto(pueblo.id, slug);
  if (!result) notFound();

  const { prestador, platos } = result;

  return (
    <>
      <RestauranteDetalle puebloSlug={pueblo.slug} prestador={prestador} platos={platos} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: prestador.nombre,
          image: prestador.imagen_portada_url,
          url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}/gastronomia/${prestador.slug}`,
          telephone: prestador.telefono,
          address: {
            "@type": "PostalAddress",
            streetAddress: prestador.direccion,
            addressLocality: pueblo.nombre,
            addressRegion: pueblo.provincia,
            addressCountry: "ES",
          },
          servesCuisine: prestador.tipo_cocina,
          aggregateRating:
            prestador.rating_promedio > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: prestador.rating_promedio,
                  reviewCount: prestador.total_reviews,
                }
              : undefined,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app" },
            { "@type": "ListItem", position: 2, name: pueblo.nombre, item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}` },
            { "@type": "ListItem", position: 3, name: "Gastronomía", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}/gastronomia` },
            { "@type": "ListItem", position: 4, name: prestador.nombre },
          ],
        }}
      />
    </>
  );
}
