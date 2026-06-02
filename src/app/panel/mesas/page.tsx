import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { getPrestadorComoEncargado } from "@/lib/supabase/queries/equipo";
import { getMesasDelPrestador, crearMesa, actualizarMesa, eliminarMesa } from "@/lib/supabase/queries/mesas";
import { getPueblos } from "@/lib/supabase/queries/pueblos";
import MesasView from "@/components/sections/panel/mesas/MesasView";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function PanelMesasPage() {
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

  const [mesas, pueblos] = await Promise.all([
    getMesasDelPrestador(prestador.id),
    getPueblos(),
  ]);

  const puebloSlug = pueblos.find((p) => p.id === prestador.pueblo_id)?.slug ?? "";
  const cartaBaseUrl = `${APP_URL}/${puebloSlug}/restaurantes/${prestador.slug}/carta`;

  // Generar QR data URIs server-side para todas las mesas activas
  const qrMap: Record<string, string> = {};
  await Promise.all(
    mesas.filter((m) => m.activa).map(async (mesa) => {
      const url = `${cartaBaseUrl}?mesa=${mesa.id}`;
      qrMap[mesa.id] = await QRCode.toDataURL(url, { width: 400, margin: 2 });
    })
  );

  async function handleCrear(fd: FormData): Promise<{ ok: boolean; error?: string }> {
    "use server";
    if (!isPropietario) return { ok: false, error: "Sin permisos" };
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false, error: "Sin negocio" };
    return crearMesa(p.id, {
      numero: parseInt(fd.get("numero") as string),
      nombre: (fd.get("nombre") as string) || undefined,
      capacidad: fd.get("capacidad") ? parseInt(fd.get("capacidad") as string) : 2,
      zona: (fd.get("zona") as string) || "interior",
    });
  }

  async function handleActualizar(id: string, fd: FormData): Promise<{ ok: boolean; error?: string }> {
    "use server";
    if (!isPropietario) return { ok: false, error: "Sin permisos" };
    return actualizarMesa(id, {
      nombre: (fd.get("nombre") as string) || undefined,
      capacidad: fd.get("capacidad") ? parseInt(fd.get("capacidad") as string) : undefined,
      zona: (fd.get("zona") as string) || undefined,
    });
  }

  async function handleEliminar(id: string): Promise<{ ok: boolean }> {
    "use server";
    if (!isPropietario) return { ok: false };
    return eliminarMesa(id);
  }

  return (
    <MesasView
      mesas={mesas}
      qrMap={qrMap}
      cartaBaseUrl={cartaBaseUrl}
      onCrear={handleCrear}
      onActualizar={handleActualizar}
      onEliminar={handleEliminar}
    />
  );
}
