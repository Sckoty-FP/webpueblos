"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface Q {
  q: string;
  a: string;
}

const PREGUNTAS: Q[] = [
  {
    q: "¿Cuánto cuesta?",
    a: "La suscripción base es mensual y editable. Pagás solo eso, más las comisiones de delivery y free tour si los activás.",
  },
  {
    q: "¿Qué pasa si quiero cancelar?",
    a: "Cancelás cuando quieras desde el panel. Sin permanencia, sin penalizaciones. Mantenés tu información hasta el último día del mes pagado.",
  },
  {
    q: "¿Necesito tarjeta para empezar?",
    a: "Sí, para activar la suscripción. La primera semana es de prueba gratuita.",
  },
  {
    q: "¿En qué pueblos están activos?",
    a: "Empezamos en Alcocèber, Castellón. Vamos sumando pueblos. Si el tuyo no está, podés pre-registrarte y te avisamos.",
  },
  {
    q: "¿Puedo darme de alta sin estar en un pueblo activo?",
    a: "Por ahora no. Necesitamos un mínimo de negocios por pueblo para arrancar. Si querés ser de los primeros del tuyo, escribinos.",
  },
  {
    q: "¿Cómo funcionan las comisiones de delivery?",
    a: "Cobramos un % sobre el subtotal del pedido (sin envío). El repartidor cobra aparte por reparto. Liquidación mensual automática.",
  },
];

export default function NegociosFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-black py-24 md:py-28">
      <div className="container-app max-w-3xl">
        <header className="mb-12">
          <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
            Preguntas frecuentes
          </span>
          <h2 className="display-section text-white">Lo que más nos preguntan.</h2>
        </header>

        <ul className="space-y-2">
          {PREGUNTAS.map((p, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className="border-b border-white/8 last:border-b-0">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black rounded"
                  aria-expanded={isOpen}
                >
                  <span className="font-fraunces text-lg font-semibold text-white group-hover:text-primary transition-colors">
                    {p.q}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center shrink-0">
                    {isOpen ? (
                      <Minus size={16} strokeWidth={2} className="text-white" />
                    ) : (
                      <Plus size={16} strokeWidth={2} className="text-white" />
                    )}
                  </span>
                </button>
                {isOpen && (
                  <p className="font-barlow text-base text-white/75 leading-relaxed pb-6 max-w-2xl">
                    {p.a}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
