"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAbsolute } from "@/lib/format/relative-date";
import type { TicketConAutor, TicketEstado, TicketPrioridad, TICKET_ESTADO_LABEL, TICKET_PRIORIDAD_LABEL } from "@/types/admin";
import { TICKET_ESTADO_LABEL as ESTADO_LABEL, TICKET_PRIORIDAD_LABEL as PRIO_LABEL } from "@/types/admin";

interface Props {
  tickets:          TicketConAutor[];
  onCambiarEstado:  (fd: FormData) => Promise<void>;
  onCrear:          (fd: FormData) => Promise<void>;
}

const PRIO_COLOR: Record<TicketPrioridad, string> = {
  baja:    "text-white/40 bg-white/[0.05]",
  media:   "text-blue-400 bg-blue-400/10",
  alta:    "text-orange-400 bg-orange-400/10",
  urgente: "text-red-400 bg-red-400/10",
};

const ESTADO_COLOR: Record<TicketEstado, string> = {
  abierto:           "text-amber-400 bg-amber-400/10",
  en_curso:          "text-blue-400 bg-blue-400/10",
  esperando_cliente: "text-purple-400 bg-purple-400/10",
  resuelto:          "text-emerald-400 bg-emerald-400/10",
  cerrado:           "text-white/30 bg-white/[0.04]",
};

export default function TicketsAdminView({ tickets, onCambiarEstado, onCrear }: Props) {
  const [filtroEstado, setFiltroEstado] = useState<string>("abierto");
  const [selected,     setSelected]    = useState<TicketConAutor | null>(null);
  const [showNuevo,    setShowNuevo]    = useState(false);

  const filtrados = tickets.filter((t) =>
    filtroEstado === "todos" ? true : t.estado === filtroEstado
  );

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-14 md:pt-0">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-barlow text-[12px] text-white/30 uppercase tracking-widest mb-1">Admin</p>
            <h1 className="font-fraunces font-semibold text-[28px] text-white">Tickets</h1>
            <p className="font-barlow text-[13px] text-white/40 mt-1">
              {tickets.filter((t) => t.estado === "abierto").length} abiertos ·{" "}
              {tickets.filter((t) => t.prioridad === "urgente" && t.estado !== "cerrado").length} urgentes
            </p>
          </div>
          <button
            onClick={() => setShowNuevo(true)}
            className="font-barlow font-bold text-[13px] text-white bg-primary rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            + Nuevo ticket
          </button>
        </div>

        {/* Filtros estado */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(["todos", "abierto", "en_curso", "esperando_cliente", "resuelto", "cerrado"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`font-barlow text-[12px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors
                ${filtroEstado === e
                  ? "bg-primary text-white"
                  : "bg-white/[0.05] text-white/40 hover:text-white/70"}`}
            >
              {e === "todos" ? "Todos" : ESTADO_LABEL[e]}
              <span className="ml-1.5 opacity-60">
                {e === "todos" ? tickets.length : tickets.filter((t) => t.estado === e).length}
              </span>
            </button>
          ))}
        </div>

        {/* Lista tickets */}
        <div className="space-y-2 mb-6">
          {filtrados.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelected(selected?.id === t.id ? null : t)}
              className={`cursor-pointer p-4 rounded-xl border transition-all
                ${selected?.id === t.id
                  ? "bg-primary/10 border-primary/30"
                  : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-barlow text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIO_COLOR[t.prioridad]}`}>
                      {PRIO_LABEL[t.prioridad]}
                    </span>
                    <span className={`font-barlow text-[10px] font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[t.estado]}`}>
                      {ESTADO_LABEL[t.estado]}
                    </span>
                    <span className="font-barlow text-[11px] text-white/30">{t.numero}</span>
                  </div>
                  <p className="font-barlow font-medium text-[14px] text-white truncate">{t.asunto}</p>
                  <p className="font-barlow text-[12px] text-white/40 mt-0.5">
                    {(t.autor as { email: string; nombre: string | null } | null)?.email ?? "Desconocido"} · {formatAbsolute(t.created_at)}
                  </p>
                </div>
                {t.prestador && (
                  <span className="font-barlow text-[11px] text-white/30 whitespace-nowrap">
                    {(t.prestador as { nombre: string }).nombre}
                  </span>
                )}
              </div>

              {/* Acciones inline al seleccionar */}
              {selected?.id === t.id && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="font-barlow text-[13px] text-white/60 mb-3">{t.descripcion}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                  <Link
                    href={`/admin/tickets/${t.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-barlow text-[12px] font-semibold text-primary hover:opacity-80 transition-opacity px-3 py-1.5 rounded-lg bg-primary/10"
                  >
                    Ver conversación →
                  </Link>
                    {(["en_curso", "esperando_cliente", "resuelto", "cerrado"] as TicketEstado[])
                      .filter((e) => e !== t.estado)
                      .map((estado) => (
                        <form key={estado} action={onCambiarEstado}>
                          <input type="hidden" name="id"     value={t.id} />
                          <input type="hidden" name="estado" value={estado} />
                          <button type="submit"
                                  className={`font-barlow text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors
                                    ${ESTADO_COLOR[estado]} hover:opacity-80`}>
                            → {ESTADO_LABEL[estado]}
                          </button>
                        </form>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtrados.length === 0 && (
            <div className="text-center py-12">
              <p className="font-barlow text-[13px] text-white/30">Sin tickets en este estado.</p>
            </div>
          )}
        </div>

        {/* Modal nuevo ticket */}
        {showNuevo && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#161920] border border-white/[0.1] rounded-2xl p-6 w-full max-w-lg">
              <h3 className="font-fraunces font-semibold text-[20px] text-white mb-5">Nuevo ticket</h3>
              <form action={onCrear} onSubmit={() => setShowNuevo(false)} className="space-y-4">
                <div>
                  <label className="block font-barlow text-[12px] text-white/40 mb-1.5">Asunto *</label>
                  <input name="asunto" required
                         className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 font-barlow text-[13px] text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block font-barlow text-[12px] text-white/40 mb-1.5">Descripción *</label>
                  <textarea name="descripcion" required rows={3}
                            className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 font-barlow text-[13px] text-white focus:outline-none focus:border-primary resize-none" />
                </div>
                <div>
                  <label className="block font-barlow text-[12px] text-white/40 mb-1.5">Prioridad</label>
                  <select name="prioridad" defaultValue="media"
                          className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 font-barlow text-[13px] text-white focus:outline-none focus:border-primary">
                    {(["baja","media","alta","urgente"] as TicketPrioridad[]).map((p) => (
                      <option key={p} value={p}>{PRIO_LABEL[p]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit"
                          className="flex-1 font-barlow font-bold text-[13px] text-white bg-primary rounded-lg py-2.5 hover:opacity-90 transition-opacity">
                    Crear ticket
                  </button>
                  <button type="button" onClick={() => setShowNuevo(false)}
                          className="font-barlow text-[13px] text-white/40 hover:text-white/70 px-4 py-2.5">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
