import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import type { PresupuestoDB, LineaPresupuesto, PresupuestoEstado } from "@/types/servicios-pro";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcularTotales(lineas: LineaPresupuesto[], ivaPct: number) {
  const base  = lineas.reduce((s, l) => s + l.importe, 0);
  const total = base * (1 + ivaPct / 100);
  return { importe_base: parseFloat(base.toFixed(2)), importe_total: parseFloat(total.toFixed(2)) };
}

// ─── Lectura ──────────────────────────────────────────────────────────────────

export async function getPresupuestosDelPrestador(
  prestadorId:  string,
  estado?:      PresupuestoEstado | 'solicitud',
): Promise<PresupuestoDB[]> {
  const supabase = await createClient();
  let q = supabase
    .from("presupuestos")
    .select("*")
    .eq("prestador_id", prestadorId)
    .order("created_at", { ascending: false });

  if (estado === 'solicitud') {
    q = q.eq("es_solicitud_publica", true).eq("estado", "borrador");
  } else if (estado) {
    q = q.eq("estado", estado).eq("es_solicitud_publica", false);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PresupuestoDB[];
}

export async function getPresupuesto(id: string): Promise<PresupuestoDB | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as PresupuestoDB;
}

/**
 * Lookup por token para la página pública de aceptación (cliente SIN cuenta).
 * Va por la RPC `presupuesto_por_token` (SECURITY DEFINER): el anónimo no puede
 * leer la tabla directo (RLS), y la función solo devuelve la fila del token
 * exacto. Ver migración 044.
 */
export async function getPresupuestoByToken(token: string): Promise<PresupuestoDB | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("presupuesto_por_token", { p_token: token })
    .single();
  if (error) return null;
  return data as PresupuestoDB;
}

// ─── Escritura ────────────────────────────────────────────────────────────────

export async function crearPresupuesto(data: {
  prestador_id:         string;
  cliente_nombre:       string;
  cliente_email?:       string;
  cliente_telefono?:    string;
  cliente_direccion?:   string;
  descripcion?:         string;
  lineas:               LineaPresupuesto[];
  iva_porcentaje?:      number;
  valido_hasta?:        string;
  notas?:               string;
  reserva_id?:          string;
  es_solicitud_publica?: boolean;
}): Promise<PresupuestoDB> {
  const supabase = await createClient();
  const iva      = data.iva_porcentaje ?? 21;
  const { importe_base, importe_total } = calcularTotales(data.lineas, iva);

  const { data: created, error } = await supabase
    .from("presupuestos")
    .insert({
      prestador_id:         data.prestador_id,
      cliente_nombre:       data.cliente_nombre,
      cliente_email:        data.cliente_email ?? null,
      cliente_telefono:     data.cliente_telefono ?? null,
      cliente_direccion:    data.cliente_direccion ?? null,
      descripcion:          data.descripcion ?? '',
      lineas:               data.lineas,
      importe_base,
      iva_porcentaje:       iva,
      importe_total,
      estado:               'borrador' as PresupuestoEstado,
      valido_hasta:         data.valido_hasta ?? null,
      notas:                data.notas ?? null,
      reserva_id:           data.reserva_id ?? null,
      es_solicitud_publica: data.es_solicitud_publica ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return created as PresupuestoDB;
}

export async function actualizarPresupuesto(
  id:   string,
  data: Partial<{
    cliente_nombre:     string;
    cliente_email:      string;
    cliente_telefono:   string;
    cliente_direccion:  string;
    descripcion:        string;
    lineas:             LineaPresupuesto[];
    iva_porcentaje:     number;
    valido_hasta:       string;
    notas:              string;
  }>,
): Promise<void> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { ...data };

  if (data.lineas !== undefined) {
    const iva = data.iva_porcentaje ?? 21;
    const { importe_base, importe_total } = calcularTotales(data.lineas, iva);
    updates.importe_base  = importe_base;
    updates.importe_total = importe_total;
  }

  const { error } = await supabase
    .from("presupuestos")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

/** Genera token UUID, cambia estado a 'enviado', retorna el token para construir el link. */
export async function enviarPresupuesto(id: string): Promise<{ token: string; numero: string }> {
  const supabase = await createClient();

  const token   = randomUUID();
  const expira  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

  const { data, error } = await supabase
    .from("presupuestos")
    .update({
      estado:           'enviado',
      token_aceptacion: token,
      token_expira:     expira.toISOString(),
    })
    .eq("id", id)
    .select("numero")
    .single();

  if (error) throw error;
  return { token, numero: (data as { numero: string }).numero };
}

/**
 * Acepta un presupuesto por token (página pública, sin auth). Vía RPC
 * `presupuesto_aceptar_por_token` (SECURITY DEFINER), que valida estado y
 * expiración de forma ATÓMICA en la base (sin carrera lectura→update). Ver 044.
 */
export async function aceptarPresupuesto(token: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("presupuesto_aceptar_por_token", { p_token: token });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

/** Rechaza un presupuesto por token (página pública). Vía RPC SECURITY DEFINER. */
export async function rechazarPresupuesto(token: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("presupuesto_rechazar_por_token", { p_token: token });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

/**
 * Crea una SOLICITUD pública de presupuesto (cliente sin cuenta pide a un
 * prestador). Vía RPC `solicitar_presupuesto_publico` (SECURITY DEFINER): el
 * anónimo no puede insertar en la tabla (RLS) y la función solo permite crear
 * una solicitud (borrador, importes en 0). Ver migración 044.
 */
export async function solicitarPresupuestoPublico(input: {
  prestador_id:      string;
  cliente_nombre:    string;
  descripcion:       string;
  cliente_email?:    string;
  cliente_telefono?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("solicitar_presupuesto_publico", {
    p_prestador_id:     input.prestador_id,
    p_cliente_nombre:   input.cliente_nombre,
    p_descripcion:      input.descripcion,
    p_cliente_email:    input.cliente_email    ?? null,
    p_cliente_telefono: input.cliente_telefono ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

/** Actualiza la URL del PDF generado. */
export async function actualizarPdfUrl(id: string, pdfUrl: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("presupuestos")
    .update({ pdf_url: pdfUrl })
    .eq("id", id);
  if (error) throw error;
}
