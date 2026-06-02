import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getBannersAdmin } from "@/lib/supabase/queries/banners";
import BannersAdminView from "@/components/admin/BannersAdminView";

export const dynamic = "force-dynamic";

export default async function AdminPublicidadPage() {
  const user = await requireUser("/admin/publicidad");
  const supabase = await createClient();
  const { data: u } = await supabase.from("usuarios").select("tipo").eq("id", user.id).single();
  if (u?.tipo !== "super_admin") redirect("/");

  const banners = await getBannersAdmin();

  return (
    <div className="p-6">
      <h1 className="font-fraunces font-semibold text-2xl text-white mb-1">Publicidad</h1>
      <p className="font-barlow text-sm text-white/50 mb-6">
        Banners activos en cada slot del sitio.
      </p>
      <BannersAdminView banners={banners} />
    </div>
  );
}
