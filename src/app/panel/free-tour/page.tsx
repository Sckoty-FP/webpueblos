import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrestadorDelUsuario } from "@/lib/supabase/queries/panel";
import type { DificultadFreeTour } from "@/types/free-tour";
import {
  getToursDelPrestador,
  getSesionesDelPrestador,
  getInscripcionesDelPrestador,
  getComisionesDelPrestador,
  crearTour,
  actualizarTour,
  toggleTourActivo,
  crearSesion,
  crearSesionesBulk,
  cancelarSesion,
  actualizarEstadoInscripcion,
  activarFreeTour,
} from "@/lib/supabase/queries/free-tour";
import FreeTourView from "@/components/sections/panel/free-tour/FreeTourView";
import type { EstadoInscripcionFreeTour } from "@/types/free-tour";

export default async function FreeTourPage() {
  const prestador = await getPrestadorDelUsuario();
  if (!prestador) redirect("/panel");

  const servicios = prestador.servicios ?? [];
  const esTourGuiado = servicios.some((s) => s.categoria === "tour_guiado");
  if (!esTourGuiado) redirect("/panel");

  const hoy = new Date().toISOString().split("T")[0];
  const en30dias = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [tours, sesiones, inscripciones, comisiones] = await Promise.all([
    getToursDelPrestador(prestador.id),
    getSesionesDelPrestador(prestador.id, hoy, en30dias),
    getInscripcionesDelPrestador(prestador.id),
    getComisionesDelPrestador(prestador.id),
  ]);

  // ── Server Actions ──────────────────────────────────────────────────────

  async function handleActivar(fd: FormData) {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return;
    const activo = fd.get("activo") === "true";
    await activarFreeTour(p.id, activo);
  }

  async function handleCrearTour(fd: FormData) {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return;
    const slug = (fd.get("slug") as string).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    await crearTour(p.id, p.pueblo_id!, {
      titulo: fd.get("titulo") as string,
      slug,
      descripcion: fd.get("descripcion") as string,
      descripcion_corta: (fd.get("descripcion_corta") as string) || null,
      idiomas: (fd.get("idiomas") as string).split(",").filter(Boolean),
      duracion_minutos: parseInt(fd.get("duracion_minutos") as string) || 90,
      distancia_km: fd.get("distancia_km") ? parseFloat(fd.get("distancia_km") as string) : null,
      dificultad: ((fd.get("dificultad") as string) || "facil") as DificultadFreeTour,
      punto_encuentro_nombre: (fd.get("punto_encuentro_nombre") as string) || null,
      cupo_maximo: parseInt(fd.get("cupo_maximo") as string) || 20,
      incluye: (fd.get("incluye") as string).split(",").map((s) => s.trim()).filter(Boolean),
      llevar: (fd.get("llevar") as string).split(",").map((s) => s.trim()).filter(Boolean),
      observaciones: (fd.get("observaciones") as string) || null,
    });
  }

  async function handleActualizarTour(fd: FormData) {
    "use server";
    const tourId = fd.get("tour_id") as string;
    await actualizarTour(tourId, {
      titulo: fd.get("titulo") as string,
      descripcion: fd.get("descripcion") as string,
      descripcion_corta: (fd.get("descripcion_corta") as string) || null,
      idiomas: (fd.get("idiomas") as string).split(",").filter(Boolean),
      duracion_minutos: parseInt(fd.get("duracion_minutos") as string) || 90,
      distancia_km: fd.get("distancia_km") ? parseFloat(fd.get("distancia_km") as string) : null,
      dificultad: ((fd.get("dificultad") as string) || "facil") as DificultadFreeTour,
      punto_encuentro_nombre: (fd.get("punto_encuentro_nombre") as string) || null,
      cupo_maximo: parseInt(fd.get("cupo_maximo") as string) || 20,
      incluye: (fd.get("incluye") as string).split(",").map((s) => s.trim()).filter(Boolean),
      llevar: (fd.get("llevar") as string).split(",").map((s) => s.trim()).filter(Boolean),
      observaciones: (fd.get("observaciones") as string) || null,
    });
  }

  async function handleToggleTour(fd: FormData) {
    "use server";
    const tourId = fd.get("tour_id") as string;
    const activo = fd.get("activo") === "true";
    await toggleTourActivo(tourId, activo);
  }

  async function handleCrearSesionUnica(fd: FormData) {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return;
    await crearSesion({
      tour_id: fd.get("tour_id") as string,
      prestador_id: p.id,
      pueblo_id: p.pueblo_id!,
      fecha: fd.get("fecha") as string,
      hora: fd.get("hora") as string,
      cupo_sesion: parseInt(fd.get("cupo_sesion") as string) || 20,
    });
  }

  async function handleCrearSesionesRecurrentes(fd: FormData) {
    "use server";
    const p = await getPrestadorDelUsuario();
    if (!p) return;
    const tourId = fd.get("tour_id") as string;
    const hora = fd.get("hora") as string;
    const cupo = parseInt(fd.get("cupo_sesion") as string) || 20;
    const desde = new Date(fd.get("fecha_desde") as string);
    const hasta = new Date(fd.get("fecha_hasta") as string);
    const diasStr = fd.get("dias_semana") as string;
    const dias = diasStr.split(",").map(Number).filter((n) => !isNaN(n));

    const sesiones: Array<{ tour_id: string; prestador_id: string; pueblo_id: number; fecha: string; hora: string; cupo_sesion: number }> = [];
    const cur = new Date(desde);
    while (cur <= hasta) {
      if (dias.includes(cur.getDay())) {
        sesiones.push({
          tour_id: tourId,
          prestador_id: p.id,
          pueblo_id: p.pueblo_id!,
          fecha: cur.toISOString().split("T")[0],
          hora,
          cupo_sesion: cupo,
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
    if (sesiones.length > 0) await crearSesionesBulk(sesiones);
  }

  async function handleCancelarSesion(fd: FormData) {
    "use server";
    const sesionId = fd.get("sesion_id") as string;
    const motivo = (fd.get("motivo") as string) || undefined;
    await cancelarSesion(sesionId, motivo);
  }

  async function handleActualizarInscripcion(fd: FormData) {
    "use server";
    const inscripcionId = fd.get("inscripcion_id") as string;
    const estado = fd.get("estado") as EstadoInscripcionFreeTour;
    await actualizarEstadoInscripcion(inscripcionId, estado);
  }

  return (
    <FreeTourView
      freeTourActivo={prestador.free_tour_activo ?? false}
      tours={tours}
      sesiones={sesiones}
      inscripciones={inscripciones}
      comisiones={comisiones.pendientes}
      totalPendiente={comisiones.totalPendiente}
      totalFacturado={comisiones.totalFacturado}
      onActivar={handleActivar}
      onCrearTour={handleCrearTour}
      onActualizarTour={handleActualizarTour}
      onToggleTour={handleToggleTour}
      onCrearSesionUnica={handleCrearSesionUnica}
      onCrearSesionesRecurrentes={handleCrearSesionesRecurrentes}
      onCancelarSesion={handleCancelarSesion}
      onActualizarInscripcion={handleActualizarInscripcion}
    />
  );
}
