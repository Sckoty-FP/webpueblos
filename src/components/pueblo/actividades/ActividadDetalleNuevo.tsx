import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import FormReservaActividad from "./FormReservaActividad";
import RecursoCard from "./RecursoCard";
import type { ActividadCompleta } from "@/lib/supabase/queries/pueblo-home";

interface Props {
  puebloSlug: string;
  actividad: ActividadCompleta;
}

export default function ActividadDetalleNuevo({ actividad, puebloSlug }: Props) {
  const serviciosReservables = actividad.servicios.filter(s => s.reservable);

  return (
    <div className="min-h-screen bg-fog">
      <section className="relative h-[40vh] md:h-[50vh] max-h-[480px] bg-surface-dark">
        {actividad.imagen_portada_url ? (
          <Image
            src={actividad.imagen_portada_url}
            alt={actividad.nombre}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 photo-surf" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-end pb-8">
          <div className="container-app">
            <h1 className="display-section text-white mb-3">{actividad.nombre}</h1>
            <div className="flex items-center gap-4 text-white/85 font-barlow text-sm">
              {actividad.rating_promedio > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                  {actividad.rating_promedio.toFixed(1)}
                </span>
              )}
              {actividad.direccion && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} strokeWidth={1.5} /> {actividad.direccion}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-app py-12 md:py-16 grid lg:grid-cols-[1fr_400px] gap-10">
        <div>
          {actividad.descripcion && (
            <div className="mb-10">
              <h2 className="display-module text-text-body mb-4">Sobre la actividad</h2>
              <p className="font-barlow text-base whitespace-pre-line leading-relaxed text-text-body">
                {actividad.descripcion}
              </p>
            </div>
          )}

          {actividad.recursos.length > 0 && (
            <div>
              <h2 className="display-module text-text-body mb-4">Recursos disponibles</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {actividad.recursos.map(r => (
                  <RecursoCard key={r.id} recurso={r} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 h-fit">
          <FormReservaActividad
            puebloSlug={puebloSlug}
            prestadorId={actividad.id}
            servicios={serviciosReservables}
            recursos={actividad.recursos}
          />
        </aside>
      </section>
    </div>
  );
}
