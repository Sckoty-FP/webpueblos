import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Phone, MessageSquare, Globe, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getPrestadorBySlug } from "@/lib/supabase/queries/prestadores";
import FormReservaServicio from "@/components/pueblo/servicios/FormReservaServicio";

interface Props {
  params: Promise<{ pueblo: string; id: string }>;
}

// Página privada y transaccional: no debe indexarse.
// El `title.template` del layout raíz ya añade "· PUEBLO" — no lo duplicamos aquí.
export const metadata: Metadata = {
  title: "Reservar cita",
  robots: { index: false, follow: false },
};

export default async function ReservarServicioPage({ params }: Props) {
  const { pueblo: puebloSlug, id } = await params;

  const pueblo = await getPuebloBySlug(puebloSlug);
  if (!pueblo) notFound();

  const prestador = await getPrestadorBySlug(id);
  if (!prestador || prestador.pueblo_id !== pueblo.id) notFound();

  // Guard de sesión a nivel página: reservar exige login. Volvemos a esta misma
  // URL tras autenticarse para no perder el contexto (patrón del checkout de delivery).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/login?redirect=/${puebloSlug}/servicios/${id}/reservar`);
  }

  const reservables = (prestador.servicios ?? []).filter(s => s.reservable && s.activo);

  // Los servicios profesionales (electricista, fontanero…) no se reservan por cita:
  // van por presupuesto. Si alguien llega aquí, lo mandamos al flujo correcto.
  const esProfesional = (prestador.servicios ?? []).some(s => s.categoria === "servicios_pro");
  if (esProfesional) {
    redirect(`/${puebloSlug}/profesionales/${id}/presupuesto`);
  }

  // Sin servicios reservables no hay nada que reservar → de vuelta al detalle.
  if (reservables.length === 0) {
    redirect(`/${puebloSlug}/servicios/${id}`);
  }

  // Precargamos contacto desde el perfil para reducir fricción (editable en el form).
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, telefono")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-fog">
      <div className="container-app py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 font-barlow text-xs text-text-muted mb-8">
          <Link href={`/${puebloSlug}`} className="hover:text-primary">Inicio</Link>
          <ChevronRight size={12} />
          <Link href={`/${puebloSlug}/servicios`} className="hover:text-primary">Servicios</Link>
          <ChevronRight size={12} />
          <Link href={`/${puebloSlug}/servicios/${id}`} className="hover:text-primary">{prestador.nombre}</Link>
          <ChevronRight size={12} />
          <span className="text-text-body">Reservar</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_400px] gap-10 items-start">
          {/* Contexto del negocio + servicios reservables */}
          <div>
            <p className="font-fraunces text-xs font-medium uppercase tracking-[0.18em] text-accent-warm mb-3">
              Reservar en
            </p>
            <h1
              className="font-fraunces font-semibold text-text-body mb-4 leading-[1.05]"
              style={{ fontSize: "clamp(30px, 4vw, 44px)" }}
            >
              {prestador.nombre}
            </h1>
            {prestador.descripcion_corta && (
              <p className="font-barlow text-base text-text-muted max-w-xl leading-relaxed mb-8">
                {prestador.descripcion_corta}
              </p>
            )}

            <h2 className="font-fraunces text-lg font-semibold text-text-body mb-3">Servicios disponibles</h2>
            <ul className="space-y-2">
              {reservables.map(s => (
                <li
                  key={s.id}
                  className="flex items-center justify-between bg-white border border-divisor rounded-card px-4 py-3"
                >
                  <div>
                    <p className="font-barlow text-sm font-medium text-text-body">{s.nombre}</p>
                    {s.duracion_minutos ? (
                      <p className="font-barlow text-xs text-text-muted">{s.duracion_minutos} min</p>
                    ) : null}
                  </div>
                  {s.precio_desde ? (
                    <span className="font-fraunces text-sm font-semibold text-text-body whitespace-nowrap">
                      desde €{s.precio_desde}
                    </span>
                  ) : (
                    <span className="font-barlow text-[11px] text-text-muted uppercase tracking-wide">Consultar</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Tarjeta de reserva + contacto directo */}
          <aside className="lg:sticky lg:top-20 h-fit space-y-5">
            <FormReservaServicio
              puebloSlug={puebloSlug}
              prestadorSlug={id}
              prestadorId={prestador.id}
              servicios={reservables}
              defaultNombre={perfil?.nombre ?? ""}
              defaultTelefono={perfil?.telefono ?? ""}
            />

            {(prestador.telefono || prestador.whatsapp || prestador.web) && (
              <div className="bg-white rounded-card-lg border border-divisor p-6 shadow-card">
                <p className="font-barlow text-[11px] font-semibold uppercase tracking-[0.4px] text-text-muted mb-3">
                  Contacto directo
                </p>
                <div className="flex flex-col gap-2.5">
                  {prestador.telefono && (
                    <a
                      href={`tel:${prestador.telefono}`}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm bg-fog text-text-body font-barlow text-sm hover:bg-divisor transition-colors"
                    >
                      <Phone size={15} strokeWidth={1.5} /> {prestador.telefono}
                    </a>
                  )}
                  {prestador.whatsapp && (
                    <a
                      href={`https://wa.me/${prestador.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm bg-fog text-text-body font-barlow text-sm hover:bg-divisor transition-colors"
                    >
                      <MessageSquare size={15} strokeWidth={1.5} /> WhatsApp
                    </a>
                  )}
                  {prestador.web && (
                    <a
                      href={prestador.web.startsWith("http") ? prestador.web : `https://${prestador.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm bg-fog text-text-body font-barlow text-sm hover:bg-divisor transition-colors"
                    >
                      <Globe size={15} strokeWidth={1.5} /> Sitio web
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
