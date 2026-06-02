"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginUrl } from "@/lib/auth/login-url";
import type { User } from "@supabase/supabase-js";

const RESERVED = new Set([
  "auth", "perfil", "servicios", "muro", "actividades", "clasificados",
  "para-negocios", "contacto", "privacidad", "terminos", "cookies",
  "aviso-legal", "admin", "panel", "repartidor", "p",
  "gastronomia", "free-tour", "delivery", "eventos", "rutas", "premium",
]);

function getPuebloSlug(pathname: string): string | null {
  const first = pathname.split("/").filter(Boolean)[0];
  return first && !RESERVED.has(first) ? first : null;
}

type NavVariant = "pueblo" | "landing";

interface NavProps {
  variant?: NavVariant;
}

export default function Nav({ variant }: NavProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const puebloSlug = getPuebloSlug(pathname);

  const effectiveVariant: NavVariant = variant ?? (puebloSlug ? "pueblo" : "landing");

  const navLinks =
    effectiveVariant === "pueblo" && puebloSlug
      ? [
          { label: "Gastronomía", href: `/${puebloSlug}/gastronomia` },
          { label: "Servicios",   href: `/${puebloSlug}/servicios`   },
          { label: "Actividades", href: `/${puebloSlug}/actividades` },
          { label: "Free Tours",  href: `/${puebloSlug}/free-tour`   },
          { label: "Muro",        href: `/${puebloSlug}/muro`        },
        ]
      : [
          { label: "Pueblos",       href: "/#pueblos"      },
          { label: "Para negocios", href: "/para-negocios" },
          { label: "Contacto",      href: "/contacto"      },
        ];

  const homeHref = effectiveVariant === "pueblo" && puebloSlug ? `/${puebloSlug}` : "/";

  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [user, setUser]           = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const initials = user?.user_metadata?.nombre
    ? user.user_metadata.nombre.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-black h-14 transition-colors duration-200"
      style={{ borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent" }}
    >
      <div className="max-w-[1280px] mx-auto px-16 max-lg:px-12 max-md:px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-2 no-underline">
          <Image src="/logo.png" alt="" width={22} height={22} className="object-contain" aria-hidden="true" />
          <span className="font-barlow font-bold text-xl text-white tracking-tight">PUEBLO</span>
        </Link>

        {/* Links desktop */}
        <div className="max-md:hidden flex gap-8 items-center">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-barlow font-medium text-[15px] text-white/85 no-underline pb-0.5 border-b-2 border-transparent hover:text-white hover:border-primary transition-all duration-150 tracking-wide"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTAs desktop */}
        <div className="max-md:hidden flex gap-3 items-center">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-barlow font-bold text-white text-[13px]">
                  {initials}
                </div>
                <span className="font-barlow font-medium text-[14px] text-white/85">
                  {user.user_metadata?.nombre?.split(" ")[0] ?? user.email?.split("@")[0]}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-card border border-divisor py-1.5 min-w-[160px]"
                  style={{ boxShadow: "rgba(0,0,0,0.15) 0px 8px 24px" }}
                >
                  <Link
                    href="/perfil"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 font-barlow text-[14px] text-text-body no-underline hover:bg-fog transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Mi perfil
                  </Link>

                  {user.user_metadata?.tipo === "prestador" && (
                    <Link
                      href="/panel"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 font-barlow text-[14px] text-primary no-underline hover:bg-fog transition-colors font-semibold"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      Panel servicios
                    </Link>
                  )}

                  <div className="h-px bg-divisor mx-3 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 font-barlow text-[14px] text-red-500 bg-transparent border-none cursor-pointer hover:bg-red-50 transition-colors text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href={loginUrl(pathname)}
                className="font-barlow font-medium text-[15px] text-white bg-transparent border-2 border-white/40 rounded-pill px-5 py-2 no-underline cursor-pointer hover:border-white transition-all duration-180"
              >
                Iniciá sesión
              </Link>
              <Link href="/auth/registro" className="font-barlow font-medium text-[15px] text-white bg-primary border-2 border-transparent rounded-pill px-5 py-2 no-underline cursor-pointer hover:opacity-90 transition-all duration-180">
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Hamburger mobile */}
        <button
          className="md:hidden bg-none border-none text-white cursor-pointer p-2 flex flex-col gap-[5px]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span className="w-[22px] h-0.5 bg-white block transition-transform duration-200" style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <span className="w-[22px] h-0.5 bg-white block transition-opacity duration-200" style={{ opacity: menuOpen ? 0 : 1 }} />
          <span className="w-[22px] h-0.5 bg-white block transition-transform duration-200" style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="bg-[#111] border-t border-white/8 px-4 pb-6 pt-4">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block text-white/85 font-barlow text-lg font-normal py-3.5 border-b border-white/6 no-underline"
            >
              {l.label}
            </Link>
          ))}

          {user ? (
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/perfil"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 text-white/85 font-barlow text-base py-3 no-underline"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-[13px]">
                  {initials}
                </div>
                {user.user_metadata?.nombre?.split(" ")[0] ?? user.email?.split("@")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full font-barlow font-medium text-red-400 bg-transparent border-2 border-red-400/40 rounded-pill py-2.5 text-base cursor-pointer text-left px-4"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="flex gap-3 mt-5">
              <Link href={loginUrl(pathname)} className="flex-1 font-barlow font-medium text-white bg-transparent border-2 border-white/40 rounded-pill py-2.5 text-base no-underline text-center">
                Iniciá sesión
              </Link>
              <Link href="/auth/registro" className="flex-1 font-barlow font-medium text-white bg-primary border-2 border-transparent rounded-pill py-2.5 text-base no-underline text-center">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
