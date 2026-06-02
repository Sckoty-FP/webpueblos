"use server";

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { geocodeAddress, reverseGeocode } from '@/lib/osrm/nominatim';
import { calcularPedido, defaultCalcDeps } from '@/lib/delivery/calcular';
import { crearPedido } from '@/lib/supabase/queries/delivery';
import { guardarDireccionDefault } from '@/lib/supabase/queries/usuarios';
import { notificarNegocioNuevoPedido } from '@/lib/push/notificar-eventos';
import type {
  NominatimResult,
  CalcPedidoResult,
  MetodoPagoDelivery,
} from '@/types/delivery';

// ─── Geocoding ────────────────────────────────────────────────────────────────

export async function buscarDireccionAction(
  query: string,
): Promise<NominatimResult[]> {
  if (!query.trim() || query.trim().length < 3) return [];
  try {
    return await geocodeAddress(query, 5);
  } catch {
    return [];
  }
}

export async function reverseGeocodeAction(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const r = await reverseGeocode(lat, lon);
    if (!r) return null;
    const a = r.address;
    if (!a) return r.display_name;
    const partes: string[] = [];
    if (a.road) partes.push(a.house_number ? `${a.road} ${a.house_number}` : a.road);
    const localidad = a.village ?? a.town ?? a.city;
    if (localidad) partes.push(localidad);
    return partes.length > 0 ? partes.join(', ') : r.display_name;
  } catch {
    return null;
  }
}

// ─── Cálculo ──────────────────────────────────────────────────────────────────

export async function calcularPedidoAction(
  prestadorId:  string,
  prestadorLat: number,
  prestadorLon: number,
  clienteLat:   number,
  clienteLon:   number,
  items:        { plato_id: string; cantidad: number }[],
): Promise<{ ok: true; result: CalcPedidoResult } | { ok: false; error: string }> {
  try {
    // El modo determina de dónde salen los precios de envío (plataforma = admin).
    const supabase = await createClient();
    const { data: prestador } = await supabase
      .from('prestadores')
      .select('delivery_modo')
      .eq('id', prestadorId)
      .single();

    const result = await calcularPedido(
      {
        prestador: { id: prestadorId, lat: prestadorLat, lon: prestadorLon },
        cliente:   { lat: clienteLat, lon: clienteLon },
        items,
        modo:      (prestador?.delivery_modo as 'plataforma' | 'propio' | 'desactivado' | undefined) ?? undefined,
      },
      defaultCalcDeps,
    );
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al calcular el pedido' };
  }
}

// ─── Creación de pedido ───────────────────────────────────────────────────────

interface CrearPedidoInput {
  prestadorId:       string;
  nombreCliente:     string;
  telefonoCliente:   string;
  emailCliente:      string | null;
  direccion:         string;
  detallesDireccion: string | null;
  latitud:           number;
  longitud:          number;
  notasCliente:      string | null;
  metodoPago:        MetodoPagoDelivery;
  calcResult:        CalcPedidoResult;
  items:             { platoId: string; nombre: string; precio: number; cantidad: number }[];
}

export async function crearPedidoPublicoAction(
  data: CrearPedidoInput,
): Promise<{ ok: true; numeroPedido: string } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();

    // Verificar sesión — no se puede pedir sin estar logueado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Debés iniciar sesión para hacer un pedido' };

    // Obtener pueblo_id y delivery_modo del prestador
    const { data: prestador, error: pErr } = await supabase
      .from('prestadores')
      .select('pueblo_id, delivery_modo, propietario_id')
      .eq('id', data.prestadorId)
      .single();
    if (pErr || !prestador) return { ok: false, error: 'Negocio no encontrado' };

    const pedidoCreado = await crearPedido(
      {
        pueblo_id:           prestador.pueblo_id,
        prestador_id:        data.prestadorId,
        cliente_id:          user.id,
        repartidor_id:       null,
        delivery_modo:       prestador.delivery_modo ?? 'propio',
        nombre_cliente:      data.nombreCliente,
        telefono_cliente:    data.telefonoCliente,
        email_cliente:       data.emailCliente,
        direccion:           data.direccion,
        detalles_direccion:  data.detallesDireccion,
        latitud:             data.latitud,
        longitud:            data.longitud,
        subtotal:            data.calcResult.subtotal,
        coste_envio:         data.calcResult.coste_envio,
        total:               data.calcResult.total,
        comision_porcentaje: 0,
        comision_importe:    0,
        metodo_pago:         data.metodoPago,
        pagado:              false,
        distancia_km:        data.calcResult.distancia_km,
        preparacion_min:     data.calcResult.preparacion_min,
        trayecto_min:        data.calcResult.trayecto_min,
        eta_minutos:         data.calcResult.eta_minutos,
        notas_cliente:       data.notasCliente,
        notas_negocio:        null,
        motivo_cancelacion:   null,
        pago_confirmado_en:   null,
        pago_confirmado_por:  null,
      },
      data.items.map(i => ({
        plato_id:       i.platoId,
        servicio_id:    null,
        nombre:         i.nombre,
        cantidad:       i.cantidad,
        precio_unitario: i.precio,
        subtotal:       parseFloat((i.precio * i.cantidad).toFixed(2)),
        notas:          null,
      })),
    );

    // Guardar dirección del primer pedido para precargar el mapa en pedidos futuros
    await guardarDireccionDefault(user.id, data.direccion, data.latitud, data.longitud);

    // Avisar al negocio del pedido nuevo (push + in-app). Best-effort.
    if (prestador.propietario_id) {
      await notificarNegocioNuevoPedido(
        prestador.propietario_id,
        pedidoCreado.numero_pedido,
        data.calcResult.total,
      );
    }

    return { ok: true, numeroPedido: pedidoCreado.numero_pedido };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al crear el pedido' };
  }
}
