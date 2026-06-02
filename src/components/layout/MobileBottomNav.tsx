"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, UtensilsCrossed, Search, MessageSquare, User, MapPin } from "lucide-react";

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

type Variant = "pueblo" | "landing";

interface Props {
  variant?: Variant;
}

export default function MobileBottomNav({ variant }: Props = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const puebloSlug = getPuebloSlug(pathname);
  const effective: Variant = variant ?? (puebloSlug ? "pueblo" : "landing");

  const tabs =
    effective === "pueblo" && puebloSlug
      ? [
          { id: "home",        label: "Inicio",    href: `/${puebloSlug}`,             Icon: Home            },
          { id: "gastronomia", label: "Comer",     href: `/${puebloSlug}/gastronomia`, Icon: UtensilsCrossed },
          { id: "servicios",   label: "Servicios", href: `/${puebloSlug}/servicios`,   Icon: Search          },
          { id: "muro",        label: "Muro",      href: `/${puebloSlug}/muro`,        Icon: MessageSquare   },
          { id: "perfil",      label: "Perfil",    href: "/perfil",                    Icon: User            },
        ]
      : [
          { id: "home",    label: "Inicio",  href: "/",         Icon: Home   },
          { id: "pueblos", label: "Pueblos", href: "/#pueblos", Icon: MapPin },
          { id: "perfil",  label: "Perfil",  href: "/perfil",   Icon: User   },
        ];

  function isActive(href: string): boolean {
    if (href === `/${puebloSlug}` || href === "/") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-divisor flex pb-safe">
      {tabs.map(t => {
        const active = isActive(t.href);
        return (
          <button
            key={t.id}
            onClick={() => router.push(t.href)}
            className="flex-1 flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer py-1.5 transition-colors duration-150"
            style={{ color: active ? "var(--color-primary)" : "#aaa" }}
          >
            <t.Icon size={22} strokeWidth={1.5} />
            <span
              className="font-barlow text-[11px]"
              style={{ fontWeight: active ? 600 : 400 }}
            >
              {t.label}
            </span>
            {active && <span className="w-1 h-1 rounded-full bg-primary -mt-0.5" />}
          </button>
        );
      })}
    </nav>
  );
}
