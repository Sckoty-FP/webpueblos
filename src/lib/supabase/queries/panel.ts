import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PrestadorDB, PropiedadDB } from "@/types";

export type PanelPrestador = PrestadorDB & {
  total_reservas: number;
  total_visualizaciones: number;
  suscripcion_estado: string | null;
};

// React.cache deduplicates this call within the same render cycle
// so layout + page can both call it with zero extra DB round-trips
export const getPrestadorDelUsuario = cache(async (): Promise<PanelPrestador | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("prestadores")
    .select(`
      id, pueblo_id, nombre, slug, descripcion, descripcion_corta,
      email, telefono, whatsapp, web, instagram, facebook, tiktok,
      direccion, imagen_portada_url, galeria_urls,
      verificado, activo, destacado, rating_promedio, total_reviews,
      total_reservas, total_visualizaciones,
      suscripcion_plan, suscripcion_estado, tipo_cocina,
      lat:latitud, lon:longitud, delivery_activo, delivery_modo, free_tour_activo, created_at,
      servicios(id, nombre, slug, descripcion, categoria, precio_desde, precio_hasta, precio_unidad, reservable, duracion_minutos, capacidad_maxima, descuento_premium_porcentaje, descuento_premium_descripcion, activo, orden_visualizacion),
      horarios(dia_semana, hora_apertura, hora_cierre, cerrado, notas)
    `)
    .eq("propietario_id", user.id)
    .single();

  if (error || !data) return null;
  return data as unknown as PanelPrestador;
});

export async function getPropiedadesDelPrestador(prestadorId: string): Promise<PropiedadDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("propiedades")
    .select("id, prestador_id, pueblo_id, nombre, tipo, capacidad, precio_noche, descripcion, fotos_urls, activo, created_at")
    .eq("prestador_id", prestadorId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as PropiedadDB[];
}

export async function getReservasDelUsuario() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("reservas")
    .select(`
      id, numero_reserva, fecha, hora, num_personas, estado, precio_final, created_at,
      servicio:servicios(nombre),
      prestador:prestadores(nombre, slug)
    `)
    .eq("usuario_id", user.id)
    .order("fecha", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data as unknown as import("@/types").ReservaUsuarioDB[];
}

export async function getReservasDelPrestador(prestadorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservas")
    .select(`
      id, numero_reserva, fecha, hora, duracion_minutos, num_personas, estado,
      nombre_cliente, email_cliente, telefono_cliente, notas_cliente,
      precio_final, created_at, profesional_id, recurso_id,
      servicios(id, nombre, categoria)
    `)
    .eq("prestador_id", prestadorId)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(200);

  if (error || !data) return [];
  type EstadoReserva = "pendiente"|"confirmada"|"rechazada"|"cancelada"|"completada"|"no_show";
  return data as unknown as {
    id: string; numero_reserva: string; fecha: string; hora: string;
    duracion_minutos: number; num_personas: number; estado: EstadoReserva;
    nombre_cliente: string; email_cliente: string; telefono_cliente: string;
    notas_cliente: string | null; precio_final: number; created_at: string;
    profesional_id: string | null; recurso_id: string | null;
    servicios: { id: string; nombre: string; categoria: string } | null;
  }[];
}
