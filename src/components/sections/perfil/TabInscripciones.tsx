import Link from "next/link";
import type { InscripcionFreeTour } from "@/lib/supabase/queries/cuenta-usuario";

const ESTADO_STYLE: Record<InscripcionFreeTour["estado"], { bg: string; color: string; label: string }> = {
  confirmada:       { bg: "#ecfdf5", color: "#059669", label: "Confirmada" },
  asistio:          { bg: "#eff6ff", color: "#0070cc", label: "Asistido" },
  cancelada_cliente:{ bg: "#f3f4f6", color: "#6b7280", label: "Cancelada" },
  cancelada_guia:   { bg: "#f3f4f6", color: "#6b7280", label: "Cancelada por guía" },
  no_show:          { bg: "#fef2f2", color: "#dc2626", label: "No presentado" },
};

function formatFecha(fecha: string, hora: string): string {
  const d = new Date(fecha + "T00:00:00");
  const dia = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  return `${dia} · ${hora.slice(0, 5)}`;
}

export default function TabInscripciones({ inscripciones }: { inscripciones: InscripcionFreeTour[] }) {
  if (inscripciones.length === 0) {
    return (
      <div className="bg-white rounded-card-lg border border-divisor px-6 py-10 text-center" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 12px" }}>
        <div className="w-14 h-14 rounded-full bg-fog flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <p className="font-barlow font-semibold text-[16px] text-text-body mb-2">Sin inscripciones próximas</p>
        <p className="font-barlow text-[14px] text-text-muted">Cuando te inscribas a un free tour, aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {inscripciones.map(ins => {
        const est = ESTADO_STYLE[ins.estado] ?? ESTADO_STYLE.confirmada;
        return (
          <Link
            key={ins.id}
            href={`/${ins.pueblo_slug}/free-tour/${ins.tour_slug}`}
            className="block bg-white rounded-card-lg border border-divisor p-4 hover:bg-fog transition-colors no-underline"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-fraunces font-semibold text-[15px] text-text-body mb-0.5 truncate">
                  {ins.tour_nombre}
                </p>
                <p className="font-barlow text-[12px] text-text-muted">{ins.pueblo_nombre}</p>
              </div>
              <span className="font-barlow font-semibold text-[11px] px-2.5 py-1 rounded-pill whitespace-nowrap"
                style={{ background: est.bg, color: est.color }}>
                {est.label}
              </span>
            </div>
            <div className="flex items-center gap-4 font-barlow text-[13px] text-text-body">
              <span>{formatFecha(ins.sesion_fecha, ins.sesion_hora)}</span>
              <span>· {ins.num_personas} {ins.num_personas === 1 ? "persona" : "personas"}</span>
            </div>
            {ins.punto_encuentro && (
              <p className="font-barlow text-[12px] text-text-muted mt-1.5 italic">
                Punto encuentro: {ins.punto_encuentro}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
