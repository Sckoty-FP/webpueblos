import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTicketConMensajes, cambiarEstadoTicket, responderTicket } from "@/lib/supabase/queries/admin";
import TicketDetalleView from "@/components/admin/tickets/TicketDetalleView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminTicketDetallePage({ params }: Props) {
  const { id } = await params;
  const { ticket, mensajes } = await getTicketConMensajes(id);
  if (!ticket) notFound();

  async function handleCambiarEstado(fd: FormData) {
    "use server";
    const estado = fd.get("estado") as string;
    await cambiarEstadoTicket(id, estado);
    revalidatePath(`/admin/tickets/${id}`);
    revalidatePath("/admin/tickets");
  }

  async function handleResponder(fd: FormData) {
    "use server";
    const cuerpo  = fd.get("cuerpo") as string;
    const interno = fd.get("interno") === "true";
    if (!cuerpo?.trim()) return;
    await responderTicket(id, cuerpo.trim(), interno);
    revalidatePath(`/admin/tickets/${id}`);
  }

  return (
    <TicketDetalleView
      ticket={ticket}
      mensajes={mensajes}
      onCambiarEstado={handleCambiarEstado}
      onResponder={handleResponder}
    />
  );
}
