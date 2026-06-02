import { createClient } from "@/lib/supabase/server";

export interface ActividadDestacada {
  id: number;
  nombre: string;
  categoria: string;
}

export async function getActividadesDestacadasPorPueblo(
  puebloIds: number[],
  limit = 4,
): Promise<Record<number, ActividadDestacada[]>> {
  if (puebloIds.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestadores")
    .select("id, nombre, pueblo_id, rating_promedio, tipo_cocina")
    .in("pueblo_id", puebloIds)
    .eq("activo", true)
    .gte("rating_promedio", 4.0)
    .order("rating_promedio", { ascending: false })
    .limit(40);

  if (error || !data) {
    console.error("[getActividadesDestacadasPorPueblo]", error);
    return {};
  }

  const grouped: Record<number, ActividadDestacada[]> = {};
  for (const pid of puebloIds) grouped[pid] = [];

  for (const row of data as Array<{
    id: number;
    nombre: string;
    pueblo_id: number;
    rating_promedio: number | null;
    tipo_cocina: string | null;
  }>) {
    grouped[row.pueblo_id]?.push({
      id: row.id,
      nombre: row.nombre,
      categoria: row.tipo_cocina ?? "Negocio",
    });
  }

  for (const pid of puebloIds) {
    const arr = grouped[pid] ?? [];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    grouped[pid] = arr.slice(0, limit);
  }

  return grouped;
}
