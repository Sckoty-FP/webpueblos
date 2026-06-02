"use server";

import { createClient } from "@/lib/supabase/server";

export async function registrarInteresPremium(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email inválido");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contactos_recibidos")
    .insert({
      tipo: "premium-interes",
      email,
      mensaje: "Notificar cuando Premium esté disponible",
    });

  if (error) {
    console.error("[registrarInteresPremium]", error);
    throw new Error("No se pudo registrar tu email, intentá de nuevo");
  }
}
