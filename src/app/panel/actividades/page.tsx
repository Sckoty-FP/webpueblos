import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import {
  getRecursosDelPrestador,
  crearRecurso,
  actualizarRecurso,
  toggleRecursoActivo,
} from "@/lib/supabase/queries/actividades";
import ActividadesView from "@/components/sections/panel/actividades/ActividadesView";
import type { RecursoFormData } from "@/components/sections/panel/actividades/ActividadesView";
import type { TipoRecurso, EstadoRecurso } from "@/types/actividades";
import { CATS_ACTIVIDADES_SET } from "@/types/actividades";

export default async function PanelActividadesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: perfil } = await supabase
    .from("usuarios").select("tipo").eq("id", user.id).single();
  if (perfil?.tipo !== "prestador") redirect("/panel");

  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  // Solo negocios de actividades pueden acceder
  const cats = new Set((prestador.servicios ?? []).map((s: { categoria: string }) => s.categoria));
  const tieneActividades = [...cats].some(c => CATS_ACTIVIDADES_SET.has(c));
  if (!tieneActividades) redirect("/panel");

  const recursos = await getRecursosDelPrestador(prestador.id);

  // Servicios del tipo actividades para vincular recursos
  const serviciosActividades = (prestador.servicios ?? [])
    .filter((s: { activo: boolean; categoria: string }) => s.activo && CATS_ACTIVIDADES_SET.has(s.categoria))
    .map((s: { id: string; nombre: string }) => ({ id: s.id, nombre: s.nombre }));

  // ── Server Actions ──────────────────────────────────────────────────────────

  async function handleCrear(
    fd: RecursoFormData,
  ): Promise<{ ok: boolean; error?: string }> {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false, error: "Sin negocio" };
    try {
      let caracteristicas: Record<string, string> = {};
      if (fd.caracteristicas.trim()) {
        try { caracteristicas = JSON.parse(fd.caracteristicas); } catch { /* ignora JSON inválido */ }
      }
      await crearRecurso({
        prestador_id:    p.id,
        tipo:            fd.tipo as TipoRecurso,
        nombre:          fd.nombre.trim(),
        identificador:   fd.identificador.trim() || undefined,
        capacidad:       parseInt(fd.capacidad) || 1,
        precio_hora:     fd.precio_hora ? parseFloat(fd.precio_hora) : undefined,
        precio_dia:      fd.precio_dia  ? parseFloat(fd.precio_dia)  : undefined,
        estado:          fd.estado as EstadoRecurso,
        servicio_id:     fd.servicio_id || undefined,
        caracteristicas,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleActualizar(
    id: string,
    fd: RecursoFormData,
  ): Promise<{ ok: boolean; error?: string }> {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false, error: "Sin negocio" };
    try {
      let caracteristicas: Record<string, string> = {};
      if (fd.caracteristicas.trim()) {
        try { caracteristicas = JSON.parse(fd.caracteristicas); } catch { /* ignora JSON inválido */ }
      }
      await actualizarRecurso(id, {
        tipo:            fd.tipo as TipoRecurso,
        nombre:          fd.nombre.trim(),
        identificador:   fd.identificador.trim() || undefined,
        capacidad:       parseInt(fd.capacidad) || 1,
        precio_hora:     fd.precio_hora ? parseFloat(fd.precio_hora) : undefined,
        precio_dia:      fd.precio_dia  ? parseFloat(fd.precio_dia)  : undefined,
        estado:          fd.estado as EstadoRecurso,
        servicio_id:     fd.servicio_id || undefined,
        caracteristicas,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleToggle(
    id:     string,
    activo: boolean,
  ): Promise<{ ok: boolean }> {
    "use server";
    try {
      await toggleRecursoActivo(id, activo);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="px-8 py-6 hidden md:block flex-none">
        <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-text-muted mb-1">
          Panel del negocio
        </p>
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body">
          Actividades — Recursos
        </h1>
      </div>
      <ActividadesView
        recursos={recursos}
        servicios={serviciosActividades}
        onCrear={handleCrear}
        onActualizar={handleActualizar}
        onToggle={handleToggle}
      />
    </main>
  );
}
