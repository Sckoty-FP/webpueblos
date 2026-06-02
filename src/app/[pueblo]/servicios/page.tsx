import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getPrestadoresServicios } from "@/lib/supabase/queries/pueblo-home";
import ServiciosListado from "@/components/pueblo/servicios/ServiciosListado";

export const revalidate = 3600;

interface Props {
  params: Promise<{ pueblo: string }>;
  searchParams: Promise<{ categoria?: string; q?: string; abierto?: string; reserva?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slug } = await params;
  const pueblo = await getPuebloBySlug(slug);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  return {
    title: `Servicios en ${pueblo.nombre}`,
    description: `Peluquería, estética, hospedaje, comercio y profesionales en ${pueblo.nombre}.`,
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/servicios` },
  };
}

export default async function ServiciosPage({ params, searchParams }: Props) {
  const { pueblo: puebloSlug } = await params;
  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();

  const filtros = await searchParams;
  const items = await getPrestadoresServicios(pueblo.id, {
    categoria: filtros.categoria,
    abiertoAhora: filtros.abierto === "true",
    conReserva: filtros.reserva === "true",
    busqueda: filtros.q,
  });

  return (
    <div className="min-h-screen bg-fog">
      {/* Hero */}
      <div className="pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="container-app">
          <p className="font-fraunces text-xs font-medium uppercase tracking-[0.18em] text-accent-warm mb-3">
            Servicios
          </p>
          <h1
            className="font-fraunces font-semibold text-text-body mb-4 leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            Todo lo que necesitás en {pueblo.nombre}.
          </h1>
          <p className="font-barlow text-base md:text-lg text-text-muted max-w-xl leading-relaxed">
            Peluquerías, hospedajes, profesionales y comercios — el día a día del pueblo, ordenado.
          </p>
        </div>
      </div>

      {/* Filters + listado */}
      <ServiciosListado
        puebloSlug={pueblo.slug}
        items={items}
        filtrosIniciales={filtros}
      />
    </div>
  );
}
