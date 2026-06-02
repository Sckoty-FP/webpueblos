import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PrestadorDB } from "@/types";
import type { PanelPrestador } from "./panel";
import type { PrestadorStaffDB, RolPanel } from "@/types/equipo";

// ─── Tipos locales ────────────────────────────────────────────────────────────

export interface StaffConUsuario extends PrestadorStaffDB {
  usuario: { nombre: string; email: string; avatar_url: string | null } | null;
}

export interface PrestadorConRol {
  prestador: PanelPrestador;
  rol: RolPanel;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Devuelve todos los staff (activos, pendientes e histórico) de un prestador. */
export async function getStaffDelPrestador(prestadorId: string): Promise<StaffConUsuario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestador_staff")
    .select(`
      id, prestador_id, usuario_id, email_invitado, nombre_invitado,
      rol, activo, invitado_por, fecha_alta, fecha_baja,
      token, expira_en, notas, created_at, updated_at,
      usuario:usuarios(nombre, email, avatar_url)
    `)
    .eq("prestador_id", prestadorId)
    .order("fecha_alta", { ascending: false });

  if (error || !data) return [];
  return data as unknown as StaffConUsuario[];
}

/**
 * Invita a un encargado al negocio.
 * - Si el email ya existe en `usuarios` → alta directa (activo=true)
 * - Si no existe → crea registro pendiente con token de invitación
 */
export async function invitarEncargado(
  prestadorId: string,
  email: string,
  nombre?: string,
): Promise<{ ok: boolean; pendiente: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, pendiente: false, error: "No autenticado" };

  // Verificar si el email ya está registrado
  const { data: existente } = await supabase
    .from("usuarios")
    .select("id, tipo")
    .eq("email", email)
    .maybeSingle();

  if (existente) {
    // Alta directa
    const { error } = await supabase.from("prestador_staff").insert({
      prestador_id:  prestadorId,
      usuario_id:    existente.id,
      nombre_invitado: nombre ?? null,
      rol:           "encargado",
      activo:        true,
      invitado_por:  user.id,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, pendiente: false, error: "Este usuario ya es encargado del negocio" };
      return { ok: false, pendiente: false, error: error.message };
    }
    // Actualizar tipo en usuarios si es básico
    if (existente.tipo === "basico") {
      await supabase.from("usuarios").update({ tipo: "encargado" }).eq("id", existente.id);
    }
    return { ok: true, pendiente: false };
  }

  // Invitación pendiente
  const { data: invitacion, error } = await supabase
    .from("prestador_staff")
    .insert({
      prestador_id:    prestadorId,
      email_invitado:  email,
      nombre_invitado: nombre ?? null,
      rol:             "encargado",
      activo:          false,
      invitado_por:    user.id,
    })
    .select("token")
    .single();

  if (error) return { ok: false, pendiente: true, error: error.message };

  // Enviar email (best-effort)
  await enviarEmailInvitacion(email, nombre, prestadorId, invitacion.token).catch(console.error);

  return { ok: true, pendiente: true };
}

/** Desactiva un encargado (soft delete — mantiene auditoría). */
export async function darDeBajaEncargado(staffId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prestador_staff")
    .update({ activo: false, fecha_baja: new Date().toISOString() })
    .eq("id", staffId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Acepta una invitación por token. Activa el registro y asigna el usuario. */
export async function aceptarInvitacion(token: string): Promise<{ ok: boolean; prestadorId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión primero" };

  const { data: invitacion, error: errBuscar } = await supabase
    .from("prestador_staff")
    .select("id, prestador_id, expira_en, activo, usuario_id")
    .eq("token", token)
    .maybeSingle();

  if (errBuscar || !invitacion) return { ok: false, error: "Invitación no encontrada o expirada" };
  if (invitacion.activo)                 return { ok: false, error: "Esta invitación ya fue aceptada" };
  if (invitacion.usuario_id)             return { ok: false, error: "Esta invitación ya tiene un usuario asignado" };
  if (new Date(invitacion.expira_en) < new Date()) return { ok: false, error: "La invitación expiró. Pedile al propietario que te reenvíe la invitación." };

  const { error: errUpdate } = await supabase
    .from("prestador_staff")
    .update({ usuario_id: user.id, activo: true, token: null })
    .eq("id", invitacion.id);

  if (errUpdate) return { ok: false, error: errUpdate.message };

  await supabase.from("usuarios").update({ tipo: "encargado" }).eq("id", user.id);

  return { ok: true, prestadorId: invitacion.prestador_id };
}

/**
 * Encuentra el prestador al que pertenece el usuario como encargado activo.
 * Wrapped en React.cache para deduplicar en el mismo render.
 */
export const getPrestadorComoEncargado = cache(async (): Promise<PanelPrestador | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staff } = await supabase
    .from("prestador_staff")
    .select("prestador_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!staff) return null;

  const { data, error } = await supabase
    .from("prestadores")
    .select(`
      id, pueblo_id, nombre, slug, descripcion, descripcion_corta,
      email, telefono, whatsapp, web, instagram, facebook, tiktok,
      direccion, imagen_portada_url, galeria_urls,
      verificado, activo, destacado, rating_promedio, total_reviews,
      total_reservas, total_visualizaciones,
      suscripcion_plan, suscripcion_estado, tipo_cocina, created_at,
      servicios(id, nombre, slug, descripcion, categoria, precio_desde, precio_hasta, precio_unidad, reservable, duracion_minutos, capacidad_maxima, descuento_premium_porcentaje, descuento_premium_descripcion, activo, orden_visualizacion),
      horarios(dia_semana, hora_apertura, hora_cierre, cerrado, notas)
    `)
    .eq("id", staff.prestador_id)
    .single();

  if (error || !data) return null;
  return data as unknown as PanelPrestador;
});

// ─── Email helper ─────────────────────────────────────────────────────────────

async function enviarEmailInvitacion(
  email: string,
  nombre: string | undefined,
  prestadorId: string,
  token: string,
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[equipo] SENDGRID_API_KEY no configurado — invitación creada sin email");
    console.info(`[equipo] Link invitación: ${process.env.NEXT_PUBLIC_APP_URL}/auth/invitacion?token=${token}`);
    return;
  }

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invitacion?token=${token}`;
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";

  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: "noreply@puebloapp.es", name: "PUEBLO" },
      subject: "Te invitaron a gestionar un negocio en PUEBLO",
      content: [{
        type: "text/html",
        value: `
          <p>${saludo}</p>
          <p>Te invitaron como encargado de un negocio en la plataforma PUEBLO.</p>
          <p>Hacé clic en el siguiente botón para aceptar la invitación:</p>
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#0070cc;color:white;border-radius:999px;text-decoration:none;font-weight:700;">
            Aceptar invitación
          </a>
          <p style="color:#6b6b6b;font-size:12px;margin-top:16px;">Este link expira en 7 días.</p>
        `,
      }],
    }),
  });
}
