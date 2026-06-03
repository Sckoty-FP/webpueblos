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

  // NOTA: no se puede ordenar/filtrar por una columna de tabla embebida con notación
  // `sesion.fecha` en el nivel superior (PostgREST devuelve PGRST100 "failed to parse order").
  // Traemos las inscripciones del usuario y filtramos (futuras) + ordenamos por fecha en JS:
  // el volumen por usuario es mínimo, así que es más simple y robusto que pelear con foreignTable.
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
    .eq("cliente_id", userId);

  if (error) {
    console.error("[getInscripcionesUsuario]", error);
    return [];
  }

  return (data ?? [])
    .map((r: Record<string, unknown>) => {
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
    })
    .filter(i => i.sesion_fecha >= today)
    .sort((a, b) => a.sesion_fecha.localeCompare(b.sesion_fecha));
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
 * Dirección guardada del usuario.
 *
 * El modelo NO usa una tabla `usuario_direccion_default` (no existe): la migración 023
 * guarda UNA dirección por defecto como columnas en `usuarios`
 * (`direccion_default`, `lat_default`, `lon_default`). El delivery la lee/escribe vía
 * `getDireccionDefault` / `guardarDireccionDefault` (lib/supabase/queries/usuarios.ts).
 * Devolvemos un array de 0 ó 1 elemento para no romper el contrato del componente de perfil.
 */
export async function getDireccionesUsuario(userId: string): Promise<DireccionGuardada[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("usuarios")
    .select("direccion_default, lat_default, lon_default")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getDireccionesUsuario]", error);
    return [];
  }

  // Sin dirección guardada todavía (aún no hizo el primer pedido) → lista vacía.
  if (!data?.direccion_default) return [];

  return [{
    id: userId,
    etiqueta: "Mi dirección",
    direccion: data.direccion_default as string,
    piso: null,
    codigo_postal: null,
    pueblo_slug: "",
    pueblo_nombre: "",
    es_default: true,
    lat: (data.lat_default as number | null) ?? null,
    lng: (data.lon_default as number | null) ?? null,
  }];
}
