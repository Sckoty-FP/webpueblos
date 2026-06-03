"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { crearReservaServicio } from "@/app/[pueblo]/servicios/[id]/reservar/actions";
import type { ServicioDB } from "@/types";

interface Props {
  puebloSlug: string;
  prestadorSlug: string;
  prestadorId: string;
  /** Servicios reservables del prestador (ya filtrados por `reservable && activo`). */
  servicios: ServicioDB[];
  /** Datos de contacto precargados del perfil del usuario (editables). */
  defaultNombre?: string;
  defaultTelefono?: string;
}

/**
 * Formulario público de reserva de un servicio. Espejo simplificado de
 * `FormReservaActividad`: el público elige servicio + fecha + hora y la reserva
 * nace `pendiente`. La duración la aporta el servicio elegido (no hay selección
 * de profesional/recurso aquí; el negocio lo resuelve al confirmar).
 */
export default function FormReservaServicio({
  puebloSlug,
  prestadorSlug,
  prestadorId,
  servicios,
  defaultNombre = "",
  defaultTelefono = "",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? "");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState(defaultNombre);
  const [telefono, setTelefono] = useState(defaultTelefono);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const servicioSel = servicios.find(s => s.id === servicioId) ?? servicios[0];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("prestador_id", prestadorId);
    fd.set("servicio_id", servicioId);
    fd.set("fecha", fecha);
    fd.set("hora", hora);
    fd.set("nombre_cliente", nombre);
    fd.set("telefono_cliente", telefono);
    fd.set("duracion_minutos", String(servicioSel?.duracion_minutos ?? 30));

    startTransition(async () => {
      const r = await crearReservaServicio(fd);
      if (r.ok) {
        setDone(true);
      } else if (r.needsLogin) {
        // Respaldo del guard de página: si la sesión expiró entre carga y submit.
        router.push(`/auth/login?redirect=/${puebloSlug}/servicios/${prestadorSlug}/reservar`);
      } else {
        setError(r.error ?? "Error al reservar.");
      }
    });
  }

  if (done) {
    return (
      <div className="bg-white rounded-card-lg border border-divisor p-7 shadow-card text-center">
        <CheckCircle2 size={40} className="text-primary mx-auto mb-3" strokeWidth={1.5} />
        <h3 className="font-fraunces text-xl font-semibold text-text-body mb-2">¡Solicitud enviada!</h3>
        <p className="font-barlow text-sm text-text-muted mb-5">
          El negocio confirmará tu cita y la verás en tu perfil. Cancelás gratis hasta 24h antes.
        </p>
        <button
          onClick={() => router.push(`/${puebloSlug}/servicios/${prestadorSlug}`)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-barlow font-medium text-sm px-5 py-2.5 rounded-pill transition-colors"
        >
          Volver al negocio <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-card-lg border border-divisor p-7 shadow-card space-y-4">
      <div>
        <h3 className="font-fraunces text-[22px] font-semibold text-text-body">Reservar cita</h3>
        <p className="font-barlow text-sm text-text-muted mt-1">
          Confirmación del negocio. Cancelás gratis hasta 24h antes.
        </p>
      </div>

      {servicios.length > 1 ? (
        <div>
          <label className="block font-barlow text-[11px] font-semibold uppercase tracking-[0.4px] text-text-muted mb-2">
            Servicio
          </label>
          <select
            value={servicioId}
            onChange={e => setServicioId(e.target.value)}
            className="w-full bg-fog border border-divisor rounded-sm px-3 py-2.5 font-barlow text-sm focus:outline-none focus:border-primary"
          >
            {servicios.map(s => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {s.precio_desde ? ` — desde €${s.precio_desde}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        servicioSel && (
          <div className="bg-fog rounded-sm px-3 py-2.5">
            <p className="font-barlow text-sm text-text-body font-medium">{servicioSel.nombre}</p>
            {servicioSel.precio_desde ? (
              <p className="font-barlow text-xs text-text-muted">desde €{servicioSel.precio_desde}</p>
            ) : null}
          </div>
        )
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-barlow text-[11px] font-semibold uppercase tracking-[0.4px] text-text-muted mb-2 flex items-center gap-1">
            <Calendar size={13} /> Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            required
            min={new Date().toISOString().split("T")[0]}
            className="w-full bg-fog border border-divisor rounded-sm px-3 py-2.5 font-barlow text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="font-barlow text-[11px] font-semibold uppercase tracking-[0.4px] text-text-muted mb-2 flex items-center gap-1">
            <Clock size={13} /> Hora
          </label>
          <input
            type="time"
            value={hora}
            onChange={e => setHora(e.target.value)}
            required
            className="w-full bg-fog border border-divisor rounded-sm px-3 py-2.5 font-barlow text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block font-barlow text-[11px] font-semibold uppercase tracking-[0.4px] text-text-muted mb-2">
          Tu nombre
        </label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          placeholder="Nombre y apellido"
          className="w-full bg-fog border border-divisor rounded-sm px-3 py-2.5 font-barlow text-sm focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block font-barlow text-[11px] font-semibold uppercase tracking-[0.4px] text-text-muted mb-2">
          Teléfono de contacto
        </label>
        <input
          type="tel"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          required
          placeholder="600 000 000"
          className="w-full bg-fog border border-divisor rounded-sm px-3 py-2.5 font-barlow text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {error && (
        <p className="font-barlow text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !fecha || !hora || !nombre.trim() || !telefono.trim()}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-barlow font-medium px-5 py-2.5 rounded-pill transition-colors"
      >
        {pending ? "Reservando…" : <>Confirmar reserva <ArrowRight size={14} /></>}
      </button>
    </form>
  );
}
