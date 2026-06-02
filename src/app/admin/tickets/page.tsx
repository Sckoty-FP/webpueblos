import { getTickets, crearTicket, cambiarEstadoTicket, asignarTicket } from "@/lib/supabase/queries/admin";
import { revalidatePath } from "next/cache";
import TicketsAdminView from "@/components/admin/tickets/TicketsAdminView";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const tickets = await getTickets();

  async function handleCambiarEstado(fd: FormData) {
    "use server";
    const id     = fd.get("id") as string;
    const estado = fd.get("estado") as string;
    await cambiarEstadoTicket(id, estado);
    revalidatePath("/admin/tickets");
  }

  async function handleCrear(fd: FormData) {
    "use server";
    await crearTicket({
      asunto:       fd.get("asunto") as string,
      descripcion:  fd.get("descripcion") as string,
      prioridad:    (fd.get("prioridad") ?? "media") as never,
      pueblo_id:    fd.get("pueblo_id") ? parseInt(fd.get("pueblo_id") as string) : null,
      prestador_id: (fd.get("prestador_id") as string) || null,
    });
    revalidatePath("/admin/tickets");
  }

  return (
    <TicketsAdminView
      tickets={tickets}
      onCambiarEstado={handleCambiarEstado}
      onCrear={handleCrear}
    />
  );
}
