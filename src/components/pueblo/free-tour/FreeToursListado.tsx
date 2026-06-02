import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import type { TourConProximasSesiones } from "@/lib/supabase/queries/free-tour";
import { DIFICULTAD_LABEL } from "@/types/free-tour";

interface Props {
  puebloSlug: string;
  tours: TourConProximasSesiones[];
}

const IDIOMA_FLAGS: Record<string, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
  de: "🇩🇪",
  it: "🇮🇹",
  pt: "🇵🇹",
};

function formatFecha(fechaStr: string): string {
  const [year, month, day] = fechaStr.split("-").map(Number);
  const fecha = new Date(year, month - 1, day);
  return fecha.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function FreeToursListado({ puebloSlug, tours }: Props) {
  if (tours.length === 0) {
    return (
      <div className="container-app py-24 text-center">
        <p className="font-fraunces text-2xl text-text-muted mb-2">
          No hay free tours por ahora
        </p>
        <p className="font-barlow text-base text-text-muted">
          Volvé pronto: estamos sumando guías locales.
        </p>
      </div>
    );
  }

  return (
    <div className="container-app py-10 md:py-12">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tours.map(t => {
          const next = t.proximas_sesiones[0];
          return (
            <div
              key={t.id}
              className="bg-white rounded-[19px] overflow-hidden border border-[#f0f0f0] flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-fog overflow-hidden">
                {t.imagen_portada_url ? (
                  <Image
                    src={t.imagen_portada_url}
                    alt={t.titulo}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 photo-ruta1" />
                )}
                <span className="absolute top-2.5 left-2.5 font-barlow text-[10px] font-bold uppercase tracking-wider text-surface-dark bg-accent-warm px-2.5 py-1 rounded-pill">
                  GRATIS
                </span>
              </div>

              <div className="px-5 pt-4 pb-5 flex flex-col flex-1">
                {/* Title */}
                <h3 className="font-fraunces text-lg font-semibold text-text-body line-clamp-2 mb-3">
                  {t.titulo}
                </h3>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 font-barlow text-xs text-text-muted mb-4">
                  <span className="flex items-center gap-1">
                    <Clock size={11} strokeWidth={1.5} />
                    {t.duracion_minutos} min
                  </span>
                  <span>{DIFICULTAD_LABEL[t.dificultad]}</span>
                  {t.idiomas?.length > 0 && (
                    <span>
                      {t.idiomas.map(i => IDIOMA_FLAGS[i] ?? i.toUpperCase()).join(" ")}
                    </span>
                  )}
                </div>

                {/* Próxima sesión */}
                <div className="rounded-[10px] border border-[#0070cc33] bg-[#0070cc08] px-3.5 py-3 mb-4">
                  <p className="font-barlow text-[10px] font-semibold uppercase tracking-[0.12em] text-primary mb-1">
                    Próxima sesión
                  </p>
                  {next ? (
                    <p className="font-fraunces text-sm font-semibold text-text-body">
                      {formatFecha(next.fecha)} · {next.hora.slice(0, 5)}
                    </p>
                  ) : (
                    <p className="font-barlow text-sm text-text-muted italic">
                      Sin sesiones próximas
                    </p>
                  )}
                </div>

                {/* Punto de encuentro */}
                {t.punto_encuentro_nombre && (
                  <p className="font-barlow text-xs text-text-muted flex items-center gap-1.5 mb-4">
                    <MapPin size={11} strokeWidth={1.5} className="shrink-0" />
                    {t.punto_encuentro_nombre}
                  </p>
                )}

                {/* CTA */}
                <Link
                  href={`/${puebloSlug}/free-tour/${t.slug}`}
                  className="mt-auto w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-barlow text-sm font-semibold py-2.5 rounded-pill hover:bg-primary/90 transition-colors no-underline"
                >
                  Inscribirme →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
