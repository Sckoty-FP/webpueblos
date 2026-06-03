import { MapPin, Clock, Users, Languages, Footprints } from "lucide-react";
import Image from "next/image";
import SesionPicker from "./SesionPicker";
import type { FreeTourDB, FreeTourSesionDB } from "@/types/free-tour";
import type { PuebloDB } from "@/lib/supabase/queries/pueblos";

interface Props {
  pueblo: PuebloDB;
  tour: FreeTourDB;
  sesiones: FreeTourSesionDB[];
}

const IDIOMA_LABEL: Record<string, string> = {
  es: "ES",
  en: "EN",
  fr: "FR",
  de: "DE",
  it: "IT",
  pt: "PT",
};

export default function FreeTourDetalle({ pueblo, tour, sesiones }: Props) {
  return (
    <div className="min-h-screen bg-fog">
      <section className="relative h-[40vh] md:h-[48vh] max-h-[440px] bg-surface-dark">
        {tour.imagen_portada_url ? (
          <Image
            src={tour.imagen_portada_url}
            alt={tour.titulo}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 photo-ruta1" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-end pb-8">
          <div className="container-app">
            <span className="inline-flex items-center mb-3 text-[11px] font-medium uppercase tracking-wider bg-accent-warm text-surface-dark px-2.5 py-1 rounded-pill">
              Free Tour · {pueblo.nombre}
            </span>
            <h1 className="display-section text-white mb-3">{tour.titulo}</h1>
            <div className="flex flex-wrap gap-4 text-white/85 font-barlow text-sm">
              <span className="flex items-center gap-1.5">
                <Clock size={14} strokeWidth={1.5} /> {tour.duracion_minutos} min
              </span>
              {tour.distancia_km && (
                <span className="flex items-center gap-1.5">
                  <Footprints size={14} strokeWidth={1.5} /> {tour.distancia_km} km
                </span>
              )}
              {tour.idiomas.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Languages size={14} strokeWidth={1.5} />
                  {tour.idiomas.map(i => IDIOMA_LABEL[i] ?? i.toUpperCase()).join(" · ")}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users size={14} strokeWidth={1.5} /> Máx {tour.cupo_maximo}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-app py-12 md:py-16 grid lg:grid-cols-[1fr_400px] gap-10">
        <div>
          <div className="mb-10">
            <h2 className="display-module text-text-body mb-4">Sobre el tour</h2>
            <p className="font-barlow text-base whitespace-pre-line leading-relaxed text-text-body">
              {tour.descripcion}
            </p>
          </div>

          {tour.punto_encuentro_nombre && (
            <div className="mb-10 bg-white border border-divisor rounded-card p-5">
              <h3 className="font-fraunces text-lg font-semibold text-text-body mb-2 flex items-center gap-2">
                <MapPin size={18} strokeWidth={1.5} className="text-primary" />
                Punto de encuentro
              </h3>
              <p className="font-barlow text-base text-text-body">
                {tour.punto_encuentro_nombre}
              </p>
              {tour.punto_final_nombre && (
                <p className="font-barlow text-sm text-text-muted mt-2">
                  Termina en: {tour.punto_final_nombre}
                </p>
              )}
            </div>
          )}

          {tour.incluye.length > 0 && (
            <div className="mb-10">
              <h3 className="font-fraunces text-lg font-semibold text-text-body mb-3">Incluye</h3>
              <ul className="space-y-1.5 font-barlow text-base text-text-body">
                {tour.incluye.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-1">·</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tour.llevar.length > 0 && (
            <div className="mb-10">
              <h3 className="font-fraunces text-lg font-semibold text-text-body mb-3">Llevá</h3>
              <ul className="space-y-1.5 font-barlow text-base text-text-body">
                {tour.llevar.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-1">·</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tour.observaciones && (
            <div className="mb-10 bg-yellow-50 border border-yellow-200 rounded-card p-5">
              <p className="font-barlow text-sm text-yellow-800 leading-relaxed">
                {tour.observaciones}
              </p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 h-fit">
          <div className="bg-white border border-divisor rounded-card-lg p-6 shadow-card">
            <h3 className="font-fraunces text-xl font-semibold text-text-body mb-1">
              Reservá tu plaza
            </h3>
            <p className="font-barlow text-sm text-text-muted mb-5">Al final, le dás al guía lo que quieras. Cupo limitado.</p>
            {sesiones.length === 0 ? (
              <p className="font-barlow text-base text-text-muted">
                No hay sesiones próximas. Volvé pronto.
              </p>
            ) : (
              <SesionPicker sesiones={sesiones} tour={tour} />
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
