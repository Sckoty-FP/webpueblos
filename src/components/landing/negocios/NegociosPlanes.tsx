import type { ConfigPlataforma } from "@/lib/supabase/queries/config-plataforma";

interface Props {
  config: ConfigPlataforma;
}

export default function NegociosPlanes({ config }: Props) {
  return (
    <section className="bg-black py-24 md:py-28">
      <div className="container-app">
        <header className="mb-12 max-w-2xl">
          <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
            Planes y comisiones
          </span>
          <h2 className="display-section text-white mb-3">
            Transparente.<br />Sin sorpresas.
          </h2>
          <p className="font-barlow text-lg text-white/65 leading-relaxed">
            Pagás solo cuando vendés. Ni más, ni menos.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Suscripción */}
          <article className="bg-surface-dark rounded-card-lg p-8 border border-white/8">
            <h3 className="font-fraunces text-xl font-semibold text-white mb-3">
              Suscripción base
            </h3>
            <p className="font-fraunces text-5xl font-semibold text-white mb-1">
              €{config.precio_suscripcion_mensual.toFixed(2)}
              <span className="text-base font-normal text-white/55">/mes</span>
            </p>
            <p className="font-barlow text-sm text-white/55 mb-6">
              Acceso a todos los módulos de tu tipo de negocio.
            </p>
            <ul className="space-y-2 font-barlow text-sm text-white/75">
              <li>· Cancelás cuando quieras</li>
              <li>· Sin permanencia</li>
              <li>· Soporte por chat</li>
            </ul>
          </article>

          {/* Delivery */}
          <article className="bg-surface-dark rounded-card-lg p-8 border border-white/8">
            <h3 className="font-fraunces text-xl font-semibold text-white mb-3">
              Delivery (opcional)
            </h3>
            <p className="font-fraunces text-5xl font-semibold text-white mb-1">
              {config.comision_delivery_porcentaje}
              <span className="text-base font-normal text-white/55">%</span>
            </p>
            <p className="font-barlow text-sm text-white/55 mb-6">
              Comisión sobre cada pedido entregado.
            </p>
            <ul className="space-y-2 font-barlow text-sm text-white/75">
              <li>· Repartidor incluido</li>
              <li>· Tracking realtime</li>
              <li>· Cobro automático</li>
            </ul>
          </article>

          {/* Free Tour */}
          <article className="bg-surface-dark rounded-card-lg p-8 border border-white/8">
            <h3 className="font-fraunces text-xl font-semibold text-white mb-3">
              Free Tour (opcional)
            </h3>
            <p className="font-fraunces text-5xl font-semibold text-white mb-1">
              €{config.comision_free_tour_fija.toFixed(2)}
            </p>
            <p className="font-barlow text-sm text-white/55 mb-6">
              Por cada inscripción confirmada.
            </p>
            <ul className="space-y-2 font-barlow text-sm text-white/75">
              <li>· Cobro Stripe automático</li>
              <li>· Comisión solo si hay inscripción</li>
              <li>· Liquidación mensual</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
