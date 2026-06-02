import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Calendar, Users, ExternalLink, Tag } from "lucide-react";
import type { EventoDB } from "@/types/eventos";
import { CATEGORIA_EVENTO_LABEL, CATEGORIA_EVENTO_COLOR } from "@/types/eventos";
import { formatAbsolute } from "@/lib/format/relative-date";

interface Props {
  evento: EventoDB;
  puebloNombre: string;
  puebloSlug: string;
}

export default function EventoDetalle({ evento: e, puebloNombre, puebloSlug }: Props) {
  const color = CATEGORIA_EVENTO_COLOR[e.categoria] ?? "#6b7280";
  const categoriaLabel = CATEGORIA_EVENTO_LABEL[e.categoria] ?? "Evento";

  const fechaInicio = new Date(e.fecha_inicio);
  const fechaFin = e.fecha_fin ? new Date(e.fecha_fin) : null;

  const precioDisplay = e.gratis || !e.precio || e.precio === 0
    ? "Gratis"
    : `${e.precio}€`;

  return (
    <div className="min-h-screen bg-fog">
      {/* Hero */}
      <section className="relative h-[38vh] md:h-[44vh] max-h-[400px]" style={{ background: color }}>
        {e.imagen_url ? (
          <Image
            src={e.imagen_url}
            alt={e.titulo}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.72) 100%)" }}
        />
        <div className="relative z-10 h-full flex flex-col justify-end pb-8">
          <div className="container-app">
            <nav className="flex items-center gap-1.5 mb-3">
              <Link href={`/${puebloSlug}`} className="font-barlow text-xs text-white/60 hover:text-white no-underline">
                {puebloNombre}
              </Link>
              <span className="text-white/40 text-xs">/</span>
              <Link href={`/${puebloSlug}/eventos`} className="font-barlow text-xs text-white/60 hover:text-white no-underline">
                Eventos
              </Link>
            </nav>
            <span
              className="inline-block font-barlow text-[11px] font-semibold uppercase tracking-wider text-white px-2.5 py-1 rounded-pill mb-3"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
            >
              {categoriaLabel}
            </span>
            <h1 className="display-section text-white mb-3">{e.titulo}</h1>
            <div className="flex flex-wrap gap-4 text-white/85 font-barlow text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} strokeWidth={1.5} />
                {e.todo_el_dia
                  ? formatAbsolute(fechaInicio, false)
                  : formatAbsolute(fechaInicio)}
              </span>
              {e.lugar && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} strokeWidth={1.5} /> {e.lugar}
                </span>
              )}
              <span
                className="flex items-center gap-1.5 font-semibold"
                style={{ color: e.gratis ? "#86efac" : "#fde68a" }}
              >
                <Tag size={14} strokeWidth={1.5} /> {precioDisplay}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container-app py-10 md:py-14 grid lg:grid-cols-[1fr_340px] gap-10">
        {/* Left */}
        <div>
          {e.descripcion && (
            <div className="mb-10">
              <h2 className="display-module text-text-body mb-4">Sobre el evento</h2>
              <p className="font-barlow text-base whitespace-pre-line leading-relaxed text-text-body">
                {e.descripcion}
              </p>
            </div>
          )}

          {/* Gallery */}
          {e.galeria_urls.length > 0 && (
            <div className="mb-10">
              <h3 className="font-fraunces text-lg font-semibold text-text-body mb-4">Galería</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {e.galeria_urls.map((url, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-card overflow-hidden">
                    <Image src={url} alt={e.titulo} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Aside */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <div className="bg-white border border-divisor rounded-card-lg p-6 shadow-card">
            {/* Date */}
            <div className="flex items-start gap-3 mb-5 pb-5 border-b border-divisor">
              <div
                className="w-12 h-12 rounded-card flex flex-col items-center justify-center flex-shrink-0"
                style={{ background: color }}
              >
                <span className="font-fraunces font-bold text-white text-xl leading-none">
                  {String(fechaInicio.getDate()).padStart(2, "0")}
                </span>
                <span className="font-barlow text-white/80 text-[10px] uppercase font-semibold">
                  {["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"][fechaInicio.getMonth()]}
                </span>
              </div>
              <div>
                <p className="font-barlow font-semibold text-text-body text-sm">
                  {e.todo_el_dia ? "Todo el día" : formatAbsolute(fechaInicio)}
                </p>
                {fechaFin && (
                  <p className="font-barlow text-text-muted text-xs mt-0.5">
                    Hasta: {formatAbsolute(fechaFin, false)}
                  </p>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3 mb-5">
              {e.lugar && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} strokeWidth={1.5} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-barlow font-semibold text-sm text-text-body">{e.lugar}</p>
                    {e.direccion && (
                      <p className="font-barlow text-xs text-text-muted">{e.direccion}</p>
                    )}
                  </div>
                </div>
              )}
              {!e.todo_el_dia && (
                <div className="flex items-center gap-2.5">
                  <Clock size={16} strokeWidth={1.5} className="text-primary flex-shrink-0" />
                  <p className="font-barlow text-sm text-text-body">
                    {`${String(fechaInicio.getHours()).padStart(2, "0")}:${String(fechaInicio.getMinutes()).padStart(2, "0")}`}
                    {fechaFin && ` — ${String(fechaFin.getHours()).padStart(2, "0")}:${String(fechaFin.getMinutes()).padStart(2, "0")}`}
                  </p>
                </div>
              )}
              {e.cupo && (
                <div className="flex items-center gap-2.5">
                  <Users size={16} strokeWidth={1.5} className="text-primary flex-shrink-0" />
                  <p className="font-barlow text-sm text-text-body">Aforo: {e.cupo} personas</p>
                </div>
              )}
              {e.organizador && (
                <div className="flex items-center gap-2.5">
                  <Tag size={16} strokeWidth={1.5} className="text-primary flex-shrink-0" />
                  <p className="font-barlow text-sm text-text-body">Organiza: {e.organizador}</p>
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="pt-4 border-t border-divisor">
              <div className="flex items-center justify-between mb-4">
                <span className="font-barlow text-sm text-text-muted">Precio</span>
                <span
                  className="font-fraunces font-semibold text-xl"
                  style={{ color: e.gratis ? "#16a34a" : "#0c3460" }}
                >
                  {precioDisplay}
                </span>
              </div>
              {e.url_externa && (
                <a
                  href={e.url_externa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 font-barlow font-bold text-sm text-white bg-primary rounded-pill py-3 hover:opacity-90 transition-opacity no-underline"
                >
                  Más información <ExternalLink size={14} strokeWidth={2} />
                </a>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
