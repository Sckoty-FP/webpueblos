import { getAdminRepartidores, toggleRepartidorActivo } from "@/lib/supabase/queries/admin";
import { getPueblos } from "@/lib/supabase/queries/pueblos";
import { revalidatePath } from "next/cache";
import { crearRepartidorAction, editarRepartidorAction, vincularRepartidorAction, adminAvanzarPedidoAction } from "./actions";
import RepartidoresAdminView from "@/components/admin/repartidores/RepartidoresAdminView";

export const dynamic = "force-dynamic";

export default async function AdminRepartidoresPage() {
  const [repartidores, pueblos] = await Promise.all([
    getAdminRepartidores(),
    getPueblos(),
  ]);

  async function handleToggle(fd: FormData) {
    "use server";
    const id     = fd.get("id") as string;
    const activo = fd.get("activo") === "true";
    await toggleRepartidorActivo(id, activo);
    revalidatePath("/admin/repartidores");
  }

  return (
    <RepartidoresAdminView
      repartidores={repartidores as never[]}
      pueblos={pueblos}
      onToggle={handleToggle}
      onCrear={crearRepartidorAction}
      onEditar={editarRepartidorAction}
      onVincular={vincularRepartidorAction}
      onAdminAvanzarPedido={adminAvanzarPedidoAction}
    />
  );
}
