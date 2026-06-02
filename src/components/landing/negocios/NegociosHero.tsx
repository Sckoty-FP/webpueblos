import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function NegociosHero() {
  return (
    <section className="relative bg-surface-dark pt-20 overflow-hidden">
      <div className="container-app">
        <div className="grid lg:grid-cols-[6fr_5fr] gap-10 lg:gap-16 items-end">

          {/* Texto */}
          <div className="pt-16 pb-16 lg:pb-20">
            <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
              Para negocios
            </span>
            <h1 className="display-hero text-white mb-6">
              El día a día de tu negocio,<br />sin papeleo.
            </h1>
            <p className="font-barlow text-xl font-light text-white/75 max-w-xl mb-10 leading-relaxed">
              Plataforma todo-en-uno: reservas, carta digital, delivery, partes de
              trabajo, free tours. Sin instalar nada, en cualquier dispositivo.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/auth/registro?tipo=prestador"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-barlow font-medium px-7 py-3 rounded-pill transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-dark"
              >
                Empezar ahora
                <ArrowRight size={18} strokeWidth={2} />
              </Link>
              <Link
                href="/contacto?tipo=negocio"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/40 hover:border-white text-white font-barlow font-medium px-7 py-3 rounded-pill transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-surface-dark"
              >
                <MessageCircle size={18} strokeWidth={1.5} />
                Hablar con nosotros
              </Link>
            </div>
          </div>

          {/* Imagen */}
          <div className="relative h-[480px] lg:h-[560px] rounded-t-card-lg overflow-hidden bg-black">
            <Image
              src="/landing/negocios-hero.jpg"
              alt="Interior de restaurante familiar mediterráneo"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority
              className="object-cover object-center"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(18,19,20,0.6) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0,112,204,0.15), transparent 60%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
