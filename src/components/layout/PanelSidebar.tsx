"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PanelModules } from "@/lib/panel/modules";
import type { RolPanel } from "@/types/equipo";
import ActivarNotificaciones from "@/components/push/ActivarNotificaciones";

interface Props {
  modules:         PanelModules;
  puebloSlug:      string | null;
  prestadorNombre: string;
  rol:             RolPanel;
}

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

function Icon({ d, d2 }: { d: string; d2?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d={d} />
      {d2 && <path d={d2} />}
    </svg>
  );
}

export default function PanelSidebar({ modules, puebloSlug, prestadorNombre, rol }: Props) {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      href:  "/panel",
      label: "Inicio",
      icon:  <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" d2="M9 22V12h6v10" />,
    },
    ...(modules.delivery_config ? [{
      href:  "/panel/delivery/config",
      label: "Delivery",
      icon:  (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
    }] : []),
    ...(modules.delivery ? [{
      href:  "/panel/delivery",
      label: "Pedidos",
      icon:  (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h18v4H3zM3 11h18v2H3zM3 17h18v4H3z"/>
        </svg>
      ),
    }] : []),
    ...(modules.reservas ? [{
      href:  "/panel/reservas",
      label: "Reservas",
      icon:  <Icon d="M8 2v4M16 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />,
    }] : []),
    ...(modules.free_tour ? [{
      href:  "/panel/free-tour",
      label: "Free Tour",
      icon:  (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
      ),
    }] : []),
    ...(modules.actividades ? [{
      href:  "/panel/actividades",
      label: "Actividades",
      icon:  (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <circle cx="12" cy="5" r="3"/>
          <line x1="12" y1="8" x2="12" y2="22"/>
          <path d="M5 15H2a10 10 0 0 0 20 0h-3"/>
        </svg>
      ),
    }] : []),
    ...(modules.profesionales ? [{
      href:  "/panel/profesionales",
      label: "Profesionales",
      icon:  (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
          <line x1="20" y1="4" x2="8.12" y2="15.88"/>
          <line x1="14.47" y1="14.48" x2="20" y2="20"/>
          <line x1="8.12" y1="8.12" x2="12" y2="12"/>
        </svg>
      ),
    }] : []),
    ...(modules.presupuestos ? [{
      href:  "/panel/presupuestos",
      label: "Presupuestos",
      icon:  <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8" />,
    }] : []),
    ...(modules.partes ? [{
      href:  "/panel/partes",
      label: "Partes",
      icon:  (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      ),
    }] : []),
    ...(modules.carta ? [{
      href:  "/panel/carta",
      label: "Carta",
      icon:  <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M12 12h.01M12 16h.01" />,
    }] : []),
    ...(modules.mesas ? [{
      href:  "/panel/mesas",
      label: "Mesas",
      icon:  <Icon d="M3 7h18M3 12h18M3 17h18" />,
    }] : []),
    ...(modules.inventario ? [{
      href:  "/panel/inventario",
      label: "Inventario",
      icon:  <Icon d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 3H8L6 7h12l-2-4z" />,
    }] : []),
    ...(modules.notas ? [{
      href:  "/panel/notas",
      label: "Notas",
      icon:  <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8" />,
    }] : []),
    ...(modules.caja ? [{
      href:  "/panel/caja",
      label: "Caja",
      icon:  <Icon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
    }] : []),
    ...(modules.equipo ? [{
      href:  "/panel/equipo",
      label: "Equipo",
      icon:  <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" d2="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
    }] : []),
    ...(modules.servicios ? [{
      href:  "/panel/servicios",
      label: "Servicios",
      icon:  <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />,
    }] : []),
    ...(modules.propiedades ? [{
      href:  "/panel/propiedades",
      label: "Propiedades",
      icon:  <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" d2="M9 22V12h6v10" />,
    }] : []),
    ...(modules.horarios ? [{
      href:  "/panel/horarios",
      label: "Horarios",
      icon:  <Icon d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z" d2="M12 6v6l4 2" />,
    }] : []),
    ...(modules.perfil ? [{
      href:  "/panel/perfil",
      label: "Perfil",
      icon:  <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" d2="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
    }] : []),
  ];

  function isActive(href: string) {
    if (href === "/panel") return pathname === "/panel";
    return pathname.startsWith(href);
  }

  // Primeros 4 items para bottom nav mobile + "Más" implícito
  const mobileItems = items.slice(0, 4);

  return (
    <>
    {/* ── Mobile top bar ── */}
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-[#0e0e0f] border-b border-white/8">
      <Link href={puebloSlug ? `/${puebloSlug}` : "/"} className="flex items-center gap-1.5 no-underline">
        <span className="font-barlow font-bold text-white text-base tracking-tight">PUEBLO</span>
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      </Link>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="font-barlow font-bold text-primary text-[11px]">{prestadorNombre.slice(0,2).toUpperCase()}</span>
        </div>
      </div>
    </div>

    {/* ── Mobile bottom nav ── */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex bg-[#0e0e0f] border-t border-white/8" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {mobileItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="flex-1 flex flex-col items-center justify-center py-2.5 no-underline transition-colors"
          style={{ color: isActive(item.href) ? "#0070cc" : "rgba(255,255,255,0.45)" }}
        >
          <span className="mb-0.5" style={{ opacity: isActive(item.href) ? 1 : 0.6 }}>{item.icon}</span>
          <span className="font-barlow font-medium text-[10px]">{item.label}</span>
          {isActive(item.href) && <span className="absolute top-1.5 w-1 h-1 rounded-full bg-primary" />}
        </Link>
      ))}
      <Link
        href="/panel/perfil"
        className="flex-1 flex flex-col items-center justify-center py-2.5 no-underline transition-colors"
        style={{ color: pathname === "/panel/perfil" ? "#0070cc" : "rgba(255,255,255,0.45)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="mb-0.5">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
        <span className="font-barlow font-medium text-[10px]">Más</span>
      </Link>
    </nav>

    {/* ── Desktop sidebar ── */}
    <aside className="hidden md:flex w-60 min-h-screen bg-[#0e0e0f] flex-col shrink-0">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/8">
        <Link href={puebloSlug ? `/${puebloSlug}` : "/"} className="flex items-center gap-2 no-underline mb-4">
          <span className="font-barlow font-bold text-white text-lg tracking-tight">PUEBLO</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="font-barlow font-bold text-primary text-[12px]">
              {prestadorNombre.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-barlow font-semibold text-white text-[13px] truncate">{prestadorNombre}</p>
            <p className="font-barlow text-[11px] text-white/40 capitalize">{rol}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] no-underline transition-all duration-150"
            style={{
              background: isActive(item.href) ? "rgba(0,112,204,0.15)" : "transparent",
              color: isActive(item.href) ? "#0070cc" : "rgba(255,255,255,0.6)",
            }}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="font-barlow font-medium text-[14px]">{item.label}</span>
            {isActive(item.href) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/8">
        <div className="px-3 pb-3">
          <ActivarNotificaciones compact className="w-full justify-center" />
        </div>
        <Link
          href={puebloSlug ? `/${puebloSlug}` : "/"}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] no-underline text-white/40 hover:text-white/70 transition-colors duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="font-barlow font-medium text-[14px]">Volver al pueblo</span>
        </Link>
      </div>
    </aside>
    </>
  );
}
