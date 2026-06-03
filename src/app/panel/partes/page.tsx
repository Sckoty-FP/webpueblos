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

  const [partesRaw, aceptados] = await Promise.all([
    getPartesDelPrestador(prestador.id),
    getPresupuestosDelPrestador(prestador.id, "aceptado"),
  ]);

  // SEC-008: firmas-partes es un bucket PRIVADO. La firma se persiste como PATH
  // (no como URL); la firmamos a demanda (1h) para que el <img> del panel la
  // muestre. Las filas viejas con URL pública (http...) se dejan tal cual.
  const partes = await Promise.all(
    partesRaw.map(async (pt) => {
      if (!pt.cliente_firma_url || pt.cliente_firma_url.startsWith("http")) return pt;
      const { data } = await supabase.storage
        .from("firmas-partes")
        .createSignedUrl(pt.cliente_firma_url, 3600);
      return { ...pt, cliente_firma_url: data?.signedUrl ?? pt.cliente_firma_url };
    }),
  );

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

      // SEC-008: firmas-partes es privado. Guardamos el PATH (no una URL) y
      // firmamos a demanda al mostrarlo, igual que presupuestos-pdf (SEC-002b).
      await actualizarFirmaYFotos(id, path, undefined);
      const { data: signed } = await sb.storage
        .from("firmas-partes")
        .createSignedUrl(path, 3600);
      return { ok: true, url: signed?.signedUrl };
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

      const sb = await createClient();

      // SEC-008: firmas-partes es privado. La firma vive como PATH; la firmamos
      // a demanda para que @react-pdf pueda fetchearla y embeberla en el PDF.
      let parteParaPdf = parte;
      if (parte.cliente_firma_url && !parte.cliente_firma_url.startsWith("http")) {
        const { data: firma } = await sb.storage
          .from("firmas-partes")
          .createSignedUrl(parte.cliente_firma_url, 3600);
        parteParaPdf = { ...parte, cliente_firma_url: firma?.signedUrl ?? null };
      }

      const { renderToBuffer } = await import("@react-pdf/renderer");
      const { PartePDF } = await import("@/lib/pdf/PartePDF");
      const React = await import("react");

      const buffer = await renderToBuffer(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        React.createElement(PartePDF, { parte: parteParaPdf, negocioNombre: p.nombre }) as any,
      );

      const path = `${p.id}/${parte.numero}.pdf`;

      const { error: uploadError } = await sb.storage
        .from("partes-fotos")
        .upload(path, buffer, { contentType: "application/pdf", upsert: true });

      if (uploadError) return { ok: false, error: uploadError.message };

      // partes-fotos también es privado (SEC-008): URL firmada, no pública.
      const { data: signed } = await sb.storage
        .from("partes-fotos")
        .createSignedUrl(path, 3600);
      return { ok: true, url: signed?.signedUrl };
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
