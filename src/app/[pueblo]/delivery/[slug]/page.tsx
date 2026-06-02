import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getPrestadorDeliveryBySlug, getPlatosDelivery } from "@/lib/supabase/queries/delivery-publico";
import CartaDeliveryView from "@/components/delivery/cliente/CartaDeliveryView";

interface Props {
  params: Promise<{ pueblo: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slugParam, slug } = await params;
  const [pueblo, prestador] = await Promise.all([
    getPuebloBySlug(slugParam),
    getPrestadorDeliveryBySlug(slug),
  ]);
  if (!pueblo || !prestador) return { title: "Negocio no encontrado" };
  return {
    title: `${prestador.nombre} · Delivery · ${pueblo.nombre}`,
    description: `Pedí a domicilio en ${prestador.nombre}. ${prestador.descripcion_corta ?? ""}`,
  };
}

export default async function CartaDeliveryPage({ params }: Props) {
  const { pueblo: slugParam, slug } = await params;

  const [pueblo, prestador] = await Promise.all([
    getPuebloBySlug(slugParam),
    getPrestadorDeliveryBySlug(slug),
  ]);

  if (!pueblo || !prestador) notFound();

  const platos = await getPlatosDelivery(prestador.id);

  return (
    <div className="min-h-screen bg-fog pb-32">
      <CartaDeliveryView
          prestador={{
            id:              prestador.id,
            slug:            prestador.slug,
            nombre:          prestador.nombre,
            descripcionCorta: prestador.descripcion_corta,
            imagenUrl:       prestador.imagen_portada_url,
            lat:             prestador.lat,
            lon:             prestador.lon,
          }}
          deliveryConfig={prestador.delivery_config ?? null}
          platos={platos}
          puebloSlug={slugParam}
        />
    </div>
  );
}
