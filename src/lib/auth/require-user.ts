// web/src/lib/auth/require-user.ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Garantiza usuario logueado. Si no hay sesión, redirige a /auth/login?redirect=<path>.
 * Uso al inicio de Server Components protegidos.
 */
export async function requireUser(redirectTo?: string): Promise<User> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const target = redirectTo
      ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/auth/login";
    redirect(target);
  }
  return user;
}

/**
 * Devuelve el usuario o null sin redirigir. Para UI condicional.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Guard con pueblo. Por ahora equivale a requireUser — extender cuando
 * se implemente asociación usuario↔pueblo.
 */
export async function requireUserForPueblo(
  _puebloId: string,
  redirectTo?: string,
): Promise<User> {
  return requireUser(redirectTo);
}
