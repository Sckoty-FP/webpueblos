import { redirect } from "next/navigation";

/**
 * Módulo "Mesas" DESACTIVADO (decisión 2026-06-03).
 *
 * Motivo: el restaurante gestiona sus propias mesas; la gestión de mesas + QR de
 * carta-en-mesa se retomará cuando construyamos el ERP propio. El ítem ya no aparece
 * en el nav del panel (ver `lib/panel/modules.ts`: `mesas: false`). Este stub cubre el
 * acceso directo por URL redirigiendo al panel.
 *
 * La implementación NO se perdió: la UI vive en
 * `components/sections/panel/mesas/MesasView.tsx` y las queries en
 * `lib/supabase/queries/mesas.ts`. Para reactivar, restaurar el page anterior
 * (fetch de mesas + generación de QR server-side) y poner `mesas: tieneMesas` en modules.ts.
 */
export default function PanelMesasPage() {
  redirect("/panel");
}
