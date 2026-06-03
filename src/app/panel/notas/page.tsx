import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { getPrestadorComoEncargado } from "@/lib/supabase/queries/equipo";
import {
  getNotasNegocio,
  crearNota,
  actualizarNota,
  marcarRecordatorioCompletado,
  posponerRecordatorio,
  eliminarNota,
} from "@/lib/supabase/queries/notas";
import type { NotaNegocioDB } from "@/types/notas";
import NotasView from "@/components/sections/panel/notas/NotasView";

export default async function PanelNotasPage() {
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
  const notas = await getNotasNegocio(prestador.id);

  // Server Actions
  async function handleCrear(formData: FormData) {
    "use server";
    const p = tipo === "prestador" ? await getPrestadorDelUsuario() : await getPrestadorComoEncargado();
    if (!p) return;
    const titulo = formData.get("titulo") as string;
    if (!titulo) return;
    await crearNota({
      prestador_id: p.id,
      titulo,
      contenido: (formData.get("contenido") as string) || "",
      importante: formData.get("importante") === "1",
      recordatorio_fecha: (formData.get("recordatorio_fecha") as string) || undefined,
    });
    // Revalidar para que la lista refleje la nota nueva sin recargar a mano.
    revalidatePath("/panel/notas");
  }

  async function handleActualizar(id: string, data: Partial<NotaNegocioDB>) {
    "use server";
    await actualizarNota(id, data);
    revalidatePath("/panel/notas");
  }

  async function handleCompletar(id: string) {
    "use server";
    await marcarRecordatorioCompletado(id);
    revalidatePath("/panel/notas");
  }

  async function handlePosponer(id: string) {
    "use server";
    await posponerRecordatorio(id, 1);
    revalidatePath("/panel/notas");
  }

  async function handleEliminar(id: string) {
    "use server";
    await eliminarNota(id);
    revalidatePath("/panel/notas");
  }

  return (
    <NotasView
      notas={notas}
      userId={user.id}
      isPropietario={isPropietario}
      onCrear={handleCrear}
      onActualizar={handleActualizar}
      onCompletar={handleCompletar}
      onPosponer={handlePosponer}
      onEliminar={handleEliminar}
    />
  );
}
