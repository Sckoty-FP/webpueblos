import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPrestadorBySlug } from "@/lib/supabase/queries/prestadores";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { solicitarPresupuestoPublico } from "@/lib/supabase/queries/presupuestos";
import { rateLimit } from "@/lib/rate-limit";
import { PUBLIC_FORM } from "@/lib/rate-limit/policies";
import SolicitudPresupuestoForm from "@/components/sections/public/SolicitudPresupuestoForm";

interface Props {
  params: Promise<{ pueblo: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const prestador = await getPrestadorBySlug(slug);
  if (!prestador) return { title: "Solicitar presupuesto" };
  return {
    title: `Solicitar presupuesto — ${prestador.nombre}`,
    description: `Pedí un presupuesto gratuito a ${prestador.nombre}. Respondemos en menos de 24 horas.`,
  };
}

export default async function SolicitudPresupuestoPage({ params }: Props) {
  const { pueblo: puebloSlug, slug } = await params;

  const [pueblo, prestador] = await Promise.all([
    getPuebloBySlug(puebloSlug),
    getPrestadorBySlug(slug),
  ]);

  if (!pueblo || !prestador) notFound();

  async function handleSolicitud(fd: FormData): Promise<{ ok: boolean; error?: string }> {
    "use server";
    const rl = await rateLimit("presupuesto-publico", PUBLIC_FORM);
    if (!rl.ok) {
      return { ok: false, error: `Demasiadas solicitudes. Probá de nuevo en ${rl.resetSec}s.` };
    }

    const nombre    = (fd.get("nombre")    as string ?? "").trim();
    const email     = (fd.get("email")     as string ?? "").trim();
    const telefono  = (fd.get("telefono")  as string ?? "").trim();
    const descripcion = (fd.get("descripcion") as string ?? "").trim();

    if (!nombre)       return { ok: false, error: "El nombre es obligatorio." };
    if (!descripcion)  return { ok: false, error: "Describí el trabajo que necesitás." };
    if (!email && !telefono) return { ok: false, error: "Indicá al menos un email o teléfono." };

    if (!prestador) return { ok: false, error: "Profesional no disponible." };

    // Vía RPC SECURITY DEFINER: el visitante es anónimo y RLS le niega el INSERT
    // directo. La función solo permite crear una solicitud (borrador). Ver 044.
    return solicitarPresupuestoPublico({
      prestador_id:     prestador.id,
      cliente_nombre:   nombre,
      descripcion,
      cliente_email:    email    || undefined,
      cliente_telefono: telefono || undefined,
    });
  }

  return (
    <SolicitudPresupuestoForm
      prestadorNombre={prestador.nombre}
      puebloNombre={pueblo.nombre}
      puebloSlug={puebloSlug}
      slug={slug}
      onSolicitar={handleSolicitud}
    />
  );
}
