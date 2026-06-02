import { getDeliveryPricingConfig, getMetodosPagoConfig, getComisionesConfig } from "@/lib/supabase/queries/admin";
import { getPueblos } from "@/lib/supabase/queries/pueblos";
import DeliveryAdminView from "@/components/admin/delivery/DeliveryAdminView";
import {
  updatePlataformaConfig,
  crearComisionConfig,
  actualizarComisionConfig,
  toggleComisionConfig,
} from "@/lib/supabase/queries/admin";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  const [pricing, metodos, comisiones, pueblos] = await Promise.all([
    getDeliveryPricingConfig(),
    getMetodosPagoConfig(),
    getComisionesConfig(),
    getPueblos(),
  ]);

  // ── Server Actions ────────────────────────────────────────────────────────

  async function handleSavePricing(fd: FormData) {
    "use server";
    const tarifa_base    = parseFloat(fd.get("tarifa_base") as string);
    const precio_km      = parseFloat(fd.get("precio_km") as string);
    const porcentaje_restaurante = parseFloat(fd.get("porcentaje_restaurante") as string);

    await Promise.all([
      updatePlataformaConfig("delivery_tarifa_base",            { value: tarifa_base }),
      updatePlataformaConfig("delivery_precio_km",              { value: precio_km }),
      updatePlataformaConfig("delivery_porcentaje_restaurante", { value: porcentaje_restaurante }),
    ]);
    revalidatePath("/admin/delivery");
  }

  async function handleSaveMetodos(fd: FormData) {
    "use server";
    await updatePlataformaConfig("metodos_pago_habilitados", {
      efectivo: fd.get("efectivo") === "on",
      bizum:    fd.get("bizum")    === "on",
      tarjeta:  fd.get("tarjeta")  === "on",
    });
    revalidatePath("/admin/delivery");
  }

  async function handleCrearComision(fd: FormData) {
    "use server";
    const pueblo_id  = fd.get("pueblo_id") ? parseInt(fd.get("pueblo_id") as string) : null;
    const categoria  = (fd.get("categoria") as string) || null;
    const porcentaje = parseFloat(fd.get("porcentaje") as string);
    const observaciones = (fd.get("observaciones") as string) || null;
    await crearComisionConfig({ pueblo_id, categoria: categoria as never, porcentaje, observaciones });
    revalidatePath("/admin/delivery");
  }

  async function handleToggleComision(fd: FormData) {
    "use server";
    const id     = fd.get("id") as string;
    const activa = fd.get("activa") === "true";
    await toggleComisionConfig(id, activa);
    revalidatePath("/admin/delivery");
  }

  async function handleEditComision(fd: FormData) {
    "use server";
    const id         = fd.get("id") as string;
    const porcentaje = parseFloat(fd.get("porcentaje") as string);
    await actualizarComisionConfig(id, porcentaje);
    revalidatePath("/admin/delivery");
  }

  return (
    <DeliveryAdminView
      pricing={pricing}
      metodos={metodos}
      comisiones={comisiones}
      pueblos={pueblos}
      onSavePricing={handleSavePricing}
      onSaveMetodos={handleSaveMetodos}
      onCrearComision={handleCrearComision}
      onToggleComision={handleToggleComision}
      onEditComision={handleEditComision}
    />
  );
}
