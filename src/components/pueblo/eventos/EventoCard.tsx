import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock } from "lucide-react";
import type { EventoCard as EventoCardType } from "@/types/eventos";
import { CATEGORIA_EVENTO_COLOR } from "@/types/eventos";

interface Props {
  evento: EventoCardType;
  puebloSlug: string;
}

export default function EventoCard({ evento: e, puebloSlug }: Props) {
  const color = CATEGORIA_EVENTO_COLOR[e.categoria] ?? "#6b7280";

  return (
    <Link
      href={`/${puebloSlug}/eventos/${e.slug}`}
      className="group flex bg-white rounded-card-lg overflow-hidden border border-divisor shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Date badge */}
      <div
        className="flex-shrink-0 w-16 flex flex-col items-center justify-center py-4 gap-0.5"
        style={{ background: color }}
      >
        <span className="font-fraunces font-bold text-white text-2xl leading-none">
          {e.diaNumero}
        </span>
        <span className="font-barlow font-semibold text-white/80 text-[11px] uppercase tracking-wider">
          {e.diaMesAbrev}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-fraunces font-semibold text-base text-text-body leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {e.titulo}
            </h3>
            {e.esDestacado && (
              <span className="flex-shrink-0 font-barlow text-[10px] font-semibold text-white px-2 py-0.5 rounded-pill" style={{ background: color }}>
                Dest.
              </span>
            )}
          </div>
          {e.descripcionCorta && (
            <p className="font-barlow text-sm text-text-muted line-clamp-1 mb-2">
              {e.descripcionCorta}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {e.lugar && (
            <span className="flex items-center gap-1 font-barlow text-xs text-text-muted">
              <MapPin size={11} strokeWidth={1.5} /> {e.lugar}
            </span>
          )}
          {e.horaInicio && (
            <span className="flex items-center gap-1 font-barlow text-xs text-text-muted">
              <Clock size={11} strokeWidth={1.5} /> {e.horaInicio}
            </span>
          )}
          <span
            className="ml-auto font-barlow font-semibold text-xs px-2.5 py-0.5 rounded-pill"
            style={{ background: `${color}18`, color }}
          >
            {e.precioDisplay}
          </span>
        </div>
      </div>

      {/* Image */}
      {e.imagenUrl && (
        <div className="relative flex-shrink-0 w-24 h-24 self-center mr-3 rounded-card overflow-hidden">
          <Image
            src={e.imagenUrl}
            alt={e.titulo}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
    </Link>
  );
}
