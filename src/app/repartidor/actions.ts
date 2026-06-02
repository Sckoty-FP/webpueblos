"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  toggleEnTurno,
  cambiarEstadoPedido,
  upsertUbicacion,
  getRepartidorDelUsuario,
} from "@/lib/supabase/queries/delivery";
import { fetchOSRMConRuta } from "@/lib/osrm/client";
import { notificarClientePedido } from "@/lib/push/notificar-eventos";
import type { RepartidorDB } from "@/types/delivery";

async function getRepartidorAuth(): Promise<RepartidorDB> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/repartidor");
  const rep = await getRepartidorDelUsuario(user.id);
  if (!rep || !rep.activo) redirect("/");
  return rep;
}

export async function toggleEnTurnoAction(enTurno: boolean): Promise<void> {
  const rep = await getRepartidorAuth();
  await toggleEnTurno(rep.id, enTurno);
}

export async function cambiarEstadoPedidoRepartidorAction(
  pedidoId:    string,
  nuevoEstado: "en_camino" | "entregado",
): Promise<void> {
  await getRepartidorAuth();
  await cambiarEstadoPedido(pedidoId, nuevoEstado);

  // Avisar al cliente del hito.
  const supabase = await createClient();
  await notificarClientePedido(
    supabase,
    pedidoId,
    nuevoEstado === "entregado" ? "pedido_entregado" : "pedido_en_camino",
  );
}

export async function upsertUbicacionAction(
  lat:     number,
  lon:     number,
  bateria?: number,
): Promise<void> {
  const rep = await getRepartidorAuth();
  await upsertUbicacion(rep.id, lat, lon, bateria);
}

export async function confirmarCobroEfectivoAction(pedidoId: string): Promise<void> {
  const rep = await getRepartidorAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("pedidos_delivery")
    .update({
      pagado:               true,
      pago_confirmado_por:  rep.usuario_id,
      pago_confirmado_en:   new Date().toISOString(),
    })
    .eq("id", pedidoId)
    .eq("repartidor_id", rep.id)
    .eq("estado", "entregado");

  if (error) throw error;
}

export async function getRutaOSRMAction(
  from: { lat: number; lon: number },
  to:   { lat: number; lon: number },
): Promise<{ distance_km: number; duration_min: number; geometry: GeoJSON.LineString } | null> {
  return fetchOSRMConRuta(from, to);
}
