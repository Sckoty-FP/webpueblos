import { redirect } from "next/navigation";
import { getPrestadorDelUsuario, getReservasDelPrestador } from "@/lib/supabase/queries/panel";
import { getMesasDelPrestador } from "@/lib/supabase/queries/mesas";
import { getProfesionalesActivos } from "@/lib/supabase/queries/profesionales";
import { getRecursosActivos } from "@/lib/supabase/queries/actividades";
import ReservasManager from "@/components/sections/panel/ReservasManager";
import { CATS_ACTIVIDADES_SET } from "@/types/actividades";

export default async function PanelReservasPage() {
  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const cats = new Set((prestador.servicios ?? []).map((s: { categoria: string }) => s.categoria));
  const tieneActividades = [...cats].some(c => CATS_ACTIVIDADES_SET.has(c));

  const [reservas, mesas, profesionales, recursos] = await Promise.all([
    getReservasDelPrestador(prestador.id),
    getMesasDelPrestador(prestador.id),
    getProfesionalesActivos(prestador.id),
    tieneActividades ? getRecursosActivos(prestador.id) : Promise.resolve([]),
  ]);

  const servicios = (prestador.servicios ?? [])
    .filter((s: { activo: boolean }) => s.activo)
    .map((s: { id: string; nombre: string; categoria: string; duracion_minutos: number | null }) => ({
      id:               s.id,
      nombre:           s.nombre,
      categoria:        s.categoria,
      duracion_minutos: s.duracion_minutos ?? undefined,
    }));

  return (
    <main className="flex-1 p-8 max-md:p-4">
      {/* desktop header */}
      <div className="mb-6 hidden md:block">
        <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-text-muted mb-1">Panel del negocio</p>
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body">Reservas</h1>
      </div>
      <ReservasManager
        reservas={reservas}
        prestadorId={prestador.id}
        puebloId={String(prestador.pueblo_id ?? '')}
        mesas={mesas}
        servicios={servicios}
        profesionales={profesionales}
        recursos={recursos}
      />
    </main>
  );
}
