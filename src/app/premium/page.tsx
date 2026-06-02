import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import NotifyMeForm from "@/components/sections/premium/NotifyMeForm";
import { getPrecioPremiumEur, getPremiumActivo } from "@/lib/supabase/queries/config-plataforma";

export const metadata: Metadata = {
  title: "PUEBLO Premium · sin anuncios y beneficios reales",
  description: "Suscripción mensual que apoya la plataforma de tu pueblo y te da ventajas en negocios adheridos.",
};

const BENEFICIOS = [
  "Sin anuncios en toda la plataforma",
  "Descuentos en negocios adheridos del pueblo",
  "Reservas con prioridad en horarios saturados",
  "Apoyás directamente a la plataforma de tu pueblo",
  "Cancelás cuando quieras",
];

export default async function PremiumPage() {
  const activo = await getPremiumActivo();
  if (!activo) notFound();

  const precio = await getPrecioPremiumEur();

  return (
    <>
      <Nav />
      <main className="pt-14 min-h-screen bg-fog">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#0a2540] via-primary to-[#003e75] py-20 md:py-28 text-white">
          <div className="container-app text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-pill mb-6">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="font-fraunces text-[12px] font-semibold uppercase tracking-wider">PUEBLO Premium</span>
            </div>
            <h1 className="display-hero mb-4">{precio}€ al mes. Sin compromiso.</h1>
            <p className="font-barlow text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
              Apoyás la plataforma de tu pueblo, te quitamos los anuncios, y desbloqueás beneficios en negocios adheridos.
            </p>
          </div>
        </section>

        {/* Beneficios */}
        <section className="py-16 md:py-20">
          <div className="container-app max-w-2xl mx-auto">
            <h2 className="display-module text-text-body mb-8 text-center">Qué incluye</h2>
            <ul className="space-y-4">
              {BENEFICIOS.map(b => (
                <li key={b} className="flex items-start gap-3 bg-white border border-divisor rounded-card p-4">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0070cc" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <p className="font-barlow text-base text-text-body">{b}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA — placeholder honesto */}
        <section className="bg-white py-16 md:py-20 border-t border-divisor">
          <div className="container-app max-w-md mx-auto text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0070cc" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <h2 className="font-fraunces font-semibold text-2xl text-text-body mb-2">Aún no disponible</h2>
            <p className="font-barlow text-base text-text-muted mb-6">
              Estamos terminando la integración de pagos. Dejá tu email y te avisamos en cuanto Premium esté listo.
            </p>
            <NotifyMeForm precio={precio} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
