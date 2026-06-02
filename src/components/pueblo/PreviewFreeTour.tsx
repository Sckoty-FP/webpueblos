import Link from "next/link";
import Image from "next/image";
import { Calendar, Users, ArrowRight } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import type { TourConProximasSesiones } from "@/lib/supabase/queries/free-tour";

interface Props {
  puebloSlug: string;
  tours: TourConProximasSesiones[];
}

function formatFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default function PreviewFreeTour({ puebloSlug, tours }: Props) {
  if (tours.length === 0) return null;

  return (
    <section id="free-tour" className="bg-black py-20 md:py-24">
      <div className="container-app">
        <SectionHeader
          eyebrow="Free Tours"
          title="Conocé tu pueblo con un guía"
          subtitle="Tours guiados gratuitos. Reservá tu plaza en un clic."
          cta={{ label: "Ver todos →", href: `/${puebloSlug}/free-tour` }}
          variant="dark"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.slice(0, 3).map(t => {
            const next = t.proximas_sesiones[0];
            const disponibles = next
              ? next.cupo_sesion - next.inscritos_count
              : 0;

            return (
              <Link
                key={t.id}
                href={`/${puebloSlug}/free-tour/${t.slug}`}
                className="group relative bg-surface-dark rounded-card-lg overflow-hidden border border-white/8 hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-[16/10] bg-black overflow-hidden">
                  {t.imagen_portada_url ? (
                    <Image
                      src={t.imagen_portada_url}
                      alt={t.titulo}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 photo-ruta1" />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 50%)" }}
                  />
                  <span className="absolute top-3 left-3 inline-flex items-center text-[10px] font-medium uppercase tracking-wider bg-accent-warm text-surface-dark px-2.5 py-1 rounded-pill">
                    Gratis
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="font-fraunces text-lg font-semibold text-white mb-2 line-clamp-2">
                    {t.titulo}
                  </h3>
                  {t.descripcion_corta && (
                    <p className="font-barlow text-sm text-white/65 mb-4 line-clamp-2">
                      {t.descripcion_corta}
                    </p>
                  )}

                  {next ? (
                    <div className="space-y-1.5 font-barlow text-sm text-white/85 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} strokeWidth={1.5} className="text-accent-warm" />
                        {formatFecha(next.fecha)} · {next.hora.slice(0, 5)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} strokeWidth={1.5} className="text-accent-warm" />
                        {disponibles} plazas libres
                      </div>
                    </div>
                  ) : (
                    <p className="font-barlow text-sm text-white/45 mb-4 italic">Sin sesiones próximas</p>
                  )}

                  <span className="inline-flex items-center gap-1 font-barlow text-sm font-medium text-primary group-hover:gap-2 transition-all duration-300">
                    Inscribirse <ArrowRight size={14} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
