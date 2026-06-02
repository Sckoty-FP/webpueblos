"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { formatAbsolute } from "@/lib/format/relative-date";
import type { TicketConAutor, TicketMensajeDB, TicketEstado } from "@/types/admin";
import { TICKET_ESTADO_LABEL as ESTADO_LABEL, TICKET_PRIORIDAD_LABEL as PRIO_LABEL } from "@/types/admin";

interface Props {
  ticket:          TicketConAutor;
  mensajes:        TicketMensajeDB[];
  onCambiarEstado: (fd: FormData) => Promise<void>;
  onResponder:     (fd: FormData) => Promise<void>;
}

const ESTADO_COLOR: Record<TicketEstado, string> = {
  abierto:           "text-amber-400 bg-amber-400/10",
  en_curso:          "text-blue-400 bg-blue-400/10",
  esperando_cliente: "text-purple-400 bg-purple-400/10",
  resuelto:          "text-emerald-400 bg-emerald-400/10",
  cerrado:           "text-white/30 bg-white/[0.04]",
};

const PRIO_COLOR: Record<string, string> = {
  baja:    "text-white/40",
  media:   "text-blue-400",
  alta:    "text-orange-400",
  urgente: "text-red-400",
};

export default function TicketDetalleView({ ticket, mensajes, onCambiarEstado, onResponder }: Props) {
  const [interno,   setInterno]   = useState(false);
  const [cuerpo,    setCuerpo]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cuerpo.trim() || submitting) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("cuerpo", cuerpo);
    fd.set("interno", String(interno));
    await onResponder(fd);
    setCuerpo("");
    setSubmitting(false);
    textareaRef.current?.focus();
  }

  const estadosDisponibles = (["en_curso", "esperando_cliente", "resuelto", "cerrado"] as TicketEstado[])
    .filter((e) => e !== ticket.estado);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-14 md:pt-0 flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-6 py-8 flex flex-col flex-1">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/tickets"
            className="inline-flex items-center gap-1.5 font-barlow text-[12px] text-white/30 hover:text-white/60 transition-colors mb-4"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Volver a tickets
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-[11px] text-white/30">{ticket.numero}</span>
                <span className={`font-barlow text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_COLOR[ticket.estado]}`}>
                  {ESTADO_LABEL[ticket.estado]}
                </span>
                <span className={`font-barlow text-[10px] font-semibold ${PRIO_COLOR[ticket.prioridad]}`}>
                  {PRIO_LABEL[ticket.prioridad]}
                </span>
              </div>
              <h1 className="font-fraunces font-semibold text-[24px] text-white leading-tight">{ticket.asunto}</h1>
              <p className="font-barlow text-[12px] text-white/40 mt-1">
                {(ticket.autor as { email: string } | null)?.email ?? "Sistema"} · {formatAbsolute(ticket.created_at)}
                {ticket.prestador && (
                  <span className="ml-2 text-white/25">· {(ticket.prestador as { nombre: string }).nombre}</span>
                )}
              </p>
            </div>

            {/* Cambiar estado */}
            <div className="flex flex-wrap gap-2">
              {estadosDisponibles.map((estado) => (
                <form key={estado} action={onCambiarEstado}>
                  <input type="hidden" name="estado" value={estado} />
                  <button
                    type="submit"
                    className={`font-barlow text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 ${ESTADO_COLOR[estado]}`}
                  >
                    → {ESTADO_LABEL[estado]}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>

        {/* Descripción original */}
        {ticket.descripcion && (
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.07] px-4 py-3 mb-4">
            <p className="font-barlow text-[11px] text-white/30 uppercase tracking-wider mb-1.5">Descripción</p>
            <p className="font-barlow text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap">{ticket.descripcion}</p>
          </div>
        )}

        {/* Hilo de mensajes */}
        <div className="flex-1 space-y-3 mb-4">
          {mensajes.length === 0 && (
            <div className="text-center py-10">
              <p className="font-barlow text-[13px] text-white/20">Sin mensajes todavía</p>
            </div>
          )}

          {mensajes.map((msg) => (
            <MensajeCard key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Compositor */}
        <div className="sticky bottom-0 bg-[#0f1117] pt-4 pb-2 border-t border-white/[0.06]">
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Toggle público / interno */}
            <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1 w-fit">
              <button
                type="button"
                onClick={() => setInterno(false)}
                className={`font-barlow text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  !interno ? "bg-white/[0.1] text-white" : "text-white/30 hover:text-white/60"
                }`}
              >
                Respuesta pública
              </button>
              <button
                type="button"
                onClick={() => setInterno(true)}
                className={`font-barlow text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  interno ? "bg-amber-400/20 text-amber-400" : "text-white/30 hover:text-white/60"
                }`}
              >
                🔒 Nota interna
              </button>
            </div>

            <div className={`rounded-xl border transition-colors ${interno ? "border-amber-400/20 bg-amber-400/[0.04]" : "border-white/[0.08] bg-white/[0.03]"}`}>
              <textarea
                ref={textareaRef}
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent);
                }}
                rows={3}
                placeholder={interno ? "Nota interna — solo visible para admins..." : "Escribe una respuesta..."}
                className="w-full bg-transparent px-4 py-3 font-barlow text-[13px] text-white placeholder-white/20 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between px-4 pb-3">
                <span className="font-barlow text-[11px] text-white/20">⌘↵ para enviar</span>
                <button
                  type="submit"
                  disabled={!cuerpo.trim() || submitting}
                  className={`font-barlow font-bold text-[12px] px-4 py-2 rounded-lg transition-opacity disabled:opacity-30
                    ${interno ? "bg-amber-500 text-white" : "bg-primary text-white"}`}
                >
                  {submitting ? "Enviando..." : interno ? "Guardar nota" : "Enviar respuesta"}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

function MensajeCard({ msg }: { msg: TicketMensajeDB }) {
  const autor = msg.autor as { email: string; nombre: string | null } | undefined;

  return (
    <div className={`rounded-xl border px-4 py-3 ${
      msg.interno
        ? "border-amber-400/20 bg-amber-400/[0.04]"
        : "border-white/[0.07] bg-white/[0.03]"
    }`}>
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="font-barlow text-[12px] font-semibold text-white/80">
            {autor?.nombre ?? autor?.email ?? "Sistema"}
          </span>
          {msg.interno && (
            <span className="font-barlow text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 uppercase tracking-wider">
              Interno
            </span>
          )}
        </div>
        <span className="font-barlow text-[11px] text-white/25 whitespace-nowrap">
          {formatAbsolute(msg.created_at)}
        </span>
      </div>
      <p className="font-barlow text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap">{msg.cuerpo}</p>
    </div>
  );
}
