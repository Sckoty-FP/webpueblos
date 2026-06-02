import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { aceptarInvitacion } from "@/lib/supabase/queries/equipo";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function InvitacionPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-fog flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-[18px] p-10" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          <h1 className="font-fraunces font-semibold text-[24px] text-text-body mb-3">Link inválido</h1>
          <p className="font-barlow text-[14px] text-text-muted mb-8">
            Este link de invitación no es válido o ya expiró.
          </p>
          <Link href="/" className="inline-block font-barlow font-bold text-white bg-primary rounded-pill px-6 py-3 no-underline">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no está logueado → redirigir al login con este link como next
  if (!user) {
    redirect(`/auth/login?next=/auth/invitacion?token=${token}`);
  }

  // Intentar aceptar la invitación
  const result = await aceptarInvitacion(token);

  if (result.ok) {
    redirect("/panel");
  }

  return (
    <div className="min-h-screen bg-fog flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-[18px] p-10" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
        <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c81b3a" strokeWidth="1.75">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="font-fraunces font-semibold text-[24px] text-text-body mb-3">No se pudo aceptar</h1>
        <p className="font-barlow text-[14px] text-text-muted mb-8">{result.error}</p>
        <Link href="/" className="inline-block font-barlow font-bold text-white bg-primary rounded-pill px-6 py-3 no-underline">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
