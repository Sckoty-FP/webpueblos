import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Punto de entrada de TODOS los enlaces que Supabase manda por email
 * (confirmación de registro y reset de contraseña). Canjea el `code` del link por
 * una sesión activa y redirige al destino. Si el link expiró o es inválido, manda
 * a login con ?error=link_expired. Ver MODULO-AUTH/02-FLUJO-E2E.md §4.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code     = searchParams.get("code");
  const next     = searchParams.get("next") ?? "/";
  const redirect = searchParams.get("redirect") ?? next;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Link expirado o inválido → login con mensaje de error
  return NextResponse.redirect(`${origin}/auth/login?error=link_expired`);
}
