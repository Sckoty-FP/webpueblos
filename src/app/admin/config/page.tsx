import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getConfigConMetadata } from "@/lib/supabase/queries/config-plataforma";
import ConfigEditor from "@/components/admin/ConfigEditor";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const user = await requireUser("/admin/config");
  const supabase = await createClient();
  const { data: u } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
  if (u?.tipo !== "super_admin") redirect("/");

  const items = await getConfigConMetadata();

  return (
    <div className="p-6">
      <h1 className="font-fraunces font-semibold text-2xl text-white mb-1">Configuración global</h1>
      <p className="font-barlow text-sm text-white/50 mb-6">
        Parámetros leídos en tiempo real por el front. Cambiar con cuidado.
      </p>
      <ConfigEditor items={items} />
    </div>
  );
}
