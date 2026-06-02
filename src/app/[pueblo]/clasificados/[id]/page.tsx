import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ClasificadoDetalle from "@/components/sections/clasificados/ClasificadoDetalle";
import { getClasificadoById } from "@/lib/supabase/queries/contenido";

interface Props {
  params: Promise<{ pueblo: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getClasificadoById(id);
  if (!c) return { title: "Clasificado no encontrado" };
  return {
    title: `${c.titulo}`,
    description: c.descripcion.slice(0, 160),
  };
}

export default async function ClasificadoPage({ params }: Props) {
  const { id } = await params;
  const c = await getClasificadoById(id);
  if (!c) notFound();

  return (
    <div className="min-h-screen bg-fog">
      <ClasificadoDetalle clasificado={c} />
    </div>
  );
}
