import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import {
  getProfesionalesDelPrestador,
  crearProfesional,
  actualizarProfesional,
  toggleProfesionalActivo,
  asignarServiciosAProfesional,
} from "@/lib/supabase/queries/profesionales";
import ProfesionalesView from "@/components/sections/panel/profesionales/ProfesionalesView";

export default async function PanelProfesionalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: perfil } = await supabase
    .from("usuarios").select("tipo").eq("id", user.id).single();

  // Solo propietario — encargados no gestionan equipo profesional
  if (perfil?.tipo !== "prestador") redirect("/panel");

  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const profesionales = await getProfesionalesDelPrestador(prestador.id);
  const servicios = (prestador.servicios ?? []).filter((s: { activo: boolean }) => s.activo);

  // ── Server Actions ────────────────────────────────────────────────────────

  async function handleCrear(fd: FormData): Promise<{ ok: boolean; error?: string }> {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false, error: "Sin negocio" };

    try {
      const pro = await crearProfesional({
        prestador_id: p.id,
        nombre:       (fd.get("nombre") as string).trim(),
        apellidos:    ((fd.get("apellidos") as string) ?? "").trim(),
        especialidad: (fd.get("especialidad") as string) || null,
        bio:          (fd.get("bio") as string) || null,
        color:        (fd.get("color") as string) || "#9333ea",
        foto_url:     (fd.get("foto_url") as string) || null,
      });

      const servicioIds = fd.getAll("servicio_ids[]").map(String).filter(Boolean);
      if (servicioIds.length > 0) {
        await asignarServiciosAProfesional(pro.id, servicioIds);
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleActualizar(
    id: string,
    fd: FormData,
  ): Promise<{ ok: boolean; error?: string }> {
    "use server";
    try {
      await actualizarProfesional(id, {
        nombre:      (fd.get("nombre") as string).trim(),
        apellidos:   ((fd.get("apellidos") as string) ?? "").trim(),
        especialidad:(fd.get("especialidad") as string) || null,
        bio:         (fd.get("bio") as string) || null,
        color:       (fd.get("color") as string) || "#9333ea",
        foto_url:    (fd.get("foto_url") as string) || null,
      });

      const servicioIds = fd.getAll("servicio_ids[]").map(String).filter(Boolean);
      await asignarServiciosAProfesional(id, servicioIds);

      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleToggle(
    id: string,
    activo: boolean,
  ): Promise<{ ok: boolean }> {
    "use server";
    try {
      await toggleProfesionalActivo(id, activo);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  return (
    <main className="flex-1 p-8 max-md:p-4">
      <div className="mb-6 hidden md:block">
        <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-text-muted mb-1">
          Panel del negocio
        </p>
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body">
          Profesionales
        </h1>
      </div>
      <ProfesionalesView
        profesionales={profesionales}
        servicios={servicios}
        onCrear={handleCrear}
        onActualizar={handleActualizar}
        onToggle={handleToggle}
      />
    </main>
  );
}
