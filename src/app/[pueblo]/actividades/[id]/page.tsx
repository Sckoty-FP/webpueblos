import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getActividadCompleta } from "@/lib/supabase/queries/pueblo-home";

export const revalidate = 3600;
import ActividadDetalleNuevo from "@/components/pueblo/actividades/ActividadDetalleNuevo";
import JsonLd from "@/components/seo/JsonLd";

interface Props {
  params: Promise<{ pueblo: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: puebloSlug, id } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  const actividad = await getActividadCompleta(id);
  if (!actividad) return { title: "Actividad no encontrada" };
  return {
    title: `${actividad.nombre} · ${pueblo.nombre}`,
    description: actividad.descripcion_corta ?? `Actividad en ${pueblo.nombre}`,
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/actividades/${id}` },
  };
}

export default async function ActividadPage({ params }: Props) {
  const { pueblo: puebloSlug, id } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();
  const actividad = await getActividadCompleta(id);
  if (!actividad || actividad.pueblo_id !== pueblo.id) notFound();

  const touristLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: actividad.nombre,
    description: actividad.descripcion_corta ?? actividad.descripcion ?? undefined,
    image: actividad.imagen_portada_url ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: pueblo.nombre,
      addressRegion: pueblo.provincia,
      addressCountry: "ES",
    },
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}/actividades/${id}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app" },
      { "@type": "ListItem", position: 2, name: pueblo.nombre, item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}` },
      { "@type": "ListItem", position: 3, name: "Actividades", item: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app"}/${pueblo.slug}/actividades` },
      { "@type": "ListItem", position: 4, name: actividad.nombre },
    ],
  };

  return (
    <>
      <ActividadDetalleNuevo actividad={actividad} puebloSlug={pueblo.slug} />
      <JsonLd data={touristLd} />
      <JsonLd data={breadcrumbLd} />
    </>
  );
}
