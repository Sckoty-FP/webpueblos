import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { notificarAdminsNuevoTicket } from "@/lib/push/notificar-eventos";
import type {
  AdminKpis,
  ComisionConfigDB,
  KpiPorPueblo,
  MetodosPagoConfig,
  PlataformaConfigDB,
  RemesaConPrestador,
  RemesaDB,
  SaldoPendiente,
  TicketConAutor,
  TicketMensajeDB,
  TicketSoporteDB,
  VerificacionConPrestador,
  DeliveryPricingConfig,
} from "@/types/admin";

// ─── Configuración de plataforma ─────────────────────────────────────────

export async function getPlataformaConfig(): Promise<PlataformaConfigDB[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plataforma_config")
    .select("*")
    .order("clave");
  return (data ?? []) as PlataformaConfigDB[];
}

export async function getMetodosPagoConfig(): Promise<MetodosPagoConfig> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plataforma_config")
    .select("valor")
    .eq("clave", "metodos_pago_habilitados")
    .single();
  return (data?.valor as MetodosPagoConfig) ?? { efectivo: true, bizum: true, tarjeta: false };
}

export async function getDeliveryPricingConfig(): Promise<DeliveryPricingConfig> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plataforma_config")
    .select("clave, valor")
    .in("clave", [
      "delivery_tarifa_base",
      "delivery_precio_km",
      "delivery_porcentaje_restaurante",
      "delivery_pedido_minimo",
      "delivery_radio_cobertura_km",
    ]);

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[row.clave] = (row.valor as { value: number }).value;
  }
  return {
    tarifa_base:            map["delivery_tarifa_base"]            ?? 2.00,
    precio_km:              map["delivery_precio_km"]              ?? 0.30,
    porcentaje_restaurante: map["delivery_porcentaje_restaurante"] ?? 0,
    pedido_minimo:          map["delivery_pedido_minimo"]          ?? 12.00,
    radio_cobertura_km:     map["delivery_radio_cobertura_km"]     ?? 8.00,
  };
}

