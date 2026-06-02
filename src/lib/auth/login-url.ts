// web/src/lib/auth/login-url.ts

/**
 * Construye la URL de login con ?redirect= preservado.
 * Usar en CTAs cliente: <Link href={loginUrl(pathname)}>Iniciá sesión</Link>
 */
export function loginUrl(redirectTo: string): string {
  if (!redirectTo || redirectTo === "/") return "/auth/login";
  return `/auth/login?redirect=${encodeURIComponent(redirectTo)}`;
}

export function registroUrl(redirectTo: string): string {
  if (!redirectTo || redirectTo === "/") return "/auth/registro";
  return `/auth/registro?redirect=${encodeURIComponent(redirectTo)}`;
}
