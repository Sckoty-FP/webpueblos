import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("tipo, nombre, email")
    .eq("id", user.id)
    .single();

  const tipo = perfil?.tipo;
  if (tipo !== "super_admin" && tipo !== "admin_empresa") redirect("/");

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <AdminSidebar
        userName={perfil?.nombre ?? perfil?.email ?? "Admin"}
        userTipo={tipo}
      />
      {/* Content — offset por el sidebar fijo en desktop */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        {children}
      </div>
    </div>
  );
}
