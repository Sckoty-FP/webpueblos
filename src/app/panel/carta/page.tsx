import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { getPrestadorComoEncargado } from "@/lib/supabase/queries/equipo";
import {
  getPlatosDelPrestador,
  crearPlato,
  actualizarPlato,
  togglePlatoDisponibilidad,
  eliminarPlato,
} from "@/lib/supabase/queries/carta";
import CartaView from "@/components/sections/panel/carta/CartaView";

export default async function PanelCartaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: perfil } = await supabase
    .from("usuarios").select("tipo").eq("id", user.id).single();
  const tipo = perfil?.tipo;
  if (tipo !== "prestador" && tipo !== "encargado") redirect("/");

  const prestador = tipo === "prestador"
    ? await getPrestadorDelUsuario()
    : await getPrestadorComoEncargado();
  if (!prestador) redirect("/auth/login");

  const isPropietario = tipo === "prestador";
  const platos = await getPlatosDelPrestador(prestador.id);

  async function handleCrear(fd: FormData): Promise<{ ok: boolean; error?: string }> {
    "use server";
    if (!isPropietario) return { ok: false, error: "Sin permisos" };
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false, error: "Sin negocio" };

    const alergenos = fd.getAll("alergenos[]").map(String);

    return crearPlato(p.id, {
      nombre: fd.get("nombre") as string,
      descripcion: (fd.get("descripcion") as string) || undefined,
      categoria: (fd.get("categoria") as string) || "principal",
      precio: parseFloat(fd.get("precio") as string),
      precio_oferta: fd.get("precio_oferta") ? parseFloat(fd.get("precio_oferta") as string) : undefined,
      imagen_url: (fd.get("imagen_url") as string) || undefined,
      alergenos,
      vegetariano: fd.get("vegetariano") === "1",
      vegano: fd.get("vegano") === "1",
      sin_gluten: fd.get("sin_gluten") === "1",
      disponible_local: fd.get("disponible_local") === "1",
      disponible_delivery: fd.get("disponible_delivery") === "1",
      tiempo_preparacion_min: fd.get("tiempo_preparacion_min")
        ? parseInt(fd.get("tiempo_preparacion_min") as string)
        : 15,
    });
  }

  async function handleActualizar(id: string, fd: FormData): Promise<{ ok: boolean; error?: string }> {
    "use server";
    if (!isPropietario) return { ok: false, error: "Sin permisos" };

    const alergenos = fd.getAll("alergenos[]").map(String);

    return actualizarPlato(id, {
      nombre: fd.get("nombre") as string,
      descripcion: (fd.get("descripcion") as string) || null,
      categoria: fd.get("categoria") as string,
      precio: parseFloat(fd.get("precio") as string),
      precio_oferta: fd.get("precio_oferta") ? parseFloat(fd.get("precio_oferta") as string) : null,
      imagen_url: (fd.get("imagen_url") as string) || null,
      alergenos,
      vegetariano: fd.get("vegetariano") === "1",
      vegano: fd.get("vegano") === "1",
      sin_gluten: fd.get("sin_gluten") === "1",
      disponible_local: fd.get("disponible_local") === "1",
      disponible_delivery: fd.get("disponible_delivery") === "1",
      tiempo_preparacion_min: fd.get("tiempo_preparacion_min")
        ? parseInt(fd.get("tiempo_preparacion_min") as string)
        : 15,
    });
  }

  async function handleToggle(
    id: string,
    campo: "disponible_local" | "disponible_delivery" | "activo",
    valor: boolean
  ): Promise<{ ok: boolean }> {
    "use server";
    if (!isPropietario) return { ok: false };
    return togglePlatoDisponibilidad(id, campo, valor);
  }

  async function handleEliminar(id: string): Promise<{ ok: boolean }> {
    "use server";
    if (!isPropietario) return { ok: false };
    return eliminarPlato(id);
  }

  return (
    <CartaView
      prestadorId={prestador.id}
      platos={platos}
      onCrear={handleCrear}
      onActualizar={handleActualizar}
      onToggle={handleToggle}
      onEliminar={handleEliminar}
    />
  );
}
