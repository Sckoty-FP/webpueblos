import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cierra la sesión del usuario (borra la cookie del lado del servidor) y redirige
 * a ?redirect= o a la home. Es un GET para poder usarlo desde un <Link>/<a>.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/";
  return NextResponse.redirect(`${origin}${redirectTo}`);
}
