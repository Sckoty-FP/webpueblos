import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,              lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/para-negocios`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contacto`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/premium`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacidad`,    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/terminos`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/cookies`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/aviso-legal`,   lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  const { data: pueblos } = await supabase
    .from("pueblos")
    .select("slug, updated_at")
    .eq("activo", true);

  const pueblosPages: MetadataRoute.Sitemap = (pueblos ?? []).flatMap(p => [
    { url: `${SITE_URL}/${p.slug}`,              lastModified: new Date(p.updated_at ?? Date.now()), changeFrequency: "daily"   as const, priority: 0.95 },
    { url: `${SITE_URL}/${p.slug}/gastronomia`,  lastModified: new Date(),                           changeFrequency: "daily"   as const, priority: 0.9  },
    { url: `${SITE_URL}/${p.slug}/servicios`,    lastModified: new Date(),                           changeFrequency: "weekly"  as const, priority: 0.85 },
    { url: `${SITE_URL}/${p.slug}/actividades`,  lastModified: new Date(),                           changeFrequency: "weekly"  as const, priority: 0.85 },
    { url: `${SITE_URL}/${p.slug}/free-tour`,    lastModified: new Date(),                           changeFrequency: "weekly"  as const, priority: 0.85 },
    { url: `${SITE_URL}/${p.slug}/muro`,         lastModified: new Date(),                           changeFrequency: "hourly"  as const, priority: 0.6  },
    { url: `${SITE_URL}/${p.slug}/clasificados`, lastModified: new Date(),                           changeFrequency: "daily"   as const, priority: 0.6  },
    { url: `${SITE_URL}/${p.slug}/eventos`,      lastModified: new Date(),                           changeFrequency: "daily"   as const, priority: 0.7  },
  ]);

  const { data: prestadores } = await supabase
    .from("prestadores")
    .select("slug, updated_at, servicios(categoria), pueblo:pueblos!prestadores_pueblo_id_fkey(slug)")
    .eq("activo", true);

  const GASTRO_CATS = ["restaurante", "bar", "cafeteria", "heladeria", "panaderia", "pizzeria"];
  const ACTIVIDAD_CATS = ["alquiler_bicis", "alquiler_barcos", "alquiler_motos_agua", "escuela_nautica", "actividades_aventura", "tour_guiado"];

  const prestadoresPages: MetadataRoute.Sitemap = (prestadores ?? []).map((p: any) => {
    const cats: string[] = (p.servicios ?? []).map((s: any) => s.categoria as string);
    const vertical = cats.some(c => GASTRO_CATS.includes(c))
      ? "gastronomia"
      : cats.some(c => ACTIVIDAD_CATS.includes(c))
        ? "actividades"
        : "servicios";
    return {
      url: `${SITE_URL}/${p.pueblo?.slug}/${vertical}/${p.slug}`,
      lastModified: new Date(p.updated_at ?? Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });

  const { data: tours } = await supabase
    .from("free_tours")
    .select("slug, updated_at, pueblo:pueblos!free_tours_pueblo_id_fkey(slug)")
    .eq("activo", true);

  const toursPages: MetadataRoute.Sitemap = (tours ?? []).map((t: any) => ({
    url: `${SITE_URL}/${t.pueblo?.slug}/free-tour/${t.slug}`,
    lastModified: new Date(t.updated_at ?? Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const { data: eventos } = await supabase
    .from("eventos")
    .select("slug, created_at, fecha_inicio, pueblo:pueblos!eventos_pueblo_id_fkey(slug)")
    .eq("activo", true)
    .gte("fecha_inicio", new Date().toISOString());

  const eventosPages: MetadataRoute.Sitemap = (eventos ?? []).map((e: any) => ({
    url: `${SITE_URL}/${e.pueblo?.slug}/eventos/${e.slug}`,
    lastModified: new Date(e.created_at ?? Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...pueblosPages, ...prestadoresPages, ...toursPages, ...eventosPages];
}
