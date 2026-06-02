import { redirect } from "next/navigation";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { getDeliveryConfig, getDeliveryHorarios } from "@/lib/supabase/queries/delivery";
import { getMetodosPagoConfig, getComisionesConfig } from "@/lib/supabase/queries/admin";
import ConfigDeliveryView from "@/components/delivery/negocio/ConfigDeliveryView";
import type { ModoDelivery } from "@/types/delivery";

export default async function PanelDeliveryConfigPage() {
  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const [config, horarios, plataformaMethods, comisiones] = await Promise.all([
    getDeliveryConfig(prestador.id),
    getDeliveryHorarios(prestador.id),
    getMetodosPagoConfig().catch(() => ({ efectivo: true, bizum: false, tarjeta: false })),
    getComisionesConfig().catch(() => []),
  ]);

  // Comisión aplicable al modo PROPIO: la específica del pueblo si existe,
  // si no la global por defecto (pueblo_id = null, categoria = null).
  const puebloId = prestador.pueblo_id as number;
  const activas = comisiones.filter((c) => c.activa && c.categoria == null);
  const comisionPropioPct =
    activas.find((c) => c.pueblo_id === puebloId)?.porcentaje ??
    activas.find((c) => c.pueblo_id == null)?.porcentaje ??
    8;

  return (
    <ConfigDeliveryView
      activo={prestador.delivery_activo ?? false}
      modo={(prestador.delivery_modo as ModoDelivery) ?? null}
      config={config}
      horarios={horarios}
      plataformaMethods={plataformaMethods}
      comisionPropioPct={comisionPropioPct}
    />
  );
}
