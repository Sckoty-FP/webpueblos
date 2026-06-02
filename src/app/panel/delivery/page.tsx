import { redirect } from "next/navigation";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { createClient } from "@/lib/supabase/server";
import type { PedidoDeliveryDB } from "@/types/delivery";
import type { RepartidorDB } from "@/types/delivery";
import PedidosView from "@/components/delivery/negocio/PedidosView";

// Estados activos — los pedidos finalizados se cargan bajo demanda
const ESTADOS_ACTIVOS = [
  "pendiente_pago",
  "aceptado",
  "preparando",
  "listo",
  "en_camino",
] as const;

export default async function PanelDeliveryPage() {
  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");
  if (!prestador.delivery_activo) redirect("/panel/delivery/config");

  const supabase = await createClient();

  const [pedidosRes, repartidoresRes] = await Promise.all([
    supabase
      .from("pedidos_delivery")
      .select("*")
      .eq("prestador_id", prestador.id)
      .in("estado", ESTADOS_ACTIVOS)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("repartidores")
      .select("*, usuario:usuarios!repartidores_usuario_id_fkey(nombre, email)")
      .eq("pueblo_id", prestador.pueblo_id as number)
      .eq("activo", true)
      .eq("en_turno", true)
      .order("rating_promedio", { ascending: false }),
  ]);

  const pedidos = (pedidosRes.data ?? []) as PedidoDeliveryDB[];
  const repartidores = (repartidoresRes.data ?? []) as RepartidorDB[];

  return (
    <PedidosView
      prestadorId={prestador.id}
      pedidosIniciales={pedidos}
      repartidores={repartidores}
    />
  );
}
