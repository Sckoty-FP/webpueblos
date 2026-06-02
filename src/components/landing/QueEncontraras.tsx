import Image from "next/image";
import {
  UtensilsCrossed,
  Scissors,
  Sailboat,
  Footprints,
  MessageSquare,
  Bike,
  type LucideIcon,
} from "lucide-react";

interface Vertical {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const VERTICALES: Vertical[] = [
  {
    icon: UtensilsCrossed,
    title: "Gastronomía",
    subtitle: "Cartas, mesas reservables y delivery cuando lo tienen.",
  },
  {
    icon: Scissors,
    title: "Servicios",
    subtitle: "Peluquería, estética, profesionales y reparaciones.",
  },
  {
    icon: Sailboat,
    title: "Actividades",
    subtitle: "Alquileres, escuelas náuticas, rutas y experiencias.",
  },
  {
    icon: Footprints,
    title: "Free Tours",
    subtitle: "Guías locales con cupo limitado y reserva en un clic.",
  },
  {
    icon: MessageSquare,
    title: "Muro 24h",
    subtitle: "Lo que está pasando hoy mismo, antes de que se pierda.",
  },
  {
    icon: Bike,
    title: "Delivery",
    subtitle: "Pedí a domicilio, seguí al repartidor en tiempo real.",
  },
];

export default function QueEncontraras() {
  return (
    <section id="verticales" className="bg-fog py-24 md:py-32">
      <div className="container-app">
        <div className="grid lg:grid-cols-[5fr_6fr] gap-10 lg:gap-20 items-center">

          {/* Columna foto */}
          <div className="relative aspect-[4/5] rounded-card-lg overflow-hidden bg-surface-dark">
            <Image
              src="/landing/como-funciona-1.jpg"
              alt="Persona con móvil planificando su día en el pueblo mediterráneo"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>

          {/* Columna texto */}
          <div>
            <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
              En cada pueblo
            </span>
            <h2 className="display-section text-text-body mb-3">
              Un pueblo, infinitas<br />formas de vivirlo.
            </h2>
            <p className="font-barlow text-lg text-text-muted mb-10 max-w-md">
              No es una guía. Es la plataforma del día a día: lo que comés,
              dónde dormís, qué hay que hacer hoy y quién lo organiza.
            </p>

            <ul className="space-y-0">
              {VERTICALES.map((v, i) => (
                <li
                  key={v.title}
                  className={`flex items-start gap-4 py-5 ${
                    i < VERTICALES.length - 1 ? "border-b border-divisor" : ""
                  }`}
                >
                  <div className="w-11 h-11 shrink-0 rounded-pill bg-white flex items-center justify-center shadow-sm">
                    <v.icon size={20} strokeWidth={1.5} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-fraunces text-xl font-semibold text-text-body mb-0.5">
                      {v.title}
                    </h3>
                    <p className="font-barlow text-base text-text-muted leading-relaxed">
                      {v.subtitle}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
