import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClasificadosListado from "@/components/sections/clasificados/ClasificadosListado";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getClasificados } from "@/lib/supabase/queries/contenido";

export const revalidate = 300;

interface Props {
  params: Promise<{ pueblo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slugParam } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  return {
    title: `Clasificados en ${pueblo.nombre}`,
    description: `Compra, venta, alquiler y más en ${pueblo.nombre}.`,
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/clasificados` },
  };
}

export default async function ClasificadosPage({ params }: Props) {
  const { pueblo: slugParam } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) notFound();

  const clasificados = await getClasificados(pueblo.id);

  return (
    <div className="min-h-screen bg-fog">
      {/* Hero */}
      <div className="pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="container-app">
          <p className="font-fraunces text-xs font-medium uppercase tracking-[0.18em] text-accent-warm mb-3">
            Clasificados
          </p>
          <h1
            className="font-fraunces font-semibold text-text-body mb-4 leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            Cosas del pueblo.
          </h1>
          <p className="font-barlow text-base md:text-lg text-text-muted max-w-xl leading-relaxed">
            Compra, venta, alquiler y regala. Trato directo, entre vecinos.
          </p>
        </div>
      </div>

      <ClasificadosListado
        clasificados={clasificados}
        puebloSlug={pueblo.slug}
        puebloNombre={pueblo.nombre}
      />
    </div>
  );
}
