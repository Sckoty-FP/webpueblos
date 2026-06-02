/**
 * Adaptadores de los 5 eventos de dominio del Sprint 13 al motor de push.
 * Cada función resuelve QUIÉN recibe la notificación y arma el evento.
 * Todo best-effort: nunca lanza (no debe tumbar el flujo de negocio).
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { notificar } from "@/lib/push/send";

type TipoPedidoCliente = "pedido_aceptado" | "pedido_en_camino" | "pedido_entregado";

/**
 * Avisa al CLIENTE de un cambio de estado de su pedido. Resuelve cliente_id,
 * número y slug del pueblo (para el deep-link de tracking) desde el pedido.
 */
export async function notificarClientePedido(
  supabase: SupabaseClient,
  pedidoId: string,
  tipo: TipoPedidoCliente,
): Promise<void> {
  try {
    const { data } = await supabase
      .from("pedidos_delivery")
      .select("cliente_id, numero_pedido, pueblo:pueblos!pedidos_delivery_pueblo_id_fkey(slug)")
      .eq("id", pedidoId)
      .maybeSingle();

    if (!data?.cliente_id) return;
    const pueblo = data.pueblo as { slug?: string } | { slug?: string }[] | null;
    const slug = Array.isArray(pueblo) ? pueblo[0]?.slug : pueblo?.slug;

    await notificar(data.cliente_id, {
      tipo,
      numero: data.numero_pedido,
      puebloSlug: slug ?? "",
    });
  } catch (e) {
    console.error("[push] notificarClientePedido:", e);
  }
}

/** Avisa al NEGOCIO (propietario) de un pedido nuevo. */
export async function notificarNegocioNuevoPedido(
  propietarioId: string,
  numero: string,
  total: number,
): Promise<void> {
  try {
    await notificar(propietarioId, { tipo: "pedido_nuevo", numero, total });
  } catch (e) {
    console.error("[push] notificarNegocioNuevoPedido:", e);
  }
}

/** Avisa al GUÍA (propietario) de una nueva inscripción a su free tour. */
export async function notificarGuiaInscripcion(
  propietarioId: string,
  tourTitulo: string,
  numPersonas: number,
  sesionFecha: string,
): Promise<void> {
  try {
    await notificar(propietarioId, {
      tipo: "inscripcion_nueva",
      tourTitulo,
      numPersonas,
      sesionFecha,
    });
  } catch (e) {
    console.error("[push] notificarGuiaInscripcion:", e);
  }
}

/** Avisa a TODOS los admins de la plataforma de un ticket nuevo. */
export async function notificarAdminsNuevoTicket(
  ticketId: string,
  numero: string,
  asunto: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("usuarios")
      .select("id")
      .in("tipo", ["super_admin", "admin_empresa"]);

    for (const u of (data ?? []) as { id: string }[]) {
      await notificar(u.id, { tipo: "ticket_nuevo", ticketId, numero, asunto });
    }
  } catch (e) {
    console.error("[push] notificarAdminsNuevoTicket:", e);
  }
}
