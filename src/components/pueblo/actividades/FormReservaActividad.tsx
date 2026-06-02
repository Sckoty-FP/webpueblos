"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { crearReservaActividad, getRecursosDisponiblesAction } from "@/app/[pueblo]/actividades/actions";
import type { RecursoActividadDB } from "@/types/actividades";
import type { ServicioDB } from "@/types";

interface Props {
  puebloSlug: string;
  prestadorId: string;
  servicios: ServicioDB[];
  recursos: RecursoActividadDB[];
}

export default function FormReservaActividad({ puebloSlug, prestadorId, servicios, recursos }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState(1);
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? "");
  const [disponibles, setDisponibles] = useState<RecursoActividadDB[]>(recursos);
  const [recursoId, setRecursoId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function consultarDisponibilidad() {
    if (!fecha || !hora) return;
    setError(null);
    const libres = await getRecursosDisponiblesAction({
      prestadorId,
      servicioId: servicioId || undefined,
      fecha,
      horaInicio: hora,
      duracionHoras: duracion,
    });
    setDisponibles(libres);
    if (libres.length === 0) {
      setError("No hay recursos libres en esa franja.");
    } else if (!libres.some(r => r.id === recursoId)) {
      setRecursoId("");
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("prestador_id", prestadorId);
    fd.set("servicio_id", servicioId);
    fd.set("recurso_id", recursoId);
    startTransition(async () => {
      const r = await crearReservaActividad(fd);
      if (r.ok) {
        router.push(`/${puebloSlug}/actividades?reserva=ok`);
      } else if (r.needsLogin) {
        router.push(`/auth/login?redirect=/${puebloSlug}/actividades/${prestadorId}`);
      } else {
        setError(r.error ?? "Error al reservar.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-card-lg border border-divisor p-6 shadow-card space-y-4">
      <h3 className="font-fraunces text-xl font-semibold text-text-body">Reservar</h3>

      {servicios.length > 1 && (
        <div>
          <label className="block font-barlow text-sm text-text-body mb-1.5">Servicio</label>
          <select
            value={servicioId}
            onChange={e => setServicioId(e.target.value)}
            className="w-full bg-fog border border-divisor rounded-sm px-3 py-2 font-barlow text-sm focus:outline-none focus:border-primary"
          >
            {servicios.map(s => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {s.precio_desde ? ` — desde €${s.precio_desde}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-barlow text-sm text-text-body mb-1.5 flex items-center gap-1">
            <Calendar size={13} /> Fecha
          </label>
          <input
            type="date"
            name="fecha"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            required
            className="w-full bg-fog border border-divisor rounded-sm px-3 py-2 font-barlow text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block font-barlow text-sm text-text-body mb-1.5 flex items-center gap-1">
            <Clock size={13} /> Hora
          </label>
          <input
            type="time"
            name="hora"
            value={hora}
            onChange={e => setHora(e.target.value)}
            required
            className="w-full bg-fog border border-divisor rounded-sm px-3 py-2 font-barlow text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block font-barlow text-sm text-text-body mb-1.5">
          Duración (horas)
        </label>
        <input
          type="number"
          name="duracion_horas"
          min={1}
          max={8}
          step={1}
          value={duracion}
          onChange={e => setDuracion(parseInt(e.target.value) || 1)}
          className="w-full bg-fog border border-divisor rounded-sm px-3 py-2 font-barlow text-sm focus:outline-none focus:border-primary"
        />
      </div>

      <button
        type="button"
        onClick={consultarDisponibilidad}
        disabled={!fecha || !hora}
        className="w-full font-barlow text-sm text-primary border-2 border-primary rounded-pill py-2 hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
      >
        Ver recursos disponibles
      </button>

      {disponibles.length > 0 && (
        <div>
          <label className="block font-barlow text-sm text-text-body mb-1.5">Recurso</label>
          <select
            value={recursoId}
            onChange={e => setRecursoId(e.target.value)}
            required
            className="w-full bg-fog border border-divisor rounded-sm px-3 py-2 font-barlow text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Elegí un recurso…</option>
            {disponibles.map(r => (
              <option key={r.id} value={r.id}>
                {r.nombre}
                {r.identificador ? ` (${r.identificador})` : ""}
                {r.precio_hora ? ` — €${r.precio_hora}/h` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="font-barlow text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !recursoId}
        className="w-full bg-commerce hover:bg-commerce-active disabled:opacity-50 text-white font-barlow font-medium px-5 py-2.5 rounded-pill transition-colors"
      >
        {pending ? "Reservando…" : "Confirmar reserva"}
      </button>
    </form>
  );
}
