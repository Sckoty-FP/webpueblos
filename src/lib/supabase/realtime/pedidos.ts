import { createClient } from '@/lib/supabase/client';
import type { PedidoDeliveryDB } from '@/types/delivery';

export type PedidoRealtimeEvent =
  | { type: 'INSERT'; pedido: PedidoDeliveryDB }
  | { type: 'UPDATE'; pedido: PedidoDeliveryDB }
  | { type: 'DELETE'; id: string };

/**
 * Suscripción realtime a pedidos de un prestador.
 * Devuelve una función de cleanup para desuscribirse (usar en useEffect return).
 *
 * Polling fallback: si el canal cae o tarda más de `pollIntervalMs`,
 * el componente debe llamar manualmente a `getPedidosDelPrestador`
 * — este helper solo gestiona el canal Supabase Realtime.
 */
export function subscribeToPedidos(
  prestadorId: string,
  onEvent: (event: PedidoRealtimeEvent) => void,
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel(`pedidos_delivery:${prestadorId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pedidos_delivery',
        filter: `prestador_id=eq.${prestadorId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          onEvent({ type: 'INSERT', pedido: payload.new as PedidoDeliveryDB });
        } else if (payload.eventType === 'UPDATE') {
          onEvent({ type: 'UPDATE', pedido: payload.new as PedidoDeliveryDB });
        } else if (payload.eventType === 'DELETE') {
          onEvent({ type: 'DELETE', id: (payload.old as { id: string }).id });
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Tono de notificación usando Web Audio API — sin assets externos. */
export function playNotificacionPedido(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // AudioContext puede estar bloqueado antes de un gesto del usuario — ignorar silenciosamente
  }
}
