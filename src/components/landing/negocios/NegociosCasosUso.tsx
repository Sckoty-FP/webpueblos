import Image from "next/image";

interface Caso {
  id: string;
  imagen: string;
  titulo: string;
  resumen: string;
  modulos: string[];
}

const CASOS: Caso[] = [
  {
    id: "bar-tapas",
    imagen: "/landing/negocios-1.jpg",
    titulo: "Bar de tapas con carta y delivery",
    resumen: "Carta digital escaneable desde la mesa, pedidos delivery los fines de semana.",
    modulos: ["Carta", "Mesas QR", "Delivery", "Caja"],
  },
  {
    id: "apartamento",
    imagen: "/placeholders/prestador.jpg",
    titulo: "Apartamento turístico con reservas directas",
    resumen: "Calendario unificado, sin comisiones de plataformas externas.",
    modulos: ["Propiedades", "Reservas", "Notas"],
  },
  {
    id: "peluqueria",
    imagen: "/landing/negocios-2.jpg",
    titulo: "Peluquería con cita online por profesional",
    resumen: "Cada profesional su agenda, cliente elige horario y persona.",
    modulos: ["Profesionales", "Reservas", "Caja"],
  },
  {
    id: "escuela-nautica",
    imagen: "/placeholders/actividad.jpg",
    titulo: "Escuela náutica con alquiler de motos de agua",
    resumen: "Recursos disponibles, consentimientos firmados, sin solapamientos.",
    modulos: ["Actividades", "Recursos", "Reservas", "Caja"],
  },
];

export default function NegociosCasosUso() {
  return (
    <section className="bg-surface-dark py-24 md:py-28">
      <div className="container-app">
        <header className="mb-12 max-w-2xl">
          <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
            Casos de uso
          </span>
          <h2 className="display-section text-white mb-3">Pensado para tu negocio.</h2>
          <p className="font-barlow text-lg text-white/65 leading-relaxed">
            Cada tipo de negocio aprovecha PUEBLO a su manera. Estos son algunos.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CASOS.map((c) => (
            <article
              key={c.id}
              className="bg-black/40 rounded-card-lg overflow-hidden border border-white/8"
            >
              <div className="relative aspect-[4/3] bg-surface-dark">
                <Image
                  src={c.imagen}
                  alt={c.titulo}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-fraunces text-lg font-semibold text-white mb-2 leading-snug">
                  {c.titulo}
                </h3>
                <p className="font-barlow text-sm text-white/65 mb-4 leading-relaxed">
                  {c.resumen}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.modulos.map((m) => (
                    <span
                      key={m}
                      className="text-[11px] font-barlow font-medium text-primary bg-primary/15 px-2.5 py-1 rounded-pill"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
