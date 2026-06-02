// web/src/components/ui/PremiumCTA.tsx
// Server Component async: lee config de la DB. No renderiza nada si premium_activo=false.
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getPrecioPremiumEur, getPremiumActivo } from "@/lib/supabase/queries/config-plataforma";

interface Props {
  puebloSlug?: string;
  variant?: "wide" | "compact" | "card";
}

export default async function PremiumCTA({ puebloSlug, variant = "wide" }: Props) {
  const activo = await getPremiumActivo();
  if (!activo) return null;

  const precio = await getPrecioPremiumEur();
  const ctaHref = puebloSlug
    ? `/premium?from=${encodeURIComponent(puebloSlug)}`
    : "/premium";

  if (variant === "compact") {
    return (
      <Link
        href={ctaHref}
        className="inline-flex items-center gap-1.5 bg-primary text-white font-barlow font-medium text-xs px-3 py-1.5 rounded-pill no-underline hover:bg-primary-hover transition-colors"
      >
        <Sparkles size={12} strokeWidth={2} />
        Premium {precio}€/mes
      </Link>
    );
  }

  if (variant === "card") {
    return (
      <article className="bg-gradient-to-br from-primary to-primary-hover rounded-card-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} strokeWidth={2} />
          <span className="font-fraunces text-sm font-semibold uppercase tracking-wider">
            Premium
          </span>
        </div>
        <p className="font-fraunces text-2xl font-semibold leading-tight mb-2">
          {precio}€ al mes. Sin anuncios. Beneficios reales en tu pueblo.
        </p>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 mt-3 bg-white text-primary font-barlow font-medium text-sm px-5 py-2.5 rounded-pill no-underline hover:bg-fog transition-colors"
        >
          Conocer más
          <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </article>
    );
  }

  // wide (default)
  const benefits = [
    "Hasta 15% descuento en negocios Premium",
    "Acceso anticipado a reservas y eventos",
    "Badge ✨ visible en tu perfil del muro",
    "Sin contratos · Cancelá cuando quieras",
  ];

  return (
    <section className="bg-[#121314] py-20 md:py-24 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          right: "-120px", top: "50%", transform: "translateY(-50%)",
          width: 480, height: 480, borderRadius: "50%",
          background: "#B8956A10", border: "1px solid #B8956A25",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          right: 80, top: "30%",
          width: 220, height: 220, borderRadius: "50%",
          background: "#B8956A15",
        }}
      />

      <div className="container-app relative z-10">
        <div className="max-w-[620px]">
          <div className="inline-flex items-center gap-2 px-3.5 py-[5px] rounded-pill mb-5"
            style={{ background: "#B8956A22", border: "1px solid #B8956A40", color: "#B8956A" }}
          >
            <Sparkles size={12} strokeWidth={2} />
            <span className="font-barlow text-[11px] font-bold uppercase tracking-[1px]">Premium</span>
          </div>

          <h2 className="font-fraunces font-semibold text-white mb-[18px] leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            Vives más<br />el pueblo.
          </h2>

          <p className="font-barlow font-light text-white/65 mb-8 leading-[1.65] max-w-[520px]"
            style={{ fontSize: 17 }}
          >
            Descuentos exclusivos en restaurantes y hospedajes, acceso anticipado a eventos, badge en tu perfil y mucho más.
          </p>

          <div className="mb-7">
            <span className="font-fraunces font-semibold leading-none"
              style={{ fontSize: "clamp(42px, 5vw, 56px)", color: "#B8956A" }}
            >
              {precio} €
            </span>
            <span className="font-barlow text-base text-white/40 ml-2.5">/ mes</span>
          </div>

          <div className="flex flex-col gap-3 mb-9">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#B8956A25", border: "1px solid #B8956A50" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B8956A" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="font-barlow text-[15px] text-white/78">{b}</span>
              </div>
            ))}
          </div>

          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 font-barlow font-bold text-white px-7 py-3.5 rounded-pill no-underline transition-colors"
            style={{ background: "#B8956A" }}
          >
            Probar Premium 7 días gratis
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
