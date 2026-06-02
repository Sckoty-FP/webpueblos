import { getTodasVerificaciones, actualizarEstadoVerificacion } from "@/lib/supabase/queries/admin";
import { revalidatePath } from "next/cache";
import VerificacionesAdminView from "@/components/admin/verificaciones/VerificacionesAdminView";

export const dynamic = "force-dynamic";

export default async function AdminVerificacionesPage() {
  const verificaciones = await getTodasVerificaciones();

  async function handleActualizar(fd: FormData) {
    "use server";
    const id     = fd.get("id") as string;
    const estado = fd.get("estado") as string;
    const motivo = (fd.get("motivo") as string) || undefined;
    const notas  = (fd.get("notas")  as string) || undefined;
    await actualizarEstadoVerificacion(id, estado, motivo, notas);
    revalidatePath("/admin/verificaciones");
  }

  return <VerificacionesAdminView verificaciones={verificaciones} onActualizar={handleActualizar} />;
}
