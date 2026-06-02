import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getPrestadoresDelivery } from "@/lib/supabase/queries/delivery-publico";
import DeliveryListado from "@/components/delivery/cliente/DeliveryListado";

export const revalidate = 600;

interface Props {
  params: Promise<{ pueblo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slug } = await params;
  const pueblo = await getPuebloBySlug(slug);
  if (!pueblo) return { title: "Delivery no encontrado" };
  return {
    title: `Delivery en ${pueblo.nombre}`,
    description: `Pedí a domicilio en ${pueblo.nombre}. Restaurantes y negocios locales con reparto a casa.`,
    alternates: { canonical: `https://pueblo.app/${pueblo.slug}/delivery` },
  };
}

export default async function DeliveryPage({ params }: Props) {
  const { pueblo: slugParam } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  if (!pueblo) notFound();

  const negocios = await getPrestadoresDelivery(pueblo.id);

  return (
    <div className="min-h-screen bg-fog">
      {/* Hero */}
      <div className="pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="container-app">
          <p className="font-fraunces text-xs font-medium uppercase tracking-[0.18em] text-accent-warm mb-3">
            Delivery
          </p>
          <h1
            className="font-fraunces font-semibold text-text-body mb-4 leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            A domicilio en {pueblo.nombre}.
          </h1>
          <p className="font-barlow text-base md:text-lg text-text-muted max-w-xl leading-relaxed">
            {negocios.length > 0
              ? `${negocios.length} ${negocios.length === 1 ? "negocio lleva" : "negocios llevan"} la carta a tu puerta. Pedí y seguí el reparto en tiempo real.`
              : "Pronto podés pedir a domicilio desde los mejores negocios del pueblo."
            }
          </p>
        </div>
      </div>

      <DeliveryListado negocios={negocios} puebloSlug={pueblo.slug} />
    </div>
  );
}
