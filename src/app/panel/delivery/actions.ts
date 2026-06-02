"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esTransicionValida } from "@/lib/delivery/estados";
import { notificarClientePedido } from "@/lib/push/notificar-eventos";
import type { EstadoPedidoDelivery, ModoDelivery, DeliveryConfigDB, DeliveryHorarioDB } from "@/types/delivery";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getPrestadorId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data } = await supabase
    .from("prestadores")
    .select("id")
    .eq("propietario_id", user.id)
    .single();

  if (!data) throw new Error("Prestador no encontrado");
  return data.id;
}

// ─── Estado de pedidos ────────────────────────────────────────────────────────

export async function aceptarPedido(pedidoId: string) {
  const supabase = await createClient();
  const prestadorId = await getPrestadorId();

  const { error } = await supabase
    .from("pedidos_delivery")
    .update({ estado: "aceptado" as EstadoPedidoDelivery })
    .eq("id", pedidoId)
    .eq("prestador_id", prestadorId)
    .eq("estado", "pendiente_pago" as EstadoPedidoDelivery);

  if (error) throw error;
  await notificarClientePedido(supabase, pedidoId, "pedido_aceptado");
  revalidatePath("/panel/delivery");
}

export async function rechazarPedido(pedidoId: string, motivo?: string) {
  const supabase = await createClient();
  const prestadorId = await getPrestadorId();

  const { error } = await supabase
    .from("pedidos_delivery")
    .update({
      estado: "rechazado" as EstadoPedidoDelivery,
      motivo_cancelacion: motivo ?? null,
    })
    .eq("id", pedidoId)
    .eq("prestador_id", prestadorId);

  if (error) throw error;
  revalidatePath("/panel/delivery");
}

export async function avanzarEstadoPedido(
  pedidoId: string,
  nuevoEstado: EstadoPedidoDelivery,
) {
  const supabase = await createClient();
  const prestadorId = await getPrestadorId();

  // Leemos el estado actual para validar la transición en el BACKEND, no solo
  // confiar en que la UI ofrezca el botón correcto (defensa en profundidad).
  const { data: actual, error: errLeer } = await supabase
    .from("pedidos_delivery")
    .select("estado")
    .eq("id", pedidoId)
    .eq("prestador_id", prestadorId)
    .single();

  if (errLeer) throw errLeer;
  if (!actual) throw new Error("Pedido no encontrado");

  const estadoActual = actual.estado as EstadoPedidoDelivery;
  if (!esTransicionValida(estadoActual, nuevoEstado)) {
    throw new Error(`Transición inválida: ${estadoActual} → ${nuevoEstado}`);
  }

  // Compare-and-set: el UPDATE solo procede si el estado no cambió entremedio
  // (otra pestaña, el repartidor, una carrera). Si cambió, data viene null.
  const { data, error } = await supabase
    .from("pedidos_delivery")
    .update({ estado: nuevoEstado })
    .eq("id", pedidoId)
    .eq("prestador_id", prestadorId)
    .eq("estado", estadoActual)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("El pedido cambió de estado mientras tanto. Recargá.");

  // Avisar al cliente en los hitos que le importan.
  if (nuevoEstado === "en_camino") {
    await notificarClientePedido(supabase, pedidoId, "pedido_en_camino");
  } else if (nuevoEstado === "entregado") {
    await notificarClientePedido(supabase, pedidoId, "pedido_entregado");
  }

  revalidatePath("/panel/delivery");
}

export async function asignarRepartidorAction(
  pedidoId: string,
  repartidorId: string,
) {
  const supabase = await createClient();
  const prestadorId = await getPrestadorId();

  const { data, error } = await supabase
    .from("pedidos_delivery")
    .update({ repartidor_id: repartidorId, estado: "en_camino" as EstadoPedidoDelivery })
    .eq("id", pedidoId)
    .eq("prestador_id", prestadorId)
    .is("repartidor_id", null)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("El pedido ya fue asignado a otro repartidor.");

  // Asignar repartidor pasa el pedido a en_camino → avisar al cliente.
  await notificarClientePedido(supabase, pedidoId, "pedido_en_camino");
  revalidatePath("/panel/delivery");
}

// ─── Config de delivery ───────────────────────────────────────────────────────

export async function toggleDeliveryActivo(
  activo: boolean,
  modo: ModoDelivery,
) {
  const supabase = await createClient();
  const prestadorId = await getPrestadorId();

  const { error } = await supabase
    .from("prestadores")
    .update({ delivery_activo: activo, delivery_modo: modo })
    .eq("id", prestadorId);

  if (error) throw error;
  revalidatePath("/panel/delivery");
  revalidatePath("/panel");
}

export async function guardarConfigDelivery(
  config: Partial<Omit<DeliveryConfigDB, "prestador_id" | "created_at" | "updated_at">>,
) {
  const supabase = await createClient();
  const prestadorId = await getPrestadorId();

  // Intentamos primero con todos los campos (migración 021 aplicada)
  const { error } = await supabase
    .from("delivery_config")
    .upsert({ prestador_id: prestadorId, ...config }, { onConflict: "prestador_id" });

  if (error) {
    // Si el error es por columnas inexistentes (migración pendiente),
    // reintentamos sin los campos nuevos de la migración 021
    if (error.code === "42703" || error.message?.includes("column")) {
      const { acepta_bizum, bizum_numero, acepta_tarjeta, ...safeConfig } = config as Record<string, unknown>;
      void acepta_bizum; void bizum_numero; void acepta_tarjeta;
      const { error: error2 } = await supabase
        .from("delivery_config")
        .upsert({ prestador_id: prestadorId, ...safeConfig }, { onConflict: "prestador_id" });
      if (error2) throw error2;
    } else {
      throw error;
    }
  }

  revalidatePath("/panel/delivery/config");
}

export async function guardarHorariosDelivery(
  horarios: { dia_semana: number; hora_apertura: string; hora_cierre: string }[],
) {
  const supabase = await createClient();
  const prestadorId = await getPrestadorId();

  const { error: errDel } = await supabase
    .from("delivery_horarios")
    .delete()
    .eq("prestador_id", prestadorId);
  if (errDel) throw errDel;

  if (horarios.length > 0) {
    const { error: errIns } = await supabase
      .from("delivery_horarios")
      .insert(horarios.map((h) => ({ ...h, prestador_id: prestadorId })));
    if (errIns) throw errIns;
  }

  revalidatePath("/panel/delivery/config");
}
