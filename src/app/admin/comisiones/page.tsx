import { getSaldosPendientes, getRemesas, crearRemesa, marcarRemesaPagada, getComisionesDelPrestadorAdmin } from "@/lib/supabase/queries/admin";
import { revalidatePath } from "next/cache";
import ComisionesAdminView from "@/components/admin/comisiones/ComisionesAdminView";

export const dynamic = "force-dynamic";

export default async function AdminComisionesPage() {
  const [saldos, remesas] = await Promise.all([
    getSaldosPendientes(),
    getRemesas(),
  ]);

  async function handleCrearRemesa(fd: FormData) {
    "use server";
    const prestador_id    = fd.get("prestador_id") as string;
    const periodo_inicio  = fd.get("periodo_inicio") as string;
    const periodo_fin     = fd.get("periodo_fin") as string;
    const importe_total   = parseFloat(fd.get("importe_total") as string);
    const notas           = (fd.get("notas") as string) || null;

    // Vincular las comisiones acumuladas no facturadas a esta remesa
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: remesa } = await supabase
      .from("remesas")
      .insert({ prestador_id, periodo_inicio, periodo_fin, importe_total, notas })
      .select("id")
      .single();

    if (remesa?.id) {
      await supabase
        .from("comision_acumulada")
        .update({ remesa_id: remesa.id })
        .eq("prestador_id", prestador_id)
        .eq("facturado", false);
    }

    revalidatePath("/admin/comisiones");
  }

  async function handleMarcarPagada(fd: FormData) {
    "use server";
    const id = fd.get("id") as string;
    await marcarRemesaPagada(id);
    revalidatePath("/admin/comisiones");
  }

  return (
    <ComisionesAdminView
      saldos={saldos}
      remesas={remesas}
      onCrearRemesa={handleCrearRemesa}
      onMarcarPagada={handleMarcarPagada}
    />
  );
}
