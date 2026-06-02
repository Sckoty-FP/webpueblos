import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import { getMovimientosCaja, getResumenCajaMes, crearMovimientoCaja } from "@/lib/supabase/queries/caja";
import CajaClientWrapper from "@/components/sections/panel/caja/CajaClientWrapper";

interface Props {
  searchParams: Promise<{ mes?: string; anyo?: string }>;
}

export default async function PanelCajaPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: perfil } = await supabase
    .from("usuarios").select("tipo").eq("id", user.id).single();
  if (perfil?.tipo !== "prestador") notFound();

  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/auth/login");

  const params = await searchParams;
  const now = new Date();
  const year  = params.anyo ? parseInt(params.anyo) : now.getFullYear();
  const month = params.mes  ? parseInt(params.mes)  : now.getMonth() + 1;

  const [movimientos, resumen] = await Promise.all([
    getMovimientosCaja(prestador.id, year, month),
    getResumenCajaMes(prestador.id, year, month),
  ]);

  async function handleCrearMovimiento(data: FormData) {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return;
    const tipo = data.get("tipo") as "ingreso" | "egreso";
    const categoria = data.get("categoria") as string;
    const concepto  = data.get("concepto")  as string;
    const importe   = parseFloat(data.get("importe") as string);
    const metodo    = (data.get("metodo") as string || "efectivo") as "efectivo" | "tarjeta" | "transferencia" | "bizum" | "otro";
    const fecha     = (data.get("fecha") as string) || new Date().toISOString().slice(0,10);
    if (!tipo || !categoria || !concepto || !importe) return;
    await crearMovimientoCaja({ prestador_id: p.id, tipo, categoria, concepto, importe, metodo, fecha });
  }

  return (
    <CajaClientWrapper
      movimientos={movimientos}
      resumen={resumen}
      year={year}
      month={month}
      onCrearMovimiento={handleCrearMovimiento}
    />
  );
}
