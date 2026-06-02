"use client";

import { useState } from "react";
import FreeTourInscripcionForm from "@/components/sections/public/FreeTourInscripcionForm";
import type { FreeTourDB, FreeTourSesionDB } from "@/types/free-tour";

interface Props {
  sesiones: FreeTourSesionDB[];
  tour: FreeTourDB;
}

function formatFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function SesionPicker({ sesiones, tour }: Props) {
  const [sesionId, setSesionId] = useState<string>(sesiones[0]?.id ?? "");

  return (
    <div>
      <div className="space-y-2 mb-5 max-h-72 overflow-y-auto">
        {sesiones.map(s => {
          const disponibles = s.cupo_sesion - s.inscritos_count;
          const completo = disponibles <= 0;
          return (
            <label
              key={s.id}
              className={`block cursor-pointer rounded-card border-2 p-3 transition-colors ${
                sesionId === s.id
                  ? "border-primary bg-primary/5"
                  : "border-divisor hover:border-primary/40"
              } ${completo ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="sesion"
                value={s.id}
                checked={sesionId === s.id}
                onChange={() => setSesionId(s.id)}
                disabled={completo}
                className="sr-only"
              />
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-fraunces font-semibold text-text-body">
                    {formatFecha(s.fecha)} · {s.hora.slice(0, 5)}
                  </div>
                  <div className="font-barlow text-xs text-text-muted">
                    {completo ? "Completo" : `${disponibles} plazas libres`}
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <FreeTourInscripcionForm tour={tour} sesiones={sesiones} sesionInicial={sesionId} />
    </div>
  );
}
