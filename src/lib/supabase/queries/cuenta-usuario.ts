// web/src/lib/supabase/queries/cuenta-usuario.ts
import { createClient } from "@/lib/supabase/server";

// ─── Inscripciones free tour ──────────────────────────────────────────────────

export interface InscripcionFreeTour {
  id: string;
  tour_nombre: string;
  tour_slug: string;
  pueblo_slug: string;
  pueblo_nombre: string;
  sesion_fecha: string;
  sesion_hora: string;
  num_personas: number;
  estado: "confirmada" | "cancelada_cliente" | "cancelada_guia" | "no_show" | "asistio";
  punto_encuentro: string | null;
  created_at: string;
}

/**
 * Inscripciones futuras del usuario a free tours.
 * Requiere `cliente_id` en `free_tour_inscripciones` (migración del sprint free-tour).
 * Si esa columna no existe o no tiene datos, devuelve [].
 */
export async function getInscripcionesUsuario(userId: string): Promise<InscripcionFreeTour[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("free_tour_inscripciones")
    .select(`
      id,
      num_personas,
      estado,
      created_at,
      sesion:free_tour_sesiones!free_tour_inscripciones_sesion_id_fkey (
        fecha,
        hora,
        tour:free_tours!free_tour_sesiones_tour_id_fkey (
          titulo,
          slug,
          punto_encuentro_nombre,
          pueblo:pueblos!free_tours_pueblo_id_fkey (slug, nombre)
        )
      )
    `)
    .eq("cliente_id", userId)
    .gte("sesion.fecha", today)
    .order("sesion.fecha", { ascending: true });

  if (error) {
    console.error("[getInscripcionesUsuario]", error);
    return [];
  }

  return (data ?? []).map((r: Record<string, unknown>) => {
    const sesion = r.sesion as Record<string, unknown> | null;
    const tour = sesion?.tour as Record<string, unknown> | null;
    const pueblo = tour?.pueblo as Record<string, unknown> | null;
    return {
      id: r.id as string,
      tour_nombre: (tour?.titulo as string) ?? "Tour",
      tour_slug: (tour?.slug as string) ?? "",
      pueblo_slug: (pueblo?.slug as string) ?? "",
      pueblo_nombre: (pueblo?.nombre as string) ?? "",
      sesion_fecha: (sesion?.fecha as string) ?? "",
      sesion_hora: (sesion?.hora as string) ?? "",
      num_personas: r.num_personas as number,
      estado: r.estado as InscripcionFreeTour["estado"],
      punto_encuentro: (tour?.punto_encuentro_nombre as string | null) ?? null,
      created_at: r.created_at as string,
    };
  });
}

// ─── Posts del muro propios ───────────────────────────────────────────────────

export interface PostMuroPropio {
  id: string;
  contenido: string;
  imagenes_urls: string[] | null;
  total_likes: number;
  total_comentarios: number;
  expires_at: string;   // computed: created_at + 24h
  created_at: string;
  pueblo_slug: string;
  pueblo_nombre: string;
}

/**
 * Posts del muro del usuario activos en las últimas 24h.
 * `muro_posts` usa `autor_id` (no `usuario_id`).
 */
export async function getPostsMuroPropios(userId: string): Promise<PostMuroPropio[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("muro_posts")
    .select(`
      id, contenido, imagenes_urls, total_likes, total_comentarios, created_at,
      pueblo:pueblos!muro_posts_pueblo_id_fkey (slug, nombre)
    `)
    .eq("autor_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPostsMuroPropios]", error);
    return [];
  }

  return (data ?? []).map((p: Record<string, unknown>) => {
    const pueblo = p.pueblo as Record<string, unknown> | null;
    const createdAt = p.created_at as string;
    return {
      id: p.id as string,
      contenido: p.contenido as string,
      imagenes_urls: (p.imagenes_urls as string[] | null) ?? null,
      total_likes: (p.total_likes as number) ?? 0,
      total_comentarios: (p.total_comentarios as number) ?? 0,
      expires_at: new Date(new Date(createdAt).getTime() + 24 * 3600 * 1000).toISOString(),
      created_at: createdAt,
      pueblo_slug: (pueblo?.slug as string) ?? "",
      pueblo_nombre: (pueblo?.nombre as string) ?? "",
    };
  });
}

// ─── Direcciones guardadas ────────────────────────────────────────────────────

export interface DireccionGuardada {
  id: string;
  etiqueta: string;
  direccion: string;
  piso: string | null;
  codigo_postal: string | null;
  pueblo_slug: string;
  pueblo_nombre: string;
  es_default: boolean;
  lat: number | null;
  lng: number | null;
}

/**
 * Direcciones guardadas del usuario (tabla `usuario_direccion_default`, migración 023).
 */
export async function getDireccionesUsuario(userId: string): Promise<DireccionGuardada[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("usuario_direccion_default")
    .select(`
      id, etiqueta, direccion, piso, codigo_postal, lat, lng, es_default,
      pueblo:pueblos!usuario_direccion_default_pueblo_id_fkey (slug, nombre)
    `)
    .eq("usuario_id", userId);

  if (error) {
    console.error("[getDireccionesUsuario]", error);
    return [];
  }

  return (data ?? []).map((d: Record<string, unknown>) => {
    const pueblo = d.pueblo as Record<string, unknown> | null;
    return {
      id: d.id as string,
      etiqueta: (d.etiqueta as string) ?? "Mi dirección",
      direccion: d.direccion as string,
      piso: (d.piso as string | null) ?? null,
      codigo_postal: (d.codigo_postal as string | null) ?? null,
      pueblo_slug: (pueblo?.slug as string) ?? "",
      pueblo_nombre: (pueblo?.nombre as string) ?? "",
      es_default: !!(d.es_default),
      lat: (d.lat as number | null) ?? null,
      lng: (d.lng as number | null) ?? null,
    };
  });
}
