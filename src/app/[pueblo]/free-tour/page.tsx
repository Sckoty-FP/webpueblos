import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getToursPublicosPorPueblo } from "@/lib/supabase/queries/free-tour";
import FreeToursListado from "@/components/pueblo/free-tour/FreeToursListado";

export const revalidate = 3600;

interface Props {
  params: Promise<{ pueblo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slug } = await params;
  const pueblo = await getPuebloBySlug(slug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  return {
    title: `Free Tours en ${pueblo.nombre}`,
    description: `Free tours guiados gratuitos en ${pueblo.nombre}. Reservá tu plaza.`,
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/free-tour` },
  };
}

export default async function FreeTourListadoPage({ params }: Props) {
  const { pueblo: puebloSlug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();
  const tours = await getToursPublicosPorPueblo(pueblo.id);

  return (
    <div className="min-h-screen bg-fog">
      {/* Dark hero */}
      <div className="bg-surface-dark pt-12 pb-14 md:pt-16 md:pb-16">
        <div className="container-app">
          <p className="font-fraunces text-xs font-medium uppercase tracking-[0.18em] text-accent-warm mb-3">
            Free Tours
          </p>
          <h1
            className="font-fraunces font-semibold text-white mb-4 leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            Conocé {pueblo.nombre} con vecinos.
          </h1>
          <p className="font-barlow text-base md:text-lg text-white/60 max-w-xl leading-relaxed">
            Tours gratis con guías del pueblo. Pagás la propina que te parezca al final. Sin cuotas ocultas.
          </p>
        </div>
      </div>

      {/* Listado */}
      <div className="bg-fog">
        <FreeToursListado puebloSlug={pueblo.slug} tours={tours} />
      </div>
    </div>
  );
}
