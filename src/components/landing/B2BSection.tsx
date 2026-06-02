import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";

const VENTAJAS = [
  "Sin instalar nada — funciona en el navegador",
  "Suscripción mensual editable según tu negocio",
  "Cancela cuando quieras, sin permanencia",
];

export default function B2BSection() {
  return (
    <section id="para-negocios" className="bg-surface-dark py-24 md:py-32">
      <div className="container-app">
        <div className="grid lg:grid-cols-[5fr_6fr] gap-10 lg:gap-20 items-center">

          {/* Mockup panel */}
          <div className="relative aspect-[4/5] rounded-card-lg overflow-hidden bg-black">
            <Image
              src="/landing/negocios-hero.jpg"
              alt="Interior de restaurante familiar mediterráneo"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0,112,204,0.18), transparent 60%)",
              }}
            />
          </div>

          {/* Pitch + CTA */}
          <div>
            <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
              Para negocios
            </span>
            <h2 className="display-section text-white mb-4">
              Tu negocio, todo el día.<br />Todo en un panel.
            </h2>
            <p className="font-barlow text-lg text-white/70 mb-8 max-w-md leading-relaxed">
              Reservas, carta digital, delivery, inventario, caja, partes de
              trabajo, free tours. Cada tipo de negocio recibe los módulos
              que necesita, ni uno más.
            </p>

            <ul className="space-y-3 mb-10">
              {VENTAJAS.map((v) => (
                <li key={v} className="flex items-center gap-3 font-barlow text-base text-white/85">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                  {v}
                </li>
              ))}
            </ul>

            <Link
              href="/para-negocios"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-barlow font-medium px-7 py-3 rounded-pill transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-dark"
            >
              Ver planes y módulos
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
