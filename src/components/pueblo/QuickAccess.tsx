import Link from "next/link";
import {
  UtensilsCrossed,
  Bike,
  Layers,
  Map,
  MessageCircle,
  Tag,
  Compass,
  ChevronRight,
} from "lucide-react";
import type { ReactNode } from "react";

interface QuickItem {
  icon: ReactNode;
  label: string;
  sub: string;
  href: string;
  color: string;
  bg: string;
}

interface Props {
  puebloSlug: string;
  hayDelivery?: boolean;
}

export default function QuickAccess({ puebloSlug, hayDelivery = false }: Props) {
  const s = puebloSlug;

  const baseItems: QuickItem[] = [
    {
      icon: <UtensilsCrossed size={22} strokeWidth={1.5} />,
      label: "Gastronomía",
      sub: "Dónde comer",
      href: `/${s}/gastronomia`,
      color: "#0070cc",
      bg: "#0070cc0f",
    },
    ...(hayDelivery
      ? [{
          icon: <Bike size={22} strokeWidth={1.5} />,
          label: "Delivery",
          sub: "Pedir a domicilio",
          href: `/${s}/gastronomia?delivery=true`,
          color: "#d53b00",
          bg: "#d53b000f",
        }]
      : [{
          icon: <Layers size={22} strokeWidth={1.5} />,
          label: "Servicios",
          sub: "Negocios locales",
          href: `/${s}/servicios`,
          color: "#B8956A",
          bg: "#B8956A0f",
        }]),
    ...(hayDelivery
      ? [{
          icon: <Layers size={22} strokeWidth={1.5} />,
          label: "Servicios",
          sub: "Negocios locales",
          href: `/${s}/servicios`,
          color: "#14a06b",
          bg: "#14a06b0f",
        }]
      : [{
          icon: <Map size={22} strokeWidth={1.5} />,
          label: "Actividades",
          sub: "Planes para hacer",
          href: `/${s}/actividades`,
          color: "#14a06b",
          bg: "#14a06b0f",
        }]),
    ...(hayDelivery
      ? [{
          icon: <Map size={22} strokeWidth={1.5} />,
          label: "Actividades",
          sub: "Planes para hacer",
          href: `/${s}/actividades`,
          color: "#d53b00",
          bg: "#d53b000f",
        }]
      : [{
          icon: <MessageCircle size={22} strokeWidth={1.5} />,
          label: "Muro 24h",
          sub: "En vivo ahora",
          href: `/${s}/muro`,
          color: "#7c3aed",
          bg: "#7c3aed0f",
        }]),
    ...(hayDelivery
      ? [{
          icon: <MessageCircle size={22} strokeWidth={1.5} />,
          label: "Muro 24h",
          sub: "En vivo ahora",
          href: `/${s}/muro`,
          color: "#7c3aed",
          bg: "#7c3aed0f",
        }]
      : [{
          icon: <Tag size={22} strokeWidth={1.5} />,
          label: "Clasificados",
          sub: "Venta y alquiler",
          href: `/${s}/clasificados`,
          color: "#d97706",
          bg: "#d977060f",
        }]),
    ...(hayDelivery
      ? [{
          icon: <Tag size={22} strokeWidth={1.5} />,
          label: "Clasificados",
          sub: "Venta y alquiler",
          href: `/${s}/clasificados`,
          color: "#d97706",
          bg: "#d977060f",
        }]
      : [{
          icon: <Compass size={22} strokeWidth={1.5} />,
          label: "Free Tours",
          sub: "Pago a voluntad",
          href: `/${s}/free-tour`,
          color: "#0070cc",
          bg: "#0070cc0f",
        }]),
  ];

  const items = baseItems.slice(0, 6);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container-app">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="font-fraunces text-xs uppercase tracking-[0.18em] text-accent-warm mb-3">
              ¿Qué querés hacer?
            </p>
            <h2 className="display-section text-text-body">
              Todo el pueblo,<br className="hidden sm:block" /> en tu bolsillo.
            </h2>
          </div>
          <p className="font-barlow text-sm text-text-muted max-w-[260px] leading-relaxed">
            Seis accesos rápidos a lo que más se usa.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-3.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-2.5 rounded-[19px] bg-fog border border-transparent p-[22px_18px] no-underline hover:bg-white hover:border-[#0070cc22] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] transition-all duration-200"
            >
              {/* Icon glyph */}
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: item.bg, color: item.color }}
              >
                {item.icon}
              </div>

              {/* Text */}
              <div className="flex-1">
                <div className="font-barlow font-semibold text-[15px] text-text-body leading-tight mb-1">
                  {item.label}
                </div>
                <div className="font-barlow text-[12px] text-text-muted leading-snug">
                  {item.sub}
                </div>
              </div>

              {/* Ver link */}
              <div
                className="inline-flex items-center gap-0.5 font-barlow text-[12px] font-semibold transition-all duration-200"
                style={{ color: item.color }}
              >
                Ver <ChevronRight size={13} strokeWidth={2.5} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
