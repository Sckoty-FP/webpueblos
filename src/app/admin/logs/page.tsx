import { getAuditLog } from "@/lib/supabase/queries/admin";
import LogsAdminView from "@/components/admin/logs/LogsAdminView";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logs = await getAuditLog({ limit: 200 });
  return <LogsAdminView logs={logs as never[]} />;
}
