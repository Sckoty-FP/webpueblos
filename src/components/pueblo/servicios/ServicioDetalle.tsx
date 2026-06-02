import Image from "next/image";
import { MapPin, Phone, Globe, MessageSquare, Star, BadgeCheck } from "lucide-react";
import CTAsServicio from "./CTAsServicio";
import { horariosToDisplay } from "@/lib/utils/prestadores";
import type { PrestadorDB } from "@/types";

interface Props {
  puebloSlug: string;
  prestador: PrestadorDB;
}

export default function ServicioDetalle({ puebloSlug, prestador }: Props) {
  const serviciosActivos = prestador.servicios?.filter(s => s.activo) ?? [];
  const horarios = horariosToDisplay(prestador.horarios ?? []);

  return (
    <div className="min-h-screen bg-fog">
      <section className="relative h-[34vh] md:h-[44vh] max-h-[420px] bg-surface-dark">
        {prestador.imagen_portada_url ? (
          <Image
            src={prestador.imagen_portada_url}
            alt={prestador.nombre}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 photo-bar" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-end pb-8">
          <div className="container-app">
            {prestador.verificado && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-white/15 backdrop-blur-sm text-white px-2.5 py-1 rounded-pill mb-3">
                <BadgeCheck size={12} strokeWidth={2} /> Verificado
              </span>
            )}
            <h1 className="display-section text-white mb-3">{prestador.nombre}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/85 font-barlow text-sm">
              {prestador.rating_promedio > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                  {prestador.rating_promedio.toFixed(1)} ({prestador.total_reviews})
                </span>
              )}
              {prestador.direccion && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} strokeWidth={1.5} /> {prestador.direccion}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <CTAsServicio prestador={prestador} puebloSlug={puebloSlug} />

      <section className="container-app py-12 md:py-16 grid lg:grid-cols-[1fr_320px] gap-10">
        <div>
          {prestador.descripcion && (
            <div className="mb-10">
              <h2 className="display-module text-text-body mb-4">Sobre el negocio</h2>
              <p className="font-barlow text-base text-text-body whitespace-pre-line leading-relaxed">
                {prestador.descripcion}
              </p>
            </div>
          )}

          {serviciosActivos.length > 0 && (
            <div className="mb-10">
              <h2 className="display-module text-text-body mb-4">Servicios</h2>
              <div className="space-y-3">
                {serviciosActivos.map(s => (
                  <article
                    key={s.id}
                    className="bg-white border border-divisor rounded-card p-4 flex justify-between items-start gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-fraunces text-base font-semibold text-text-body mb-1">
                        {s.nombre}
                      </h3>
                      {s.descripcion && (
                        <p className="font-barlow text-sm text-text-muted leading-relaxed">
                          {s.descripcion}
                        </p>
                      )}
                    </div>
                    {s.precio_desde && (
                      <span className="font-fraunces text-base font-semibold text-primary whitespace-nowrap">
                        desde €{s.precio_desde}
                      </span>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {prestador.galeria_urls && prestador.galeria_urls.length > 0 && (
            <div className="mb-10">
              <h2 className="display-module text-text-body mb-4">Galería</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {prestador.galeria_urls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-card overflow-hidden bg-fog">
                    <Image
                      src={url}
                      alt={`Foto ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {Object.keys(horarios).length > 0 && (
            <div className="bg-white border border-divisor rounded-card p-5">
              <h3 className="font-fraunces text-base font-semibold text-text-body mb-3">
                Horarios
              </h3>
              <ul className="space-y-1 font-barlow text-sm">
                {Object.entries(horarios).map(([dia, hora]) => (
                  <li key={dia} className="flex justify-between">
                    <span className="text-text-muted">{dia}</span>
                    <span className="text-text-body">{hora}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white border border-divisor rounded-card p-5">
            <h3 className="font-fraunces text-base font-semibold text-text-body mb-3">Contacto</h3>
            <ul className="space-y-2.5 font-barlow text-sm">
              {prestador.telefono && (
                <li>
                  <a
                    href={`tel:${prestador.telefono}`}
                    className="flex items-center gap-2 text-text-body hover:text-primary"
                  >
                    <Phone size={14} strokeWidth={1.5} /> {prestador.telefono}
                  </a>
                </li>
              )}
              {prestador.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${prestador.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-text-body hover:text-primary"
                  >
                    <MessageSquare size={14} strokeWidth={1.5} /> WhatsApp
                  </a>
                </li>
              )}
              {prestador.web && (
                <li>
                  <a
                    href={prestador.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-text-body hover:text-primary"
                  >
                    <Globe size={14} strokeWidth={1.5} /> Sitio web
                  </a>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
