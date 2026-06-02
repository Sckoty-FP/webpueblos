import { getAdminKpis, getKpisPorPueblo, getSaldosPendientes } from "@/lib/supabase/queries/admin";
import AdminHomeView from "@/components/admin/AdminHomeView";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [kpis, kpisPueblo, saldos] = await Promise.all([
    getAdminKpis(),
    getKpisPorPueblo(),
    getSaldosPendientes(),
  ]);

  return <AdminHomeView kpis={kpis} kpisPueblo={kpisPueblo} saldosPendientes={saldos} />;
}
