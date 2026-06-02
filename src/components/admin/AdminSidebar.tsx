"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ActivarNotificaciones from "@/components/push/ActivarNotificaciones";

interface Props {
  userName: string;
  userTipo: string;
}

interface NavItem {
  href:   string;
  label:  string;
  icon:   React.ReactNode;
  badge?: number;
}

function Ico({ d, d2, d3 }: { d: string; d2?: string; d3?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
      {d2 && <path d={d2} />}
      {d3 && <path d={d3} />}
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    href:  "/admin",
    label: "Dashboard",
    icon:  <Ico d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" d2="M9 22V12h6v10" />,
  },
  {
    href:  "/admin/negocios",
    label: "Negocios",
    icon:  <Ico d="M3 9l9-7 9 7v11H3V9z" d2="M9 22v-4h6v4" />,
  },
  {
    href:  "/admin/repartidores",
    label: "Repartidores",
    icon:  (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    href:  "/admin/delivery",
    label: "Delivery",
    icon:  <Ico d="M12 2L2 7l10 5 10-5-10-5z" d2="M2 17l10 5 10-5" d3="M2 12l10 5 10-5" />,
  },
  {
    href:  "/admin/comisiones",
    label: "Saldo / Cobros",
    icon:  <Ico d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  },
  {
    href:  "/admin/verificaciones",
    label: "Verificaciones",
    icon:  <Ico d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  },
  {
    href:  "/admin/tickets",
    label: "Tickets",
    icon:  <Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    href:  "/admin/logs",
    label: "Logs",
    icon:  <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6M16 13H8M16 17H8M10 9H8" />,
  },
  {
    href:  "/admin/publicidad",
    label: "Publicidad",
    icon:  <Ico d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" d2="M9 9h6M9 13h6M9 17h4" />,
  },
  {
    href:  "/admin/config",
    label: "Configuración",
    icon:  <Ico d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" d2="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />,
  },
];

export default function AdminSidebar({ userName, userTipo }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-60 bg-[#0f1117] border-r border-white/[0.06] z-30">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p className="font-barlow font-bold text-white text-[14px] leading-none">PUEBLO</p>
              <p className="font-barlow text-[10px] text-white/40 mt-0.5">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors
                font-barlow text-[13px] font-medium no-underline
                ${isActive(item.href)
                  ? "bg-white/[0.1] text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"}
              `}
            >
              <span className={isActive(item.href) ? "text-primary" : ""}>
                {item.icon}
              </span>
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Usuario */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="pb-3">
            <ActivarNotificaciones compact className="w-full justify-center" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="font-barlow font-bold text-white/60 text-[12px]">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-barlow text-[12px] font-medium text-white/80 truncate">{userName}</p>
              <p className="font-barlow text-[10px] text-white/30">
                {userTipo === "super_admin" ? "Super Admin" : "Admin Empresa"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0f1117] border-b border-white/[0.06] z-30 flex items-center px-4 gap-3">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          </svg>
        </div>
        <span className="font-barlow font-bold text-white text-[14px]">PUEBLO Admin</span>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0f1117] border-t border-white/[0.06] z-30 flex items-center justify-around px-2">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors
              ${isActive(item.href) ? "text-primary" : "text-white/40"}
            `}
          >
            {item.icon}
            <span className="font-barlow text-[9px]">{item.label.split(" ")[0]}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
