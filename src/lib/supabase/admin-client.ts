import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la llave SERVICE-ROLE.
 *
 * ⚠️ BYPASSA RLS POR COMPLETO. Usalo SOLO cuando hace falta actuar sobre datos de
 * OTRO usuario (ej. notificar a un negocio, crear una cuenta de repartidor). Para
 * todo lo demás usá el cliente Server (`lib/supabase/server.ts`), que respeta RLS.
 *
 * REGLA: todo server action que llame a esto DEBE verificar el rol antes, con
 * `requireSuperAdmin()` como primera línea. El guard del layout NO protege los
 * server actions (ver SEC-001 en SEGURIDAD/ y MODULO-AUTH/04-SEGURIDAD.md).
 *
 * La service-role key es secreta: nunca exponerla al cliente ni con prefijo
 * NEXT_PUBLIC_.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
