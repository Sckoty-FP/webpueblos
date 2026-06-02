import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getRepartidorDelUsuario,
  getPedidosActivosRepartidor,
  getStatsHoyRepartidor,
} from "@/lib/supabase/queries/delivery";
import RepartidorHome from "@/components/delivery/repartidor/RepartidorHome";

export const metadata: Metadata = { title: "Portal Repartidor" };

export default async function RepartidorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/repartidor");

  const rep = await getRepartidorDelUsuario(user.id);
  if (!rep || !rep.activo) redirect("/");

  const [pedidosActivos, stats] = await Promise.all([
    getPedidosActivosRepartidor(rep.id),
    getStatsHoyRepartidor(rep.id),
  ]);

  return (
    <RepartidorHome
      repartidor={rep}
      pedidosActivos={pedidosActivos}
      pedidosHoy={stats.pedidos_hoy}
    />
  );
}
