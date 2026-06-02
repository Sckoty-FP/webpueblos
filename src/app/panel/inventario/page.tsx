import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { getInventarioItems, crearInventarioItem, ajustarStock } from "@/lib/supabase/queries/inventario";
import InventarioView from "@/components/sections/panel/inventario/InventarioView";

export default async function PanelInventarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: perfil } = await supabase
    .from("usuarios").select("tipo").eq("id", user.id).single();
  if (perfil?.tipo !== "prestador") notFound();

  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const items = await getInventarioItems(prestador.id);

  async function handleCrearItem(formData: FormData) {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return;
    const nombre = formData.get("nombre") as string;
    if (!nombre) return;
    await crearInventarioItem(p.id, {
      nombre,
      sku: (formData.get("sku") as string) || undefined,
      unidad: (formData.get("unidad") as string) || "unidad",
      stock_actual: parseFloat((formData.get("stock_actual") as string) || "0"),
      stock_minimo: parseFloat((formData.get("stock_minimo") as string) || "0"),
      precio_compra: formData.get("precio_compra") ? parseFloat(formData.get("precio_compra") as string) : undefined,
      precio_venta:  formData.get("precio_venta")  ? parseFloat(formData.get("precio_venta")  as string) : undefined,
    });
  }

  async function handleAjustarStock(
    itemId: string,
    tipo: "entrada" | "salida" | "ajuste" | "merma",
    cantidad: number,
    motivo?: string
  ) {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return { ok: false };
    return ajustarStock(itemId, p.id, cantidad, tipo, motivo);
  }

  return (
    <InventarioView
      items={items}
      onCrearItem={handleCrearItem}
      onAjustarStock={handleAjustarStock}
    />
  );
}
