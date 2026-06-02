import { createClient } from "@/lib/supabase/server";
import type { EventoDB, EventoCard, CategoriaEvento } from "@/types/eventos";
import { CATEGORIA_EVENTO_LABEL } from "@/types/eventos";

const MES_ABREV = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

function mapToCard(e: EventoDB): EventoCard {
  const d = new Date(e.fecha_inicio);
  return {
    id: e.id,
    slug: e.slug,
    titulo: e.titulo,
    descripcionCorta: e.descripcion_corta ?? e.descripcion ?? null,
    categoria: e.categoria as CategoriaEvento,
    categoriaLabel: CATEGORIA_EVENTO_LABEL[e.categoria] ?? "Evento",
    diaNumero: String(d.getDate()).padStart(2, "0"),
    diaMesAbrev: MES_ABREV[d.getMonth()],
    horaInicio: e.todo_el_dia
      ? null
      : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    lugar: e.lugar,
    gratis: e.gratis,
    precio: e.precio,
    precioDisplay: e.gratis || e.precio == null || e.precio === 0 ? "Gratis" : `${e.precio}€`,
    imagenUrl: e.imagen_url,
    esDestacado: e.destacado,
  };
}

export async function getEventos(
  puebloId: number,
  filtros: { categoria?: string; cuando?: string } = {},
): Promise<EventoCard[]> {
  const supabase = await createClient();
  const now = new Date();

  let q = supabase
    .from("eventos")
    .select("*")
    .eq("pueblo_id", puebloId)
    .eq("activo", true)
    .order("destacado", { ascending: false })
    .order("fecha_inicio", { ascending: true });

  if (filtros.categoria) {
    q = q.eq("categoria", filtros.categoria);
  }

  if (filtros.cuando === "hoy") {
    const inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const fin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    q = q.gte("fecha_inicio", inicio).lt("fecha_inicio", fin);
  } else if (filtros.cuando === "semana") {
    const inicio = now.toISOString();
    const fin = new Date(now.getTime() + 7 * 86400000).toISOString();
    q = q.gte("fecha_inicio", inicio).lt("fecha_inicio", fin);
  } else if (filtros.cuando === "mes") {
    const inicio = now.toISOString();
    const fin = new Date(now.getTime() + 30 * 86400000).toISOString();
    q = q.gte("fecha_inicio", inicio).lt("fecha_inicio", fin);
  } else {
    q = q.gte("fecha_inicio", now.toISOString());
  }

  const { data, error } = await q;
  if (error) {
    console.error("[getEventos]", error);
    return [];
  }
  return (data ?? []).map(e => mapToCard(e as unknown as EventoDB));
}

export async function getEventoBySlug(
  puebloId: number,
  slug: string,
): Promise<EventoDB | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("eventos")
    .select("*")
    .eq("pueblo_id", puebloId)
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();
  return (data ?? null) as EventoDB | null;
}
