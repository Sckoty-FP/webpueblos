import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getRutas } from "@/lib/supabase/queries/contenido";
import RutasListado from "@/components/pueblo/rutas/RutasListado";
import SectionHeader from "@/components/ui/SectionHeader";

export const revalidate = 3600;

interface Props {
  params: Promise<{ pueblo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slug } = await params;
  const pueblo = await getPuebloBySlug(slug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  return {
    title: `Rutas en ${pueblo.nombre}`,
    description: `Senderismo, ciclismo y rutas gastronómicas en ${pueblo.nombre}.`,
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/rutas` },
  };
}

export default async function RutasPage({ params }: Props) {
  const { pueblo: puebloSlug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();
  const rutas = await getRutas(pueblo.id);

  return (
    <div className="min-h-screen bg-fog">
      <div className="container-app py-12 md:py-16">
        <SectionHeader
          eyebrow="Rutas"
          title={`Caminá ${pueblo.nombre}`}
          subtitle="Senderismo, ciclismo y descubrimientos gastronómicos."
          variant="light"
        />
        <RutasListado puebloSlug={pueblo.slug} rutas={rutas} />
      </div>
    </div>
  );
}
