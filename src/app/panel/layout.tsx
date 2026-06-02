import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { getPrestadorComoEncargado } from "@/lib/supabase/queries/equipo";
import { getModules } from "@/lib/panel/modules";
import { getPueblos } from "@/lib/supabase/queries/pueblos";
import PanelSidebar from "@/components/layout/PanelSidebar";
import PanelOnboarding from "@/components/sections/panel/PanelOnboarding";
import type { RolPanel } from "@/types/equipo";

interface Props {
  children: React.ReactNode;
}

export default async function PanelLayout({ children }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Leer tipo desde DB (más fiable que user_metadata que puede estar desactualizado)
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("tipo")
    .eq("id", user.id)
    .single();

  const tipo = perfil?.tipo ?? user.user_metadata?.tipo;

  if (tipo !== "prestador" && tipo !== "encargado") redirect("/");

  // Resolver prestador y rol según el tipo de usuario
  let prestador = null;
  let rol: RolPanel = "propietario";

  if (tipo === "encargado") {
    prestador = await getPrestadorComoEncargado();
    rol = "encargado";
  } else {
    prestador = await getPrestadorDelUsuario();
    rol = "propietario";
  }

  const pueblos = await getPueblos();

  // Propietario sin negocio → formulario de solicitud
  if (!prestador && rol === "propietario") {
    return (
      <PanelOnboarding
        userEmail={user.email ?? ""}
        pueblos={pueblos.map((p) => ({ id: p.id, nombre: p.nombre, slug: p.slug }))}
      />
    );
  }

  // Sin negocio (encargado sin asignación activa o error)
  if (!prestador) {
    return (
      <div className="min-h-screen bg-fog flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-card-lg border border-divisor p-10" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
          <h1 className="font-fraunces font-semibold text-[24px] text-text-body mb-3">Sin acceso activo</h1>
          <p className="font-barlow text-[14px] text-text-muted mb-8">
            Tu cuenta de encargado no tiene un negocio asignado actualmente.
            Contactá al propietario del negocio para que reactive tu acceso.
          </p>
          <Link href="/" className="inline-block font-barlow font-bold text-white bg-primary rounded-pill px-6 py-3 no-underline hover:opacity-90 transition-opacity">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Negocio pendiente de aprobación (solo propietarios)
  if (!prestador.activo && rol === "propietario") {
    return (
      <div className="min-h-screen bg-fog flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-card-lg border border-divisor p-10" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="font-fraunces font-semibold text-[24px] text-text-body mb-3">Solicitud en revisión</h1>
          <p className="font-barlow text-[14px] text-text-muted mb-2">
            Recibimos tu solicitud para <strong>{prestador.nombre}</strong>.
          </p>
          <p className="font-barlow text-[14px] text-text-muted mb-8">
            La estamos revisando y te avisaremos por email cuando tu perfil esté activo.
          </p>
          <Link href="/" className="inline-block font-barlow font-bold text-white bg-primary rounded-pill px-6 py-3 no-underline hover:opacity-90 transition-opacity">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const modules    = getModules(prestador.servicios, prestador, rol);
  const puebloSlug = pueblos.find((p) => p.id === prestador.pueblo_id)?.slug ?? pueblos[0]?.slug ?? null;

  return (
    <div className="flex min-h-screen bg-fog">
      <PanelSidebar
        modules={modules}
        puebloSlug={puebloSlug}
        prestadorNombre={prestador.nombre}
        rol={rol}
      />
      <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
}
