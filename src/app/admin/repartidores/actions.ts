"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/require-admin";

export async function crearRepartidorAction(fd: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();   // SEC-001: service-role gateado por rol, no por el layout
  const nombre    = (fd.get("nombre")   as string)?.trim();
  const email     = (fd.get("email")    as string)?.trim();
  const password  = (fd.get("password") as string)?.trim();
  const pueblo_id = parseInt(fd.get("pueblo_id") as string);
  const vehiculo  = (fd.get("vehiculo") as string) || "moto";
  const dni_nif   = (fd.get("dni_nif")  as string)?.trim() || null;
  const telefono  = (fd.get("telefono") as string)?.trim() || null;
  const iban      = (fd.get("iban")     as string)?.trim() || null;
  const licencia  = fd.get("licencia") as File | null;

  if (!nombre || !email || !password || !pueblo_id) {
    return { ok: false, error: "Nombre, email, contraseña y pueblo son obligatorios." };
  }

  const admin = createAdminClient();

  // 1. Crear usuario en Supabase Auth (auto-confirm email)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (authError || !authData.user) {
    return { ok: false, error: authError?.message ?? "Error al crear el usuario." };
  }

  const userId = authData.user.id;

  // 2. El trigger on_auth_user_created ya insertó en public.usuarios.
  //    Solo actualizamos los campos extra que el trigger no conoce.
  const supabase = await createClient();
  await supabase
    .from("usuarios")
    .update({ nombre, tipo: "repartidor" })
    .eq("id", userId);

  // 3. Subir licencia si se adjuntó
  let licencia_url: string | null = null;
  if (licencia && licencia.size > 0) {
    const ext      = licencia.name.split(".").pop() ?? "pdf";
    const path     = `repartidores/${userId}/licencia.${ext}`;
    const arrayBuf = await licencia.arrayBuffer();

    const { error: upErr } = await admin.storage
      .from("documentos-privados")
      .upload(path, arrayBuf, { contentType: licencia.type, upsert: true });

    if (!upErr) {
      const { data: urlData } = admin.storage
        .from("documentos-privados")
        .getPublicUrl(path);
      licencia_url = urlData.publicUrl;
    }
  }

  // 4. Crear fila en repartidores
  const { error: repErr } = await supabase
    .from("repartidores")
    .insert({
      usuario_id:          userId,
      pueblo_id,
      vehiculo,
      dni_nif,
      iban_pago:           iban,
      telefono_emergencia: telefono,
      activo:              true,
      en_turno:            false,
      ...(licencia_url ? { licencia_url } : {}),
    });

  if (repErr) {
    // Rollback: eliminar el auth user para no dejar datos huérfanos
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: repErr.message };
  }

  revalidatePath("/admin/repartidores");
  return { ok: true };
}

/**
 * Vincula un usuario EXISTENTE de Supabase Auth como repartidor.
 * Útil cuando el usuario ya tiene cuenta y solo falta el registro de repartidor.
 */
export async function vincularRepartidorAction(
  usuarioId: string,
  puebloId: number,
  vehiculo: string = "moto",
): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();   // SEC-001
  if (!usuarioId || !puebloId) return { ok: false, error: "usuario_id y pueblo_id son obligatorios." };

  const supabase = await createClient();

  // Verificar que no exista ya un repartidor para este usuario
  const { data: existing } = await supabase
    .from("repartidores")
    .select("id")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (existing) return { ok: false, error: "Este usuario ya tiene un registro de repartidor." };

  const { error } = await supabase
    .from("repartidores")
    .insert({ usuario_id: usuarioId, pueblo_id: puebloId, vehiculo, activo: true, en_turno: false });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/repartidores");
  return { ok: true };
}

/**
 * Avanza un pedido de delivery a un estado específico (admin override, bypasa RLS del prestador).
 * Solo disponible para super_admin. Útil para testing y soporte.
 */
export async function adminAvanzarPedidoAction(
  pedidoId: string,
  nuevoEstado: string,
  repartidorId?: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();   // SEC-001: antes solo lo decía el comentario, ahora se impone
  const admin = createAdminClient();

  const updateData: Record<string, string> = { estado: nuevoEstado };
  if (repartidorId) updateData.repartidor_id = repartidorId;

  const { error } = await admin
    .from("pedidos_delivery")
    .update(updateData)
    .eq("id", pedidoId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function editarRepartidorAction(fd: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();   // SEC-001
  const id        = fd.get("id")        as string;
  const nombre    = (fd.get("nombre")   as string)?.trim();
  const pueblo_id = parseInt(fd.get("pueblo_id") as string);
  const vehiculo  = (fd.get("vehiculo") as string) || "moto";
  const dni_nif   = (fd.get("dni_nif")  as string)?.trim() || null;
  const telefono  = (fd.get("telefono") as string)?.trim() || null;
  const iban      = (fd.get("iban")     as string)?.trim() || null;
  const temporada = (fd.get("temporada") as string)?.trim() || null;
  const usuario_id = fd.get("usuario_id") as string;
  const licencia  = fd.get("licencia") as File | null;

  if (!id || !nombre || !pueblo_id) {
    return { ok: false, error: "Nombre y pueblo son obligatorios." };
  }

  const supabase = await createClient();
  const admin    = createAdminClient();

  // Actualizar nombre en usuarios
  const { error: uErr } = await supabase
    .from("usuarios")
    .update({ nombre })
    .eq("id", usuario_id);
  if (uErr) return { ok: false, error: uErr.message };

  // Subir nueva licencia si se adjuntó
  if (licencia && licencia.size > 0) {
    const ext      = licencia.name.split(".").pop() ?? "pdf";
    const path     = `repartidores/${usuario_id}/licencia.${ext}`;
    const arrayBuf = await licencia.arrayBuffer();
    await admin.storage
      .from("documentos-privados")
      .upload(path, arrayBuf, { contentType: licencia.type, upsert: true });
  }

  // Actualizar repartidor
  const { error: rErr } = await supabase
    .from("repartidores")
    .update({
      pueblo_id,
      vehiculo,
      dni_nif,
      iban_pago:           iban,
      telefono_emergencia: telefono,
      temporada_actual:    temporada,
    })
    .eq("id", id);

  if (rErr) return { ok: false, error: rErr.message };

  revalidatePath("/admin/repartidores");
  return { ok: true };
}
