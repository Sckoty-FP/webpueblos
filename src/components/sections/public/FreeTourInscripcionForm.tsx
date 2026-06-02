"use client";

import { useState, useTransition } from "react";
import { inscribirseAction } from "@/app/[pueblo]/free-tour/actions";
import type { FreeTourSesionDB, FreeTourDB } from "@/types/free-tour";

function formatFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

interface Props {
  tour: FreeTourDB;
  sesiones: FreeTourSesionDB[];
  sesionInicial?: string | null;
}

export default function FreeTourInscripcionForm({ tour, sesiones, sesionInicial }: Props) {
  const [open, setOpen] = useState(!!sesionInicial);
  const [sesionId, setSesionId] = useState(sesionInicial ?? (sesiones[0]?.id ?? ""));
  const [numPersonas, setNumPersonas] = useState(1);
  const [resultado, setResultado] = useState<{ ok: boolean; numero?: string; error?: string } | null>(null);
  const [pending, startT] = useTransition();

  const sesionSel = sesiones.find((s) => s.id === sesionId);
  const plazasLibres = sesionSel ? sesionSel.cupo_sesion - sesionSel.inscritos_count : 0;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sesionSel) return;
    const formData = new FormData(e.currentTarget);
    formData.set("sesion_id", sesionId);
    formData.set("tour_id", tour.id);
    formData.set("prestador_id", tour.prestador_id);
    formData.set("num_personas", String(numPersonas));
    formData.set("sesion_fecha", sesionSel.fecha);
    formData.set("sesion_hora", sesionSel.hora);
    formData.set("tour_titulo", tour.titulo);
    formData.set("punto_encuentro", tour.punto_encuentro_nombre ?? "");
    startT(async () => {
      const res = await inscribirseAction(formData);
      setResultado(res);
    });
  }

  if (resultado?.ok) {
    return (
      <div className="bg-white rounded-2xl border border-[#f3f3f3] overflow-hidden"
        style={{ boxShadow: "rgba(0,0,0,0.06) 0px 4px 16px" }}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-5 text-3xl">
            🎉
          </div>
          <h3 className="font-barlow font-semibold text-[20px] text-[#1f1f1f] mb-2">
            ¡Inscripción confirmada!
          </h3>
          <p className="font-barlow text-[14px] text-[#6b6b6b] mb-4">
            Te enviamos un email de confirmación.
          </p>
          <div className="inline-block bg-[#f5f7fa] rounded-xl px-6 py-3 font-mono font-bold text-[#0070cc] text-[16px]">
            {resultado.numero}
          </div>
          <p className="font-barlow text-[13px] text-[#6b6b6b] mt-4 leading-relaxed">
            Llegá 5 minutos antes al punto de encuentro.<br />
            La inscripción es gratuita — la propina al guía es voluntaria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#f3f3f3] overflow-hidden"
      style={{ boxShadow: "rgba(0,0,0,0.06) 0px 4px 16px" }}>
      {/* Trigger cerrado */}
      {!open && (
        <div className="p-6">
          <button
            onClick={() => setOpen(true)}
            className="w-full py-4 bg-[#0070cc] text-white font-barlow font-semibold text-[15px] rounded-xl transition-all duration-150 hover:bg-[#1eaedb]"
          >
            🎟 Inscribirme gratis
          </button>
          <p className="text-center font-barlow text-[12px] text-[#6b6b6b] mt-3">
            Sin cargo · Propina voluntaria al guía
          </p>
        </div>
      )}

      {/* Formulario */}
      {open && (
        <form onSubmit={submit}>
          <div className="p-6 border-b border-[#f3f3f3]">
            <h3 className="font-barlow font-semibold text-[17px] text-[#1f1f1f]">Reservar plaza</h3>
            <p className="font-barlow text-[13px] text-[#6b6b6b] mt-1">{tour.titulo}</p>
          </div>
          <div className="p-6 flex flex-col gap-4">
            {/* Selector de sesión */}
            <div>
              <label className="block font-barlow font-semibold text-[11px] text-[#6b6b6b] uppercase tracking-wide mb-2">
                Elegí una sesión
              </label>
              <div className="flex flex-col gap-2">
                {sesiones.map((s) => {
                  const libres = s.cupo_sesion - s.inscritos_count;
                  const lleno = libres <= 0;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={lleno}
                      onClick={() => setSesionId(s.id)}
                      className="flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 disabled:opacity-50"
                      style={{
                        borderColor: sesionId === s.id ? "#0070cc" : "#f3f3f3",
                        background: sesionId === s.id ? "#eff6ff" : "#fff",
                      }}
                    >
                      <div>
                        <div className="font-barlow font-semibold text-[13px] text-[#1f1f1f]">
                          {formatFecha(s.fecha)} · {formatHora(s.hora)}
                        </div>
                      </div>
                      <span className={`font-barlow font-semibold text-[11px] rounded-full px-2.5 py-1 ${lleno ? "bg-[#fee2e2] text-[#b91c1c]" : "bg-[#dcfce7] text-[#15803d]"}`}>
                        {lleno ? "Completo" : `${libres} plazas`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Número de personas */}
            <div>
              <label className="block font-barlow font-semibold text-[11px] text-[#6b6b6b] uppercase tracking-wide mb-2">
                Personas
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNumPersonas(Math.max(1, numPersonas - 1))}
                  className="w-10 h-10 rounded-xl bg-[#f5f7fa] border border-[#f3f3f3] font-bold text-[20px] text-[#1f1f1f] flex items-center justify-center"
                >−</button>
                <span className="font-barlow font-bold text-[18px] text-[#1f1f1f] w-8 text-center">{numPersonas}</span>
                <button
                  type="button"
                  onClick={() => setNumPersonas(Math.min(plazasLibres, 10, numPersonas + 1))}
                  className="w-10 h-10 rounded-xl bg-[#f5f7fa] border border-[#f3f3f3] font-bold text-[20px] text-[#1f1f1f] flex items-center justify-center"
                >+</button>
                <span className="font-barlow text-[12px] text-[#6b6b6b]">(máx. {Math.min(plazasLibres, 10)})</span>
              </div>
            </div>

            {/* Datos personales */}
            <div>
              <label className="block font-barlow font-semibold text-[11px] text-[#6b6b6b] uppercase tracking-wide mb-2">
                Nombre completo
              </label>
              <input
                name="nombre"
                type="text"
                required
                placeholder="Tu nombre y apellido"
                className="w-full px-4 py-3 rounded-xl border border-[#cccccc] font-barlow text-[14px] text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0070cc]"
              />
            </div>
            <div>
              <label className="block font-barlow font-semibold text-[11px] text-[#6b6b6b] uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl border border-[#cccccc] font-barlow text-[14px] text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0070cc]"
              />
            </div>
            <div>
              <label className="block font-barlow font-semibold text-[11px] text-[#6b6b6b] uppercase tracking-wide mb-2">
                Teléfono <span className="font-normal text-[#6b6b6b]">(opcional)</span>
              </label>
              <input
                name="telefono"
                type="tel"
                placeholder="+34 600 000 000"
                className="w-full px-4 py-3 rounded-xl border border-[#cccccc] font-barlow text-[14px] text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0070cc]"
              />
            </div>
            <div>
              <label className="block font-barlow font-semibold text-[11px] text-[#6b6b6b] uppercase tracking-wide mb-2">
                Notas <span className="font-normal text-[#6b6b6b]">(opcional)</span>
              </label>
              <textarea
                name="notas"
                rows={2}
                placeholder="Vengo con niños, tengo movilidad reducida…"
                className="w-full px-4 py-3 rounded-xl border border-[#cccccc] font-barlow text-[14px] text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#0070cc] resize-none"
              />
            </div>

            {/* Info */}
            <div className="bg-[#eff6ff] rounded-xl p-4 text-[12px] text-[#1d4ed8] font-barlow leading-relaxed">
              ℹ️ La inscripción es gratuita. La plataforma no cobra nada. Si disfrutás el tour, podés dar al guía la propina que consideres.
            </div>

            {/* Error */}
            {resultado?.error && (
              <div className="bg-[#fee2e2] rounded-xl p-4 text-[13px] text-[#b91c1c] font-barlow">
                ⚠️ {resultado.error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-3 bg-[#f5f7fa] border border-[#f3f3f3] text-[#3a3a3a] font-barlow font-semibold text-[14px] rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending || !sesionId || plazasLibres < numPersonas}
                className="flex-1 py-3 bg-[#000] text-white font-barlow font-semibold text-[14px] rounded-xl transition-opacity disabled:opacity-50"
              >
                {pending ? "Confirmando…" : "Confirmar inscripción"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