export async function updatePlataformaConfig(
  clave: string,
  valor: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plataforma_config")
    .update({ valor, updated_at: new Date().toISOString() })
    .eq("clave", clave);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Comisiones (modo propio) ─────────────────────────────────────────────

export async function getComisionesConfig(): Promise<ComisionConfigDB[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comision_config")
    .select("*")
    .order("activa", { ascending: false })
    .order("pueblo_id", { ascending: true });
  return (data ?? []) as ComisionConfigDB[];
}

export async function crearComisionConfig(
  input: Pick<ComisionConfigDB, "pueblo_id" | "categoria" | "porcentaje" | "observaciones">
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("comision_config").insert(input);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function actualizarComisionConfig(
  id: string,
  porcentaje: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("comision_config")
    .update({ porcentaje })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleComisionConfig(
  id: string,
  activa: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("comision_config")
    .update({ activa })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── KPIs ─────────────────────────────────────────────────────────────────

export async function getAdminKpis(): Promise<AdminKpis> {
  const supabase = await createClient();

  const now    = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: gmvData },
    { count: reservasCount },
    { data: ftData },
    { data: ticketsData },
    { count: negociosCount },
    { count: repartidoresCount },
    { data: saldoData },
  ] = await Promise.all([
    supabase
      .from("pedidos_delivery")
      .select("subtotal,coste_envio,total,comision_importe")
      .eq("estado", "entregado")
      .gte("created_at", inicio),
    supabase
      .from("reservas")
      .select("*", { count: "exact", head: true })
      .eq("estado", "confirmada")
      .gte("created_at", inicio),
    supabase
      .from("free_tour_inscripciones")
      .select("num_personas,comision_aplicada")
      .in("estado", ["confirmada", "asistio"])
      .gte("created_at", inicio),
    supabase
      .from("tickets_soporte")
      .select("prioridad")
      .eq("estado", "abierto"),
    supabase
      .from("prestadores")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase
      .from("repartidores")
      .select("*", { count: "exact", head: true })
      .eq("en_turno", true),
    supabase.from("vw_admin_saldo_pendiente").select("saldo_total"),
  ]);

  const pedidos    = gmvData ?? [];
  const gmvComida  = pedidos.reduce((s, r) => s + (r.subtotal ?? 0), 0);
  const gmvDelivery = pedidos.reduce((s, r) => s + (r.coste_envio ?? 0), 0);

  const inscripciones = ftData ?? [];
  const ftInscritos   = inscripciones.reduce((s, r) => s + (r.num_personas ?? 0), 0);
  const ftComision    = inscripciones.reduce((s, r) => s + ((r.num_personas ?? 0) * (r.comision_aplicada ?? 2)), 0);

  const tickets        = ticketsData ?? [];
  const ticketsAbiertos = tickets.length;
  const ticketsUrgentes = tickets.filter((t) => t.prioridad === "urgente").length;

  const saldoPendiente = (saldoData ?? []).reduce((s, r) => s + ((r as { saldo_total: number }).saldo_total ?? 0), 0);

  return {
    gmv_comida:           Math.round(gmvComida * 100) / 100,
    gmv_delivery:         Math.round(gmvDelivery * 100) / 100,
    gmv_total:            Math.round((gmvComida + gmvDelivery) * 100) / 100,
    pedidos_delivery:     pedidos.length,
    reservas_confirmadas: reservasCount ?? 0,
    free_tour_inscritos:  ftInscritos,
    comision_free_tour:   Math.round(ftComision * 100) / 100,
    tickets_abiertos:     ticketsAbiertos,
    tickets_urgentes:     ticketsUrgentes,
    negocios_activos:     negociosCount ?? 0,
    repartidores_turno:   repartidoresCount ?? 0,
    saldo_pendiente:      Math.round(saldoPendiente * 100) / 100,
  };
}

export async function getKpisPorPueblo(): Promise<KpiPorPueblo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vw_admin_gmv_mes")
    .select("*");
  return (data ?? []) as KpiPorPueblo[];
}

export async function getSaldosPendientes(): Promise<SaldoPendiente[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vw_admin_saldo_pendiente")
    .select("*");
  return (data ?? []) as SaldoPendiente[];
}

// ─── Negocios (admin) ─────────────────────────────────────────────────────

export async function getAdminNegocios(filtro?: { pueblo_id?: number; busqueda?: string }) {
  const supabase = createAdminClient();
  let query = supabase
    .from("prestadores")
    .select(`
      id, nombre, slug, activo, verificado, delivery_activo, delivery_modo,
      suscripcion_estado, tipo_cocina, created_at,
      pueblos(nombre)
    `)
    .order("created_at", { ascending: false });

  if (filtro?.pueblo_id) query = query.eq("pueblo_id", filtro.pueblo_id);
  if (filtro?.busqueda)  query = query.ilike("nombre", `%${filtro.busqueda}%`);

  const { data } = await query;
  return data ?? [];
}

export async function suspenderNegocio(
  prestadorId: string,
  motivo: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prestadores")
    .update({ activo: false })
    .eq("id", prestadorId);

  if (error) return { ok: false, error: error.message };

  // Registrar en audit_log
  await supabase.rpc("log_audit", {
    p_accion:      "suspender_negocio",
    p_tabla:       "prestadores",
    p_registro_id: prestadorId,
    p_datos_antes:  null,
    p_datos_despues: { motivo },
  });

  return { ok: true };
}

export async function activarNegocio(
  prestadorId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prestadores")
    .update({ activo: true })
    .eq("id", prestadorId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Repartidores ─────────────────────────────────────────────────────────

export async function getAdminRepartidores(puebloId?: number) {
  const supabase = await createClient();
  let query = supabase
    .from("repartidores")
    .select(`
      id, usuario_id, pueblo_id, vehiculo, dni_nif, iban_pago,
      telefono_emergencia, activo, en_turno,
      temporada_actual, pedidos_completados, rating_promedio,
      usuarios!repartidores_usuario_id_fkey(email, nombre),
      pueblos!repartidores_pueblo_id_fkey(nombre)
    `)
    .order("activo", { ascending: false });

  if (puebloId) query = query.eq("pueblo_id", puebloId);
  const { data } = await query;
  return data ?? [];
}

export async function toggleRepartidorActivo(
  repartidorId: string,
  activo: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("repartidores")
    .update({ activo, en_turno: activo ? undefined : false })
    .eq("id", repartidorId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Verificaciones ───────────────────────────────────────────────────────

export async function getVerificacionesPendientes(): Promise<VerificacionConPrestador[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("verificacion_negocios")
    .select(`
      *,
      prestador:prestadores!verificacion_negocios_prestador_id_fkey(nombre,slug,pueblo_id)
    `)
    .in("estado", ["pendiente", "revisando"])
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as VerificacionConPrestador[];
}

export async function getTodasVerificaciones(): Promise<VerificacionConPrestador[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("verificacion_negocios")
    .select(`
      *,
      prestador:prestadores!verificacion_negocios_prestador_id_fkey(nombre,slug,pueblo_id)
    `)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as VerificacionConPrestador[];
}

export async function actualizarEstadoVerificacion(
  id: string,
  estado: string,
  motivo?: string,
  notas?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { estado };
  if (motivo) updates.motivo_rechazo = motivo;
  if (notas)  updates.notas_internas = notas;
  if (estado === "aprobado" || estado === "rechazado") {
    updates.revisado_en = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) updates.revisado_por = user.id;
  }

  const { data: verif, error } = await supabase
    .from("verificacion_negocios")
    .update(updates)
    .eq("id", id)
    .select("prestador_id")
    .single();

  if (error) return { ok: false, error: error.message };

  // Si se aprueba, marcar el prestador como verificado
  if (estado === "aprobado" && verif?.prestador_id) {
    await supabase
      .from("prestadores")
      .update({ verificado: true })
      .eq("id", verif.prestador_id);
  }

  return { ok: true };
}

// ─── Tickets ──────────────────────────────────────────────────────────────

export async function getTickets(filtros?: {
  estado?: string;
  prioridad?: string;
}): Promise<TicketConAutor[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tickets_soporte")
    .select(`
      *,
      autor:usuarios!tickets_soporte_abierto_por_fkey(email, nombre),
      prestador:prestadores!tickets_soporte_prestador_id_fkey(nombre)
    `)
    .order("created_at", { ascending: false });

  if (filtros?.estado)    query = query.eq("estado", filtros.estado);
  if (filtros?.prioridad) query = query.eq("prioridad", filtros.prioridad);

  const { data } = await query;
  return (data ?? []) as unknown as TicketConAutor[];
}

export async function getTicketConMensajes(ticketId: string): Promise<{
  ticket:    TicketConAutor | null;
  mensajes:  TicketMensajeDB[];
}> {
  const supabase = await createClient();
  const [{ data: ticket }, { data: mensajes }] = await Promise.all([
    supabase
      .from("tickets_soporte")
      .select(`
        *,
        autor:usuarios!tickets_soporte_abierto_por_fkey(email, nombre),
        prestador:prestadores!tickets_soporte_prestador_id_fkey(nombre)
      `)
      .eq("id", ticketId)
      .single(),
    supabase
      .from("ticket_mensajes")
      .select(`*, autor:usuarios!ticket_mensajes_autor_id_fkey(email, nombre)`)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    ticket:   ticket as unknown as TicketConAutor | null,
    mensajes: (mensajes ?? []) as unknown as TicketMensajeDB[],
  };
}

export async function crearTicket(
  input: Pick<TicketSoporteDB, "asunto" | "descripcion" | "prioridad" | "pueblo_id" | "prestador_id">
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sin autenticación" };

  const { data, error } = await supabase
    .from("tickets_soporte")
    .insert({ ...input, abierto_por: user.id })
    .select("id, numero")
    .single();

  if (error) return { ok: false, error: error.message };

  // Avisar a los admins del ticket nuevo (push + in-app). Best-effort.
  if (data?.id) {
    await notificarAdminsNuevoTicket(data.id, data.numero, input.asunto);
  }
  return { ok: true, id: data?.id };
}

export async function responderTicket(
  ticketId: string,
  cuerpo: string,
  interno: boolean = false
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sin autenticación" };

  const { error } = await supabase
    .from("ticket_mensajes")
    .insert({ ticket_id: ticketId, autor_id: user.id, cuerpo, interno });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function cambiarEstadoTicket(
  ticketId: string,
  estado: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { estado };
  if (estado === "cerrado" || estado === "resuelto") {
    updates.cerrado_en = new Date().toISOString();
  }
  const { error } = await supabase
    .from("tickets_soporte")
    .update(updates)
    .eq("id", ticketId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function asignarTicket(
  ticketId: string,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets_soporte")
    .update({ asignado_a: adminId, estado: "en_curso" })
    .eq("id", ticketId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Remesas ──────────────────────────────────────────────────────────────

export async function getRemesas(): Promise<RemesaConPrestador[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("remesas")
    .select(`
      *,
      prestador:prestadores!remesas_prestador_id_fkey(nombre, slug)
    `)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as RemesaConPrestador[];
}

export async function crearRemesa(
  input: Pick<RemesaDB, "prestador_id" | "periodo_inicio" | "periodo_fin" | "importe_total" | "notas">
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("remesas")
    .insert(input)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}

export async function marcarRemesaPagada(
  remesaId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  // Marcar remesa pagada
  const { error } = await supabase
    .from("remesas")
    .update({ estado: "pagada", pagada_en: new Date().toISOString() })
    .eq("id", remesaId);

  if (error) return { ok: false, error: error.message };

  // Marcar comisiones acumuladas como facturadas
  await supabase
    .from("comision_acumulada")
    .update({ facturado: true })
    .eq("remesa_id", remesaId);

  return { ok: true };
}

export async function getComisionesDelPrestadorAdmin(
  prestadorId: string,
  soloNoFacturadas = true
) {
  const supabase = await createClient();
  let query = supabase
    .from("comision_acumulada")
    .select("*")
    .eq("prestador_id", prestadorId)
    .order("created_at", { ascending: false });

  if (soloNoFacturadas) query = query.eq("facturado", false);

  const { data } = await query;
  return data ?? [];
}

// ─── Logs (audit) ─────────────────────────────────────────────────────────

export async function getAuditLog(filtros?: {
  tabla?:    string;
  usuario_id?: string;
  limit?:    number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select(`
      *,
      usuario:usuarios!audit_log_usuario_id_fkey(email, nombre)
    `)
    .order("created_at", { ascending: false })
    .limit(filtros?.limit ?? 100);

  if (filtros?.tabla)      query = query.eq("tabla", filtros.tabla);
  if (filtros?.usuario_id) query = query.eq("usuario_id", filtros.usuario_id);

  const { data } = await query;
  return data ?? [];
}
