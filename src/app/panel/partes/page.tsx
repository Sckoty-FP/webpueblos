import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import {
  getPartesDelPrestador,
  crearParte,
  cerrarParte,
  actualizarFirmaYFotos,
} from "@/lib/supabase/queries/partes";
import { getPresupuestosDelPrestador, actualizarPdfUrl } from "@/lib/supabase/queries/presupuestos";
import PartesView from "@/components/sections/panel/partes/PartesView";
import type { ParteFormData } from "@/components/sections/panel/partes/PartesView";
import type { MetodoCobro } from "@/types/servicios-pro";

interface Props {
  searchParams: Promise<{ presupuesto?: string }>;
}

export default async function PanelPartesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: perfil } = await supabase
    .from("usuarios").select("tipo").eq("id", user.id).single();
  if (perfil?.tipo !== "prestador") redirect("/panel");

  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const [partes, aceptados] = await Promise.all([
    getPartesDelPrestador(prestador.id),
    getPresupuestosDelPrestador(prestador.id, "aceptado"),
  ]);

  // Presupuestos aceptados disponibles para vincular a un parte nuevo
  const presupuestosOpen = aceptados.map(p => ({
    id:             p.id,
    numero:         p.numero,
    cliente_nombre: p.cliente_nombre,
    importe_total:  p.importe_total,
  }));

  // ── Server Actions ──────────────────────────────────────────────────────────

  async function handleCrear(
    data: ParteFormData,
  ): Promise<{ ok: boolean; id?: string; error?: string }> {
    "use server";
    const p = await getPrestadorDelUsuario();
    const sb = await createClient();
    const { data: { user: u } } = await sb.auth.getUser();
    if (!p || !u) return { ok: false, error: "Sin sesión" };

    try {
      const parte = await crearParte({
        prestador_id:      p.id,
        presupuesto_id:    data.presupuesto_id   || undefined,
        fecha_trabajo:     data.fecha_trabajo,
        duracion_horas:    data.duracion_horas ? parseFloat(data.duracion_horas) : undefined,
        trabajo_realizado: data.trabajo_realizado,
        materiales:        data.materiales       || undefined,
        importe_final:     data.importe_final,
        registrado_por:    u.id,
      });
      return { ok: true, id: parte.id };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleCerrar(
    id:     string,
    metodo: MetodoCobro,
  ): Promise<{ ok: boolean; error?: string }> {
    "use server";
    const sb = await createClient();
    const { data: { user: u } } = await sb.auth.getUser();
    if (!u) return { ok: false, error: "Sin sesión" };

    try {
      await cerrarParte(id, metodo, u.id);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleSubirFirma(
    id:          string,
    firmaDataUrl: string,
  ): Promise<{ ok: boolean; url?: string; error?: string }> {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false, error: "Sin negocio" };

    try {
      // Convertir data URL a Buffer
      const base64 = firmaDataUrl.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64, "base64");

      const sb   = await createClient();
      const path = `${p.id}/${id}/firma.png`;

      const { error: upErr } = await sb.storage
        .from("firmas-partes")
        .upload(path, buffer, { contentType: "image/png", upsert: true });

      if (upErr) return { ok: false, error: upErr.message };

      const { data: urlData } = sb.storage.from("firmas-partes").getPublicUrl(path);
      await actualizarFirmaYFotos(id, urlData.publicUrl, undefined);
      return { ok: true, url: urlData.publicUrl };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleGenerarPDF(
    id: string,
  ): Promise<{ ok: boolean; url?: string; error?: string }> {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false, error: "Sin negocio" };

    try {
      const { getParte } = await import("@/lib/supabase/queries/partes");
      const parte = await getParte(id);
      if (!parte) return { ok: false, error: "Parte no encontrado" };

      const { renderToBuffer } = await import("@react-pdf/renderer");
      const { PartePDF } = await import("@/lib/pdf/PartePDF");
      const React = await import("react");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buffer = await renderToBuffer(
        React.createElement(PartePDF, { parte, negocioNombre: p.nombre }) as any,
      );

      const sb   = await createClient();
      const path = `${p.id}/${parte.numero}.pdf`;

      const { error: uploadError } = await sb.storage
        .from("partes-fotos")
        .upload(path, buffer, { contentType: "application/pdf", upsert: true });

      if (uploadError) return { ok: false, error: uploadError.message };

      const { data: urlData } = sb.storage.from("partes-fotos").getPublicUrl(path);
      return { ok: true, url: urlData.publicUrl };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  return (
    <main className="flex-1 p-8 max-md:p-4">
      <div className="mb-6 hidden md:block">
        <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-text-muted mb-1">
          Panel del negocio
        </p>
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body">
          Partes de trabajo
        </h1>
      </div>
      <PartesView
        partes={partes}
        presupuestosOpen={presupuestosOpen}
        onCrear={handleCrear}
        onCerrar={handleCerrar}
        onSubirFirma={handleSubirFirma}
        onGenerarPDF={handleGenerarPDF}
      />
    </main>
  );
}
