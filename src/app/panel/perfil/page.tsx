import { redirect } from "next/navigation";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import PerfilEditor from "@/components/sections/panel/PerfilEditor";

export default async function PanelPerfilPage() {
  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  return (
    <main className="flex-1 p-8 max-md:p-4">
      <div className="mb-8">
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body mb-1">Perfil y fotos</h1>
        <p className="font-barlow text-[15px] text-text-muted">
          Esta información aparece en tu página pública y en la tarjeta del servicio.
        </p>
      </div>
      <PerfilEditor prestador={prestador} />
    </main>
  );
}
