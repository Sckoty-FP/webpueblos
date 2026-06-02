import { getAdminNegocios } from "@/lib/supabase/queries/admin";
import { getPueblos } from "@/lib/supabase/queries/pueblos";
import { suspenderNegocio, activarNegocio } from "@/lib/supabase/queries/admin";
import { revalidatePath } from "next/cache";
import NegociosAdminView from "@/components/admin/negocios/NegociosAdminView";

export const dynamic = "force-dynamic";

export default async function AdminNegociosPage() {
  const [negocios, pueblos] = await Promise.all([
    getAdminNegocios(),
    getPueblos(),
  ]);

  async function handleSuspender(fd: FormData) {
    "use server";
    const id     = fd.get("id") as string;
    const motivo = fd.get("motivo") as string;
    await suspenderNegocio(id, motivo);
    revalidatePath("/admin/negocios");
  }

  async function handleActivar(fd: FormData) {
    "use server";
    const id = fd.get("id") as string;
    await activarNegocio(id);
    revalidatePath("/admin/negocios");
  }

  return (
    <NegociosAdminView
      negocios={negocios as never[]}
      pueblos={pueblos}
      onSuspender={handleSuspender}
      onActivar={handleActivar}
    />
  );
}
