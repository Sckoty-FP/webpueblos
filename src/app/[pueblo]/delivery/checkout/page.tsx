import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getPrestadorDeliveryBySlug } from "@/lib/supabase/queries/delivery-publico";
import { getDireccionDefault } from "@/lib/supabase/queries/usuarios";
import CheckoutView from "@/components/delivery/cliente/CheckoutView";

interface Props {
  params:       Promise<{ pueblo: string }>;
  searchParams: Promise<{ negocio?: string }>;
}

export const metadata: Metadata = { title: "Checkout · Delivery" };

export default async function CheckoutPage({ params, searchParams }: Props) {
  const [{ pueblo: slugParam }, { negocio: negocioSlug }] = await Promise.all([
    params,
    searchParams,
  ]);

  // Auth guard — requiere sesión activa para hacer pedidos
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const returnUrl = `/${slugParam}/delivery/checkout${negocioSlug ? `?negocio=${negocioSlug}` : ""}`;
    redirect(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
  }

  const [pueblo, defaultAddress] = await Promise.all([
    getPuebloBySlug(slugParam),
    getDireccionDefault(user.id),
  ]);
  if (!pueblo) notFound();

  const prestador = negocioSlug ? await getPrestadorDeliveryBySlug(negocioSlug) : null;

  return (
    <div className="min-h-screen bg-fog">
      <CheckoutView
          puebloSlug={slugParam}
          prestador={prestador ? {
            id:      prestador.id,
            nombre:  prestador.nombre,
            slug:    prestador.slug,
            lat:     prestador.lat,
            lon:     prestador.lon,
            config:  prestador.delivery_config ?? null,
          } : null}
          defaultAddress={defaultAddress ?? undefined}
        />
    </div>
  );
}
