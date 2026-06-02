import { redirect } from "next/navigation";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import ServiciosManager from "@/components/sections/panel/ServiciosManager";

export default async function PanelServiciosPage() {
  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  return (
    <main className="flex-1 p-8 max-md:p-4">
      <div className="mb-8">
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body mb-1">Mis servicios</h1>
        <p className="font-barlow text-[15px] text-text-muted">
          Gestioná los servicios que aparecen en tu página pública.
        </p>
      </div>
      <ServiciosManager prestadorId={prestador.id} puebloId={prestador.pueblo_id!} servicios={prestador.servicios} />
    </main>
  );
}
