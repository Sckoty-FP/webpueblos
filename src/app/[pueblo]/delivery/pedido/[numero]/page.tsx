import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPedidoPorNumero } from "@/lib/supabase/queries/delivery";
import { getItemsDePedido } from "@/lib/supabase/queries/delivery-publico";
import TrackingView from "@/components/delivery/cliente/TrackingView";

interface Props {
  params: Promise<{ pueblo: string; numero: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { numero } = await params;
  return { title: `Seguimiento ${numero} · Delivery` };
}

export default async function TrackingPage({ params }: Props) {
  const { pueblo: puebloSlug, numero } = await params;

  const pedido = await getPedidoPorNumero(numero);
  if (!pedido) notFound();

  const items = await getItemsDePedido(pedido.id);

  return (
    <div className="min-h-screen bg-fog">
      <TrackingView
        pedidoInicial={pedido}
        items={items}
        puebloSlug={puebloSlug}
      />
    </div>
  );
}
