import type { ReservaUsuarioDB } from "@/types";

const ESTADO_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:  { bg: "#fffbeb", color: "#d97706", label: "Pendiente" },
  confirmada: { bg: "#ecfdf5", color: "#059669", label: "Confirmada" },
  rechazada:  { bg: "#fef2f2", color: "#dc2626", label: "Rechazada" },
  cancelada:  { bg: "#f3f4f6", color: "#6b7280", label: "Cancelada" },
  completada: { bg: "#eff6ff", color: "#0070cc", label: "Completada" },
  no_show:    { bg: "#fef2f2", color: "#dc2626", label: "No presentado" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

export default function TabReservas({ reservas }: { reservas: ReservaUsuarioDB[] }) {
  if (reservas.length === 0) {
    return (
      <div className="bg-white rounded-card-lg border border-divisor px-6 py-10 text-center" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 12px" }}>
        <div className="w-14 h-14 rounded-full bg-fog flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <p className="font-barlow font-semibold text-[16px] text-text-body mb-2">Sin reservas todavía</p>
        <p className="font-barlow text-[14px] text-text-muted">Tus reservas en negocios del pueblo aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reservas.map((r) => {
        const est = ESTADO_STYLE[r.estado] ?? { bg: "#f3f4f6", color: "#6b7280", label: r.estado };
        return (
          <div key={r.id} className="bg-white rounded-card-lg border border-divisor p-4" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-barlow font-semibold text-[14px] text-text-body leading-none mb-1 truncate">
                  {r.servicio?.nombre ?? "Servicio"}
                </p>
                {r.prestador && (
                  <p className="font-barlow text-[12px] text-text-muted mb-2">{r.prestador.nombre}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap font-barlow text-[12px] text-text-muted">
                  <span>{formatDate(r.fecha)}</span>
                  <span>·</span>
                  <span>{r.hora.slice(0, 5)}</span>
                  <span>·</span>
                  <span>{r.num_personas} persona{r.num_personas !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="font-barlow font-semibold text-[11px] px-2.5 py-1 rounded-pill" style={{ background: est.bg, color: est.color }}>
                  {est.label}
                </span>
                <span className="font-barlow font-bold text-[14px] text-text-body">
                  {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(r.precio_final)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
