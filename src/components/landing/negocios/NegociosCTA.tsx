import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function NegociosCTA() {
  return (
    <section className="relative bg-primary py-24 md:py-32 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(184,149,106,0.25), transparent 70%)",
        }}
      />

      <div className="container-app relative text-center">
        <h2 className="display-section text-white mb-4 max-w-3xl mx-auto">
          ¿Listo para empezar?
        </h2>
        <p className="font-barlow text-xl text-white/85 mb-10 max-w-xl mx-auto">
          Una semana de prueba gratis. Cero compromiso. Te ayudamos a montarlo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/auth/registro?tipo=prestador"
            className="inline-flex items-center justify-center gap-2 bg-white text-primary font-barlow font-medium px-7 py-3 rounded-pill hover:bg-white/95 transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
          >
            Crear cuenta
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <Link
            href="/contacto?tipo=negocio"
            className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white font-barlow font-medium px-7 py-3 rounded-pill hover:bg-white/10 transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
          >
            <MessageCircle size={18} strokeWidth={1.5} />
            Hablar primero
          </Link>
        </div>
      </div>
    </section>
  );
}
