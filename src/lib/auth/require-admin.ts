// web/src/lib/auth/require-admin.ts
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Garantiza que el que llama es `super_admin`. Pensado para blindar los SERVER
 * ACTIONS que usan el cliente service-role (`createAdminClient`), que bypassa RLS.
 *
 * IMPORTANTE: el guard de `admin/layout.tsx` solo protege el RENDER de la página.
 * Los server actions son endpoints POST independientes y NO pasan por el layout
 * ni por el middleware — la autorización tiene que estar DENTRO de la action.
 *
 * Decisión de severidad: se exige `super_admin` (no `admin_empresa`) porque hoy
 * `admin_empresa` no está acotado a sus pueblos (ver SEC-004 en SEGURIDAD/). Cuando
 * se implemente ese scope, se podrá relajar a un `requireAdminForPueblo`.
 *
 * Si no hay sesión → redirige a login (vía requireUser).
 * Si hay sesión pero el rol no alcanza → lanza Error("Permiso denegado").
 */
export async function requireSuperAdmin(redirectTo?: string): Promise<User> {
  const user = await requireUser(redirectTo);
  const supabase = await createClient();
  const { data } = await supabase
    .from("usuarios")
    .select("tipo")
    .eq("id", user.id)
    .single();

  if (data?.tipo !== "super_admin") {
    throw new Error("Permiso denegado");
  }
  return user;
}
