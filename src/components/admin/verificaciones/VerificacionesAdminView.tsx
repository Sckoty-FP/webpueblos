"use client";

import { useState } from "react";
import type { VerificacionConPrestador, EstadoVerificacion } from "@/types/admin";

interface Props {
  verificaciones: VerificacionConPrestador[];
  onActualizar:   (fd: FormData) => Promise<void>;
}

const ESTADO_CONFIG: Record<EstadoVerificacion, { label: string; color: string }> = {
  pendiente:    { label: "Pendiente",     color: "text-amber-400 bg-amber-400/10" },
  revisando:    { label: "Revisando",     color: "text-blue-400 bg-blue-400/10" },
  aprobado:     { label: "Aprobado",      color: "text-emerald-400 bg-emerald-400/10" },
  rechazado:    { label: "Rechazado",     color: "text-red-400 bg-red-400/10" },
  requiere_mas: { label: "Más info",      color: "text-orange-400 bg-orange-400/10" },
};

function DocLink({ url, label }: { url: string | null; label: string }) {
  if (!url) return <span className="font-barlow text-[11px] text-white/20">{label}: —</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="font-barlow text-[11px] text-primary hover:opacity-80 transition-opacity no-underline">
      {label} ↗
    </a>
  );
}

export default function VerificacionesAdminView({ verificaciones, onActualizar }: Props) {
  const [selected, setSelected] = useState<VerificacionConPrestador | null>(null);
  const [motivo,   setMotivo]   = useState("");
  const [notas,    setNotas]    = useState("");

  const pendientes = verificaciones.filter((v) => ["pendiente", "revisando"].includes(v.estado));
  const resto      = verificaciones.filter((v) => !["pendiente", "revisando"].includes(v.estado));

  function VerifCard({ v }: { v: VerificacionConPrestador }) {
    const cfg = ESTADO_CONFIG[v.estado];
    return (
      <div
        onClick={() => {
          setSelected(selected?.id === v.id ? null : v);
          setMotivo(v.motivo_rechazo ?? "");
          setNotas(v.notas_internas ?? "");
        }}
        className={`cursor-pointer p-4 rounded-xl border transition-all
          ${selected?.id === v.id
            ? "bg-primary/10 border-primary/30"
            : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"}`}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-barlow font-medium text-[14px] text-white">
            {v.prestador?.nombre ?? "—"}
          </p>
          <span className={`font-barlow text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          <DocLink url={v.cif_documento_url}       label="CIF" />
          <DocLink url={v.alta_iae_url}             label="IAE" />
          <DocLink url={v.responsable_civil_url}    label="Resp. Civil" />
          {v.otros_documentos_urls?.map((u, i) => (
            <DocLink key={i} url={u} label={`Otro ${i + 1}`} />
          ))}
        </div>
        {v.motivo_rechazo && (
          <p className="font-barlow text-[11px] text-red-400/70 mt-2">{v.motivo_rechazo}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-14 md:pt-0">
      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="mb-8">
          <p className="font-barlow text-[12px] text-white/30 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="font-fraunces font-semibold text-[28px] text-white">Verificaciones</h1>
          <p className="font-barlow text-[13px] text-white/40 mt-1">
            {pendientes.length} pendientes de revisión
          </p>
        </div>

        {/* Pendientes */}
        {pendientes.length > 0 && (
          <div className="mb-8">
            <h2 className="font-barlow text-[12px] text-amber-400/70 uppercase tracking-wider mb-3">
              Pendientes
            </h2>
            <div className="space-y-3">
              {pendientes.map((v) => <VerifCard key={v.id} v={v} />)}
            </div>
          </div>
        )}

        {/* Panel de acciones al seleccionar */}
        {selected && ["pendiente", "revisando", "requiere_mas"].includes(selected.estado) && (
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 mb-8">
            <h3 className="font-barlow font-semibold text-[13px] text-white/60 uppercase tracking-wider mb-4">
              Revisar: {selected.prestador?.nombre}
            </h3>

            <div className="mb-4">
              <label className="block font-barlow text-[12px] text-white/40 mb-1.5">
                Notas internas (solo admins)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                placeholder="Observaciones internas..."
                className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5
                           font-barlow text-[13px] text-white placeholder-white/20
                           focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Aprobar */}
              <form action={onActualizar} onSubmit={() => setSelected(null)}>
                <input type="hidden" name="id"     value={selected.id} />
                <input type="hidden" name="estado" value="aprobado" />
                <input type="hidden" name="notas"  value={notas} />
                <button type="submit"
                        className="font-barlow font-bold text-[13px] text-white bg-emerald-600 rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity">
                  ✓ Aprobar
                </button>
              </form>

              {/* Requiere más */}
              <form action={onActualizar} onSubmit={() => setSelected(null)}>
                <input type="hidden" name="id"     value={selected.id} />
                <input type="hidden" name="estado" value="requiere_mas" />
                <input type="hidden" name="notas"  value={notas} />
                <button type="submit"
                        className="font-barlow font-bold text-[13px] text-white bg-orange-500 rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity">
                  Pedir más info
                </button>
              </form>

              {/* Rechazar */}
              <form action={onActualizar} onSubmit={() => setSelected(null)} className="flex gap-2 items-center">
                <input type="hidden" name="id"     value={selected.id} />
                <input type="hidden" name="estado" value="rechazado" />
                <input type="hidden" name="notas"  value={notas} />
                <input
                  type="text"
                  name="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Motivo del rechazo..."
                  className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5
                             font-barlow text-[13px] text-white placeholder-white/20 w-52
                             focus:outline-none focus:border-red-500 transition-colors"
                />
                <button type="submit"
                        className="font-barlow font-bold text-[13px] text-white bg-red-600 rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity">
                  Rechazar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Historial */}
        {resto.length > 0 && (
          <div>
            <h2 className="font-barlow text-[12px] text-white/30 uppercase tracking-wider mb-3">
              Historial
            </h2>
            <div className="space-y-2">
              {resto.map((v) => <VerifCard key={v.id} v={v} />)}
            </div>
          </div>
        )}

        {verificaciones.length === 0 && (
          <div className="text-center py-20">
            <p className="font-barlow text-[13px] text-white/30">No hay verificaciones aún.</p>
          </div>
        )}

      </div>
    </div>
  );
}
