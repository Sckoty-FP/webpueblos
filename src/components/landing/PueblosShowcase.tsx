import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import type { PuebloDB } from "@/lib/supabase/queries/pueblos";
import type { ActividadDestacada } from "@/lib/supabase/queries/landing";

interface Props {
  pueblos: PuebloDB[];
  destacados: Record<number, ActividadDestacada[]>;
}

export default function PueblosShowcase({ pueblos, destacados }: Props) {
  const activos = pueblos.filter((p) => p.activo);

  return (
    <section id="pueblos" className="bg-black py-24 md:py-32">
      <div className="container-app">
        {/* Header */}
        <header className="mb-12 md:mb-16 max-w-2xl">
          <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
            Pueblos disponibles
          </span>
          <h2 className="display-section text-white mb-4">
            Empezamos pequeño.<br />Crecemos con cada pueblo.
          </h2>
          <p className="font-barlow text-lg text-white/65 leading-relaxed">
            Cada pueblo es una experiencia distinta. Elegí el tuyo y descubrí gastronomía,
            actividades, servicios y todo lo que pasa hoy mismo en su muro.
          </p>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activos.map((p) => (
            <PuebloCard
              key={p.id}
              pueblo={p}
              actividades={destacados[p.id] ?? []}
            />
          ))}
          <PuebloProximamenteCard />
        </div>
      </div>
    </section>
  );
}

function PuebloCard({
  pueblo,
  actividades,
}: {
  pueblo: PuebloDB;
  actividades: ActividadDestacada[];
}) {
  return (
    <Link
      href={`/${pueblo.slug}`}
      className="group relative aspect-[4/5] rounded-card-lg overflow-hidden bg-surface-dark block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-black transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Foto */}
      {pueblo.imagen_portada ? (
        <Image
          src={pueblo.imagen_portada}
          alt={`Vista de ${pueblo.nombre}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-dark to-black" />
      )}

      {/* Scrim */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={14} strokeWidth={1.5} className="text-white/65" />
          <span className="font-barlow text-sm text-white/65">
            {pueblo.provincia ?? "España"}
          </span>
        </div>
        <h3 className="display-module text-white mb-2">{pueblo.nombre}</h3>
        {pueblo.descripcion_corta && (
          <p className="font-barlow text-base text-white/85 mb-4 line-clamp-2">
            {pueblo.descripcion_corta}
          </p>
        )}

        {/* Actividades (siempre en mobile, hover-reveal en desktop) */}
        {actividades.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            {actividades.map((a) => (
              <span
                key={a.id}
                className="text-[11px] font-barlow font-medium text-white bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-pill"
              >
                {a.nombre}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <span className="inline-flex items-center gap-1.5 font-barlow font-medium text-white">
          Explorar
          <ArrowRight
            size={16}
            strokeWidth={2}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}

function PuebloProximamenteCard() {
  return (
    <Link
      href="/contacto?tipo=interesado_pueblo"
      className="group aspect-[4/5] rounded-card-lg border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-center p-6 hover:border-white/35 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-black"
    >
      <div className="w-14 h-14 rounded-full bg-white/8 flex items-center justify-center mb-5 group-hover:bg-white/15 transition-colors">
        <MapPin size={24} strokeWidth={1.5} className="text-white/55" />
      </div>
      <h3 className="display-module text-white/85 mb-2">¿Tu pueblo?</h3>
      <p className="font-barlow text-base text-white/55 mb-5 max-w-[220px]">
        Avisame cuando PUEBLO llegue al tuyo. Sin spam, sin costes.
      </p>
      <span className="inline-flex items-center gap-1.5 font-barlow font-medium text-primary">
        Apuntate
        <ArrowRight
          size={16}
          strokeWidth={2}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}
