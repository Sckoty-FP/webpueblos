import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el NAVEGADOR (componentes "use client").
 * Usa la anon key (pública) y respeta RLS. Es el que usan los forms de auth,
 * los uploads a Storage y cualquier lectura/escritura desde el cliente.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
