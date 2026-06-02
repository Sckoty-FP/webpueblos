import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MuroFeed from "@/components/sections/muro/MuroFeed";

export const revalidate = 60;
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getMuroPosts } from "@/lib/supabase/queries/contenido";

interface Props {
  params: Promise<{ pueblo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slugParam } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) return { title: "Pueblo no encontrado" };
  return {
    title: `Muro en ${pueblo.nombre}`,
    description: `Lo que está pasando en ${pueblo.nombre} ahora mismo.`,
  };
}

export default async function MuroPage({ params }: Props) {
  const { pueblo: slugParam } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) notFound();

  const posts = await getMuroPosts(pueblo.id);

  return (
    <div className="min-h-screen bg-fog">
      <MuroFeed initialPosts={posts} puebloId={pueblo.id} puebloNombre={pueblo.nombre} puebloSlug={pueblo.slug} />
    </div>
  );
}
