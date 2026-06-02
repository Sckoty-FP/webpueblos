import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getRepartidorDelUsuario,
  getPedidoConItemsYPrestador,
} from "@/lib/supabase/queries/delivery";
import DetallePedidoView from "@/components/delivery/repartidor/DetallePedidoView";

export const metadata: Metadata = { title: "Detalle pedido · Repartidor · PUEBLO" };

export default async function DetallePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/repartidor");

  const [rep, pedido] = await Promise.all([
    getRepartidorDelUsuario(user.id),
    getPedidoConItemsYPrestador(id),
  ]);

  if (!rep || !rep.activo) redirect("/");
  if (!pedido) notFound();
  if (pedido.repartidor_id !== rep.id) redirect("/repartidor");

  return <DetallePedidoView pedido={pedido} repartidorId={rep.id} />;
}
