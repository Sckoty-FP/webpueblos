import Link from "next/link";
import Image from "next/image";
import { Music2 } from "lucide-react";
import CookieReopener from "@/components/legal/CookieReopener";

function IconInstagram({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFacebook({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const SOCIALS = [
  { Icon: IconInstagram, href: "https://instagram.com/pueblo.app", label: "Instagram" },
  { Icon: IconFacebook,  href: "https://facebook.com/pueblo.app",  label: "Facebook"  },
  { Icon: Music2,        href: "https://tiktok.com/@pueblo.app",   label: "TikTok"    },
];

const LINKS = {
  plataforma: [
    { label: "Pueblos",         href: "/#pueblos"      },
    { label: "Cómo funciona",   href: "/#verticales"   },
    { label: "Para negocios",   href: "/para-negocios" },
    { label: "Contacto",        href: "/contacto"      },
  ],
  paraTi: [
    { label: "Iniciar sesión", href: "/auth/login"    },
    { label: "Registrarme",    href: "/auth/registro" },
    { label: "Mi cuenta",      href: "/perfil"        },
  ],
  paraNegocios: [
    { label: "Cómo funciona", href: "/para-negocios"          },
    { label: "Planes",        href: "/para-negocios#planes"   },
    { label: "Contacto",      href: "/contacto?tipo=negocio"  },
  ],
  legal: [
    { label: "Privacidad",   href: "/privacidad"  },
    { label: "Términos",     href: "/terminos"    },
    { label: "Cookies",      href: "/cookies"     },
    { label: "Aviso legal",  href: "/aviso-legal" },
  ],
};

interface FooterProps {
  variant?: "pueblo" | "institutional";
}

export default function Footer({ variant = "pueblo" }: FooterProps) {
  void variant;
  return <FooterBase />;
}

function FooterBase() {
  return (
    <footer className="bg-surface-dark text-white pt-16 pb-8">
      <div className="container-app">
        {/* Top: logo + tagline */}
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 mb-12">
          <div>
            <Link href="/" className="inline-block mb-4 no-underline">
              <Image
                src="/logo-wordmark.png"
                alt="PUEBLO"
                width={140}
                height={35}
                className="object-contain brightness-0 invert"
              />
            </Link>
            <p className="font-barlow text-base text-white/65 max-w-md leading-relaxed">
              Plataforma para pueblos turísticos mediterráneos. Gastronomía, actividades, servicios y muro social, pueblo por pueblo.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            {SOCIALS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                <s.Icon size={18} strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <FooterCol title="Plataforma" links={LINKS.plataforma}   />
          <FooterCol title="Para ti"    links={LINKS.paraTi}       />
          <FooterCol title="Negocios"   links={LINKS.paraNegocios} />
          <FooterColLegal />
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <span className="font-barlow text-[13px] text-white/55">
            © {new Date().getFullYear()} PUEBLO · Hecho con cariño en la Costa del Azahar
          </span>
          <span className="font-barlow text-[13px] text-white/45 inline-flex items-center gap-2">
            ES
            <span className="w-1 h-1 rounded-full bg-white/30" />
            EUR
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h4 className="font-fraunces text-sm font-semibold text-white/85 mb-4 uppercase tracking-wider">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="font-barlow text-sm text-white/65 hover:text-white transition-colors no-underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterColLegal() {
  return (
    <div>
      <h4 className="font-fraunces text-sm font-semibold text-white/85 mb-4 uppercase tracking-wider">
        Legal
      </h4>
      <ul className="space-y-2.5">
        {LINKS.legal.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="font-barlow text-sm text-white/65 hover:text-white transition-colors no-underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
        <li>
          <CookieReopener />
        </li>
      </ul>
    </div>
  );
}
