import Link from "next/link";
import { ChevronDown, Bike } from "lucide-react";
import type { PuebloDB } from "@/lib/supabase/queries/pueblos";
import PuebloHeroBackground from "./PuebloHeroBackground";

interface Props {
  pueblo: PuebloDB;
  hayDelivery: boolean;
  stats?: { negocios?: number; actividades?: number };
}

export default function PuebloHero({ pueblo, hayDelivery, stats }: Props) {
  const statItems: [string, string][] = [
    ...(stats?.negocios ? [[`${stats.negocios}`, "Negocios activos"] as [string, string]] : []),
    ...(stats?.actividades ? [[`${stats.actividades}`, "Actividades"] as [string, string]] : []),
    ["24h", "Muro en vivo"],
  ];

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "88vh", maxHeight: 920 }}>
      <PuebloHeroBackground
        imagenes={pueblo.imagenes_hero ?? []}
        fallback={pueblo.imagen_portada}
        alt={`Vista panorámica de ${pueblo.nombre}`}
      />

      {/* Main gradient scrim — refuerzo abajo + izquierda para que el texto
          (alineado abajo-izquierda) sea legible sobre cualquier foto, por
          clara que sea. Replicable: vale para todos los pueblos. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.8) 26%, rgba(0,0,0,0.5) 52%, rgba(0,0,0,0.2) 80%, transparent 100%), linear-gradient(to right, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.2) 45%, transparent 72%)",
        }}
      />
      {/* Subtle radial accents */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 85%, rgba(0,112,204,0.15), transparent 70%), radial-gradient(ellipse 70% 60% at 70% 20%, rgba(184,149,106,0.12), transparent 70%)",
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col justify-end container-app pb-16 md:pb-24"
        style={{
          minHeight: "88vh",
          maxHeight: 920,
          // La sombra se hereda a todo el texto hijo → legible sobre cualquier foto.
          textShadow: "0 1px 20px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)",
        }}
      >
        {/* Eyebrow pill with live pulse */}
        <div className="inline-flex items-center gap-2 w-fit bg-black/55 backdrop-blur-md border border-white/30 rounded-pill px-3.5 py-1.5 mb-5">
          <span
            className="shrink-0 rounded-full bg-green-400"
            style={{ width: 7, height: 7, animation: "pulse 2s ease infinite" }}
          />
          <span className="font-barlow text-[11px] font-semibold text-white tracking-wide uppercase">
            {pueblo.provincia ?? "España"} · Costa del Mediterráneo
          </span>
        </div>

        {/* Title */}
        <h1 className="display-hero text-white mb-4 max-w-3xl">
          {pueblo.nombre_completo ?? pueblo.nombre}
        </h1>

        {/* Description */}
        {pueblo.descripcion_corta && (
          <p className="font-barlow text-lg md:text-xl font-light text-white/95 max-w-xl mb-8 leading-relaxed">
            {pueblo.descripcion_corta}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 sm:mb-12">
          <a
            href="#gastronomia"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-barlow font-semibold px-7 py-3 rounded-pill transition-all duration-200"
          >
            Explorar el pueblo
          </a>

          {hayDelivery ? (
            <Link
              href={`/${pueblo.slug}/gastronomia?delivery=true`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/18 backdrop-blur-sm border border-white/30 hover:border-white/55 text-white font-barlow font-medium px-7 py-3 rounded-pill transition-all duration-200"
            >
              <Bike size={17} strokeWidth={1.5} />
              Pedir delivery
            </Link>
          ) : (
            <Link
              href={`/${pueblo.slug}/muro`}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/18 backdrop-blur-sm border border-white/30 hover:border-white/55 text-white font-barlow font-medium px-7 py-3 rounded-pill transition-all duration-200"
            >
              Ver el muro
            </Link>
          )}
        </div>

        {/* Stats */}
        {statItems.length > 0 && (
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {statItems.map(([value, label]) => (
              <div key={label}>
                <div
                  className="font-fraunces text-white leading-none mb-1"
                  style={{ fontSize: "clamp(22px, 2.4vw, 30px)" }}
                >
                  {value}
                </div>
                <div className="font-barlow text-[11px] font-semibold uppercase tracking-[0.4px] text-white/75">
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scroll cue */}
      <div className="hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <ChevronDown size={26} strokeWidth={1.5} color="rgba(255,255,255,0.4)" />
      </div>
    </section>
  );
}
