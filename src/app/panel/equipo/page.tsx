import { notFound, redirect } from "next/navigation";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { getStaffDelPrestador, invitarEncargado, darDeBajaEncargado } from "@/lib/supabase/queries/equipo";
import { createClient } from "@/lib/supabase/server";
import EquipoView from "@/components/sections/panel/equipo/EquipoView";

export default async function PanelEquipoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Solo el propietario puede ver esta página
  const { data: perfil } = await supabase
    .from("usuarios").select("tipo").eq("id", user.id).single();
  if (perfil?.tipo !== "prestador") notFound();

  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const staffList = await getStaffDelPrestador(prestador.id);

  // Server Actions
  async function handleInvitar(formData: FormData) {
    "use server";
    const email  = formData.get("email")  as string;
    const nombre = formData.get("nombre") as string | undefined;
    if (!email) return { ok: false, error: "El email es obligatorio" };

    const prestadorActual = await getPrestadorDelUsuario();
    if (!prestadorActual) return { ok: false, error: "No autenticado" };

    return invitarEncargado(prestadorActual.id, email, nombre || undefined);
  }

  async function handleDarDeBaja(staffId: string) {
    "use server";
    return darDeBajaEncargado(staffId);
  }

  return (
    <EquipoView
      staffList={staffList}
      prestadorId={prestador.id}
      onInvitar={handleInvitar}
      onDarDeBaja={handleDarDeBaja}
    />
  );
}
