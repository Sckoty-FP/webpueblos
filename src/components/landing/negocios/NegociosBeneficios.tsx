import { TrendingUp, Users, CalendarCheck, BarChart3, type LucideIcon } from "lucide-react";

interface Beneficio {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const BENEFICIOS: Beneficio[] = [
  {
    icon: Users,
    title: "Llegás a más turistas",
    desc: "Visibilidad en la home del pueblo, listados por categoría y muro social del día.",
  },
  {
    icon: TrendingUp,
    title: "Vendés más sin contratar más",
    desc: "Delivery, reservas, carta, presupuestos: el trabajo lo hace la plataforma.",
  },
  {
    icon: CalendarCheck,
    title: "Tu agenda al día",
    desc: "Mesas, citas, alquileres, free tours: todo en un calendario único.",
  },
  {
    icon: BarChart3,
    title: "Datos para crecer",
    desc: "Caja, comisiones, partes de trabajo: sabés cuánto facturás cada día.",
  },
];

export default function NegociosBeneficios() {
  return (
    <section className="bg-black py-24 md:py-28">
      <div className="container-app">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFICIOS.map((b) => (
            <article
              key={b.title}
              className="bg-surface-dark border border-white/8 rounded-card p-6 hover:border-white/20 transition-colors duration-200"
            >
              <div className="w-11 h-11 rounded-pill bg-primary/15 text-primary flex items-center justify-center mb-5">
                <b.icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-fraunces text-xl font-semibold text-white mb-2">
                {b.title}
              </h3>
              <p className="font-barlow text-base text-white/65 leading-relaxed">
                {b.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
