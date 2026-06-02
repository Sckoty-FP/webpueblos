import type { Metadata } from "next";
import { getPresupuestoByToken, aceptarPresupuesto, rechazarPresupuesto } from "@/lib/supabase/queries/presupuestos";
import AceptarPresupuestoClient from "@/components/sections/public/AceptarPresupuestoClient";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Revisar presupuesto",
};

export default async function AceptarPresupuestoPage({ params }: Props) {
  const { token } = await params;
  const pre = await getPresupuestoByToken(token);

  // Presupuesto no encontrado
  if (!pre) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-[#f0f0f0] p-10" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f] mb-3">Enlace no válido</h1>
          <p className="font-barlow text-[14px] text-[#666]">
            Este enlace no corresponde a ningún presupuesto activo.
            Contactá directamente al profesional.
          </p>
        </div>
      </div>
    );
  }

  // Token expirado
  const expirado = pre.token_expira ? new Date(pre.token_expira) < new Date() : false;
  if (expirado) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-[#f0f0f0] p-10" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>
          <p className="text-5xl mb-4">⌛</p>
          <h1 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f] mb-3">Enlace expirado</h1>
          <p className="font-barlow text-[14px] text-[#666]">
            Este presupuesto ya no está disponible para aceptar en línea.
            Contactá al profesional para recibir un nuevo enlace.
          </p>
        </div>
      </div>
    );
  }

  // Ya gestionado
  if (pre.estado === "aceptado" || pre.estado === "rechazado") {
    const esAceptado = pre.estado === "aceptado";
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-[#f0f0f0] p-10" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.07)" }}>
          <p className="text-5xl mb-4">{esAceptado ? "✅" : "❌"}</p>
          <h1 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f] mb-3">
            Presupuesto {esAceptado ? "aceptado" : "rechazado"}
          </h1>
          <p className="font-barlow text-[14px] text-[#666]">
            Este presupuesto ya fue {esAceptado ? "aceptado" : "rechazado"} anteriormente.
          </p>
        </div>
      </div>
    );
  }

  async function handleAceptar() {
    "use server";
    return aceptarPresupuesto(token);
  }

  async function handleRechazar() {
    "use server";
    return rechazarPresupuesto(token);
  }

  return (
    <AceptarPresupuestoClient
      presupuesto={{
        id:              pre.id,
        numero:          pre.numero,
        cliente_nombre:  pre.cliente_nombre,
        descripcion:     pre.descripcion,
        lineas:          pre.lineas,
        importe_base:    pre.importe_base,
        iva_porcentaje:  pre.iva_porcentaje,
        importe_total:   pre.importe_total,
        valido_hasta:    pre.valido_hasta,
        notas:           pre.notas,
      }}
      onAceptar={handleAceptar}
      onRechazar={handleRechazar}
    />
  );
}
