import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de la app (en este Next se llama `proxy`, no `middleware`).
 *
 * Hace dos cosas en cada request:
 *  1. Refresca la sesión de Supabase y la deja en las cookies de la respuesta.
 *  2. Redirige según el estado de sesión (rutas protegidas → login, y al revés).
 *
 * Es la PRIMERA capa de protección (UX + defensa en profundidad), NO la
 * autorización final: eso lo deciden los guards en el render y RLS. Ver
 * MODULO-AUTH/01-ARQUITECTURA.md §5.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() valida la sesión contra el servidor de Supabase (más seguro que
  // getSession(), que solo confía en la cookie).
  const { data: { user } } = await supabase.auth.getUser();

  // Rutas que exigen sesión. /admin y /repartidor NO están acá: se protegen en su
  // propio layout.tsx + RLS. Si agregás una sección privada nueva, sumá su prefijo.
  const protectedPaths = ["/perfil", "/panel"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const authPaths = ["/auth/login", "/auth/registro"];
  const isAuthPage = authPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
