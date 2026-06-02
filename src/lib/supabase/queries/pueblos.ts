import { createClient } from "@/lib/supabase/server";

export interface PuebloDB {
  id: number;
  slug: string;
  nombre: string;
  nombre_completo: string | null;
  provincia: string | null;
  descripcion_corta: string | null;
  imagen_portada: string | null;
  imagen_logo: string | null;
  color_primario: string;
  activo: boolean;
  /** Set de fotos del hero rotativo (migración 039). Vacío = usa imagen_portada. */
  imagenes_hero?: string[];
}

const PUEBLO_BASE =
  "id, slug, nombre, nombre_completo, provincia, descripcion_corta, imagen_portada, imagen_logo, color_primario, activo";

export async function getPueblos(): Promise<PuebloDB[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pueblos")
    .select(PUEBLO_BASE)
    .eq("activo", true)
    .order("nombre");
  return (data ?? []) as PuebloDB[];
}

export async function getPuebloBySlug(slug: string): Promise<PuebloDB | null> {
  const supabase = await createClient();

  // Intenta traer imagenes_hero (migración 039). Si la columna todavía no
  // existe, reintenta sin ella para no romper la página antes de aplicarla.
  const withHero = await supabase
    .from("pueblos")
    .select(`${PUEBLO_BASE}, imagenes_hero`)
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!withHero.error) {
    const d = withHero.data as PuebloDB & { imagenes_hero: string[] | null };
    return { ...d, imagenes_hero: d.imagenes_hero ?? [] };
  }

  const { data } = await supabase
    .from("pueblos")
    .select(PUEBLO_BASE)
    .eq("slug", slug)
    .eq("activo", true)
    .single();
  return (data as PuebloDB) ?? null;
}
