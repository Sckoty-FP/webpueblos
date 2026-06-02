import { redirect } from "next/navigation";
import { getPrestadorDelUsuario, getPropiedadesDelPrestador } from "@/lib/supabase/queries/panel";
import PropiedadesManager from "@/components/sections/panel/PropiedadesManager";

export default async function PanelPropiedadesPage() {
  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const propiedades = await getPropiedadesDelPrestador(prestador.id);

  return (
    <main className="flex-1 p-8 max-md:p-4">
      <div className="mb-8">
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body mb-1">Propiedades</h1>
        <p className="font-barlow text-[15px] text-text-muted">
          Gestioná las unidades de tu alojamiento: habitaciones, apartamentos, bungalows y más.
        </p>
      </div>
      <PropiedadesManager
        prestadorId={prestador.id}
        puebloId={prestador.pueblo_id!}
        propiedades={propiedades}
      />
    </main>
  );
}
