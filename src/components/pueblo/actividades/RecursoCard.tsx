import { Clock, Users } from "lucide-react";
import { TIPO_RECURSO_LABEL, TIPO_RECURSO_EMOJI } from "@/types/actividades";
import type { RecursoActividadDB } from "@/types/actividades";

export default function RecursoCard({ recurso }: { recurso: RecursoActividadDB }) {
  const label = TIPO_RECURSO_LABEL[recurso.tipo] ?? recurso.tipo;
  const emoji = TIPO_RECURSO_EMOJI[recurso.tipo] ?? "📦";

  return (
    <article className="bg-white border border-divisor rounded-card p-4 flex gap-4">
      <div className="shrink-0 w-10 h-10 rounded-pill bg-primary/10 flex items-center justify-center text-xl">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-fraunces text-base font-semibold text-text-body leading-snug">
            {recurso.nombre}
          </h4>
          <span className="font-barlow text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-pill whitespace-nowrap">
            {label}
          </span>
        </div>
        {recurso.identificador && (
          <p className="font-barlow text-xs text-text-muted mb-2">{recurso.identificador}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs font-barlow text-text-muted">
          <span className="flex items-center gap-1">
            <Users size={11} strokeWidth={1.5} /> {recurso.capacidad} pers.
          </span>
          {recurso.precio_hora && (
            <span className="flex items-center gap-1">
              <Clock size={11} strokeWidth={1.5} /> €{recurso.precio_hora}/h
            </span>
          )}
          {recurso.precio_dia && (
            <span className="font-medium text-primary">€{recurso.precio_dia}/día</span>
          )}
        </div>
      </div>
    </article>
  );
}
