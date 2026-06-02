import { createClient } from "@/lib/supabase/server";
import type { ParteTrabajoDB, ParteConPresupuesto, MetodoCobro } from "@/types/servicios-pro";

// ─── Lectura ──────────────────────────────────────────────────────────────────

export async function getPartesDelPrestador(
  prestadorId: string,
): Promise<ParteConPresupuesto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partes_trabajo")
    .select(`
      *,
      presupuesto:presupuestos(numero, cliente_nombre, cliente_telefono, cliente_email)
    `)
    .eq("prestador_id", prestadorId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ParteConPresupuesto[];
}

export async function getParte(id: string): Promise<ParteConPresupuesto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partes_trabajo")
    .select(`
      *,
      presupuesto:presupuestos(numero, cliente_nombre, cliente_telefono, cliente_email)
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ParteConPresupuesto;
}

// ─── Escritura ────────────────────────────────────────────────────────────────

export async function crearParte(data: {
  prestador_id:       string;
  presupuesto_id?:    string;
  reserva_id?:        string;
  fecha_trabajo:      string;
  duracion_horas?:    number;
  trabajo_realizado:  string;
  materiales?:        string;
  importe_final:      number;
  cliente_firma_url?: string;
  fotos_urls?:        string[];
  cobrado?:           boolean;
  metodo_cobro?:      MetodoCobro;
  registrado_por?:    string;
}): Promise<ParteTrabajoDB> {
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("partes_trabajo")
    .insert({
      prestador_id:       data.prestador_id,
      presupuesto_id:     data.presupuesto_id ?? null,
      reserva_id:         data.reserva_id ?? null,
      fecha_trabajo:      data.fecha_trabajo,
      duracion_horas:     data.duracion_horas ?? null,
      trabajo_realizado:  data.trabajo_realizado,
      materiales:         data.materiales ?? null,
      importe_final:      data.importe_final,
      cliente_firma_url:  data.cliente_firma_url ?? null,
      fotos_urls:         data.fotos_urls ?? [],
      cobrado:            data.cobrado ?? false,
      metodo_cobro:       data.metodo_cobro ?? null,
      registrado_por:     data.registrado_por ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return created as ParteTrabajoDB;
}

/** Cierra el parte: marca cobrado=true. El trigger DB inserta el ingreso en caja. */
export async function cerrarParte(
  id:           string,
  metodoCobro:  MetodoCobro,
  registradoPor: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("partes_trabajo")
    .update({ cobrado: true, metodo_cobro: metodoCobro, registrado_por: registradoPor })
    .eq("id", id);

  if (error) throw error;
}

export async function actualizarFirmaYFotos(
  id:           string,
  firmaUrl?:    string,
  fotosUrls?:   string[],
): Promise<void> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (firmaUrl !== undefined)  updates.cliente_firma_url = firmaUrl;
  if (fotosUrls !== undefined) updates.fotos_urls        = fotosUrls;

  const { error } = await supabase
    .from("partes_trabajo")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}
