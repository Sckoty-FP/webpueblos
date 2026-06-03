import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para el SERVIDOR (Server Components, Server Actions, Route
 * Handlers). Usa la anon key + las cookies de sesión, así que corre **como el
 * usuario logueado** y respeta RLS. Es el cliente seguro por defecto: usalo
 * siempre que puedas en vez del Admin (service-role).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies de solo lectura, ignorar
          }
        },
      },
    }
  );
}
