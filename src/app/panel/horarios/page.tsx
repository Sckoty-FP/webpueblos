import { redirect } from "next/navigation";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import HorariosEditor from "@/components/sections/panel/HorariosEditor";

export default async function PanelHorariosPage() {
  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  return (
    <main className="flex-1 p-8 max-md:p-4">
      <div className="mb-8">
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body mb-1">Horarios de apertura</h1>
        <p className="font-barlow text-[15px] text-text-muted">
          Indicá tus horas de atención. Los clientes verán si estás abierto en tiempo real.
        </p>
      </div>
      <HorariosEditor prestadorId={prestador.id} horarios={prestador.horarios} />
    </main>
  );
}
