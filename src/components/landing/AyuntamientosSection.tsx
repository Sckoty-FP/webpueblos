import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";

const PUNTOS = [
  "Cero coste para el ayuntamiento",
  "Co-marketing local del pueblo",
  "Datos abiertos para turismo municipal",
];

export default function AyuntamientosSection() {
  return (
    <section id="para-ayuntamientos" className="bg-black py-24 md:py-32">
      <div className="container-app">
        <div className="grid lg:grid-cols-[6fr_5fr] gap-10 lg:gap-20 items-center">

          {/* Pitch + CTA */}
          <div className="order-2 lg:order-1">
            <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
              Para ayuntamientos
            </span>
            <h2 className="display-section text-white mb-4">
              Traé PUEBLO<br />a tu pueblo.
            </h2>
            <p className="font-barlow text-lg text-white/70 mb-8 max-w-md leading-relaxed">
              Damos visibilidad al comercio local, mejoramos la experiencia
              turística y centralizamos el día a día del municipio. Vos solo
              nos das luz verde para empezar.
            </p>

            <ul className="space-y-3 mb-10">
              {PUNTOS.map((p) => (
                <li key={p} className="flex items-center gap-3 font-barlow text-base text-white/85">
                  <span className="w-5 h-5 rounded-full bg-accent-warm/20 text-accent-warm flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>

            <Link
              href="/contacto?tipo=ayuntamiento"
              className="inline-flex items-center gap-2 bg-accent-warm hover:bg-accent-warm/85 text-surface-dark font-barlow font-medium px-7 py-3 rounded-pill transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-accent-warm focus:ring-offset-2 focus:ring-offset-black"
            >
              Hablemos
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>

          {/* Imagen */}
          <div className="order-1 lg:order-2 relative aspect-[4/5] rounded-card-lg overflow-hidden bg-surface-dark">
            <Image
              src="/placeholders/pueblo.jpg"
              alt="Vista aérea de pueblo mediterráneo costero"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 40% at 70% 30%, rgba(184,149,106,0.18), transparent 60%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
