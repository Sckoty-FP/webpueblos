import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import {
  getPresupuestosDelPrestador,
  crearPresupuesto,
  actualizarPresupuesto,
  enviarPresupuesto,
  actualizarPdfUrl,
} from "@/lib/supabase/queries/presupuestos";
import PresupuestosView from "@/components/sections/panel/presupuestos/PresupuestosView";
import type { PresupuestoFormData } from "@/components/sections/panel/presupuestos/PresupuestosView";

export default async function PanelPresupuestosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: perfil } = await supabase
    .from("usuarios").select("tipo").eq("id", user.id).single();
  if (perfil?.tipo !== "prestador") redirect("/panel");

  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const [solicitudes, borradores, enviados, aceptados, archivados] = await Promise.all([
    getPresupuestosDelPrestador(prestador.id, "solicitud"),
    getPresupuestosDelPrestador(prestador.id, "borrador"),
    getPresupuestosDelPrestador(prestador.id, "enviado"),
    getPresupuestosDelPrestador(prestador.id, "aceptado"),
    getPresupuestosDelPrestador(prestador.id, "rechazado"),
  ]);

  // ── Server Actions ──────────────────────────────────────────────────────────

  async function handleCrear(
    data: PresupuestoFormData,
  ): Promise<{ ok: boolean; error?: string }> {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false, error: "Sin negocio" };
    try {
      await crearPresupuesto({
        prestador_id:      p.id,
        cliente_nombre:    data.cliente_nombre,
        cliente_email:     data.cliente_email     || undefined,
        cliente_telefono:  data.cliente_telefono  || undefined,
        cliente_direccion: data.cliente_direccion || undefined,
        descripcion:       data.descripcion       || undefined,
        lineas:            data.lineas,
        iva_porcentaje:    data.iva_porcentaje,
        valido_hasta:      data.valido_hasta       || undefined,
        notas:             data.notas              || undefined,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleActualizar(
    id:   string,
    data: PresupuestoFormData,
  ): Promise<{ ok: boolean; error?: string }> {
    "use server";
    try {
      await actualizarPresupuesto(id, {
        cliente_nombre:    data.cliente_nombre,
        cliente_email:     data.cliente_email     || undefined,
        cliente_telefono:  data.cliente_telefono  || undefined,
        cliente_direccion: data.cliente_direccion || undefined,
        descripcion:       data.descripcion       || undefined,
        lineas:            data.lineas,
        iva_porcentaje:    data.iva_porcentaje,
        valido_hasta:      data.valido_hasta       || undefined,
        notas:             data.notas              || undefined,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async function handleEnviar(
    id: string,
  ): Promise<{ ok: boolean; link?: string; error?: string }> {
    "use server";
    const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      const { token } = await enviarPresupuesto(id);
      return { ok: true, link: `${url}/p/aceptar/${token}` };
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
      const { getPresupuesto } = await import("@/lib/supabase/queries/presupuestos");
      const pre = await getPresupuesto(id);
      if (!pre) return { ok: false, error: "Presupuesto no encontrado" };

      const { renderToBuffer } = await import("@react-pdf/renderer");
      const { PresupuestoPDF } = await import("@/lib/pdf/PresupuestoPDF");
      const React = await import("react");

      const buffer = await renderToBuffer(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        React.createElement(PresupuestoPDF, { presupuesto: pre, negocioNombre: p.nombre }) as any,
      );

      const { createClient: createSB } = await import("@/lib/supabase/server");
      const sb = await createSB();
      const path = `${p.id}/${pre.numero}.pdf`;

      const { error: uploadError } = await sb.storage
        .from("presupuestos-pdf")
        .upload(path, buffer, { contentType: "application/pdf", upsert: true });

      if (uploadError) return { ok: false, error: uploadError.message };

      // SEC-002b: bucket privado. Guardamos el path (no una URL pública) y
      // servimos con URL firmada a demanda (createSignedUrl, 1h).
      await actualizarPdfUrl(id, path);
      const { data: signed } = await sb.storage
        .from("presupuestos-pdf")
        .createSignedUrl(path, 3600);
      return { ok: true, url: signed?.signedUrl };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  // SEC-002b: genera una URL firmada fresca para ver un PDF ya existente. El path
  // se reconstruye desde el prestador logueado + el número, así no importa qué se
  // haya guardado antes en pdf_url (incluso URLs públicas viejas dejan de exponer).
  async function handleVerPdf(
    id: string,
  ): Promise<{ ok: boolean; url?: string; error?: string }> {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false, error: "Sin negocio" };

    const { getPresupuesto } = await import("@/lib/supabase/queries/presupuestos");
    const pre = await getPresupuesto(id);
    if (!pre) return { ok: false, error: "Presupuesto no encontrado" };

    const { createClient: createSB } = await import("@/lib/supabase/server");
    const sb = await createSB();
    const path = `${p.id}/${pre.numero}.pdf`;
    const { data, error } = await sb.storage
      .from("presupuestos-pdf")
      .createSignedUrl(path, 3600);
    if (error || !data) {
      return { ok: false, error: error?.message ?? "No se pudo generar el enlace" };
    }
    return { ok: true, url: data.signedUrl };
  }

  async function handleCrearParte(presupuestoId: string) {
    "use server";
    redirect(`/panel/partes?presupuesto=${presupuestoId}`);
  }

  return (
    <main className="flex-1 p-8 max-md:p-4">
      <div className="mb-6 hidden md:block">
        <p className="font-barlow font-semibold text-[10px] uppercase tracking-widest text-text-muted mb-1">
          Panel del negocio
        </p>
        <h1 className="font-fraunces font-semibold text-[28px] text-text-body">
          Presupuestos
        </h1>
      </div>
      <PresupuestosView
        solicitudes={solicitudes}
        borradores={borradores}
        enviados={enviados}
        aceptados={aceptados}
        archivados={archivados}
        onCrear={handleCrear}
        onActualizar={handleActualizar}
        onEnviar={handleEnviar}
        onGenerarPDF={handleGenerarPDF}
        onVerPdf={handleVerPdf}
        onCrearParte={handleCrearParte}
        appUrl={appUrl}
      />
    </main>
  );
}
