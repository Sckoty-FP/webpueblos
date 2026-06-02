"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface TipoNegocio {
  id: string;
  label: string;
  modulos: string[];
}

const TIPOS: TipoNegocio[] = [
  {
    id: "restauracion",
    label: "Restaurante / Bar / Cafetería",
    modulos: [
      "Carta digital",
      "Mesas con QR",
      "Reservas online",
      "Delivery (opt-in)",
      "Caja",
      "Inventario",
      "Notas y recordatorios",
      "Equipo",
    ],
  },
  {
    id: "belleza",
    label: "Peluquería / Estética",
    modulos: [
      "Profesionales con agenda propia",
      "Reservas por profesional",
      "Caja",
      "Notas de cliente",
      "Equipo",
    ],
  },
  {
    id: "servicios",
    label: "Servicios profesionales",
    modulos: [
      "Presupuestos públicos online",
      "Aceptación con firma digital",
      "Partes de trabajo móviles",
      "Caja automática",
      "Notas",
    ],
  },
  {
    id: "actividades",
    label: "Actividades y alquileres",
    modulos: [
      "Recursos reservables (motos, bicis, kayaks)",
      "Validación de solapamiento",
      "Consentimientos firmados",
      "Caja",
    ],
  },
  {
    id: "hospedaje",
    label: "Hospedaje (apartamentos turísticos)",
    modulos: [
      "Propiedades múltiples",
      "Calendario unificado",
      "Reservas directas",
      "Notas y limpieza",
    ],
  },
  {
    id: "comercio",
    label: "Comercio",
    modulos: [
      "Catálogo simple",
      "Inventario con stock",
      "Caja",
      "Delivery (opt-in)",
    ],
  },
  {
    id: "free-tour",
    label: "Guía de Free Tour",
    modulos: [
      "Calendario de sesiones",
      "Cupo máximo por sesión",
      "Inscripciones online",
      "Comisión fija por inscripción",
    ],
  },
];

export default function NegociosModulos() {
  const [active, setActive] = useState<string>(TIPOS[0]!.id);
  const current = TIPOS.find((t) => t.id === active) ?? TIPOS[0]!;

  return (
    <section className="bg-surface-dark py-24 md:py-28">
      <div className="container-app">
        <header className="mb-12 max-w-2xl">
          <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
            Módulos por tipo de negocio
          </span>
          <h2 className="display-section text-white mb-3">Cada negocio, su panel.</h2>
          <p className="font-barlow text-lg text-white/65 leading-relaxed">
            Activamos solo los módulos que tu tipo de negocio necesita. Sin ruido.
          </p>
        </header>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          {/* Tabs */}
          <nav
            className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible"
            style={{ scrollbarWidth: "none" }}
          >
            {TIPOS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`text-left whitespace-nowrap lg:whitespace-normal font-barlow text-base px-5 py-3 rounded-card transition-all duration-150 ${
                  active === t.id
                    ? "bg-primary text-white font-medium"
                    : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Lista de módulos */}
          <div className="bg-black/40 rounded-card-lg p-8 border border-white/8">
            <h3 className="font-fraunces text-2xl font-semibold text-white mb-6">
              {current.label}
            </h3>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {current.modulos.map((m) => (
                <li
                  key={m}
                  className="flex items-center gap-3 font-barlow text-base text-white/85"
                >
                  <Check size={16} strokeWidth={2} className="text-primary shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
