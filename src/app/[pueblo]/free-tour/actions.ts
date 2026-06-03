"use server";

import { createClient } from "@/lib/supabase/server";
import { crearInscripcionPublica } from "@/lib/supabase/queries/free-tour";
import { notificarGuiaInscripcion } from "@/lib/push/notificar-eventos";
import { rateLimit } from "@/lib/rate-limit";
import { PUBLIC_SIGNUP } from "@/lib/rate-limit/policies";

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[free-tour] SENDGRID_API_KEY no configurada — email no enviado");
    return;
  }
  await fetch(SENDGRID_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: "noreply@pueblo.app", name: "PUEBLO" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });
}

export async function inscribirseAction(fd: FormData): Promise<{
  ok: boolean;
  numero?: string;
  error?: string;
}> {
  const rl = await rateLimit("free-tour", PUBLIC_SIGNUP);
  if (!rl.ok) {
    return { ok: false, error: `Demasiados intentos. Probá de nuevo en ${rl.resetSec}s.` };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const sesionId   = fd.get("sesion_id") as string;
  const tourId     = fd.get("tour_id") as string;
  const prestadorId = fd.get("prestador_id") as string;
  const nombre     = (fd.get("nombre") as string).trim();
  const email      = (fd.get("email") as string).trim().toLowerCase();
  const telefono   = (fd.get("telefono") as string)?.trim() || null;
  const numPersonas = parseInt(fd.get("num_personas") as string) || 1;
  const notas      = (fd.get("notas") as string)?.trim() || null;

  // Datos de la sesión para el email de confirmación
  const fecha = fd.get("sesion_fecha") as string;
  const hora  = fd.get("sesion_hora") as string;
  const tourTitulo = fd.get("tour_titulo") as string;
  const puntoEncuentro = fd.get("punto_encuentro") as string | null;

  try {
    const inscripcion = await crearInscripcionPublica({
      sesion_id:      sesionId,
      tour_id:        tourId,
      prestador_id:   prestadorId,
      cliente_id:     user?.id ?? null,
      nombre_cliente: nombre,
      email_cliente:  email,
      telefono_cliente: telefono,
      num_personas:   numPersonas,
      notas,
    });

    // Email de confirmación al cliente
    const fechaFormateada = new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long",
    });
    const emailCliente = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f1f1f">
        <div style="background:#000;padding:24px 32px;text-align:center">
          <h1 style="color:#fff;font-size:22px;margin:0;font-weight:600">PUEBLO</h1>
        </div>
        <div style="padding:32px">
          <h2 style="font-size:20px;font-weight:600;margin:0 0 12px">¡Inscripción confirmada!</h2>
          <p style="color:#6b6b6b;margin:0 0 24px">Hola <strong>${nombre}</strong>, tu plaza está reservada.</p>
          <div style="background:#f5f7fa;border-radius:12px;padding:20px;margin-bottom:24px">
            <div style="margin-bottom:10px"><strong>${tourTitulo}</strong></div>
            <div style="color:#6b6b6b;font-size:14px;line-height:1.8">
              📅 ${fechaFormateada} a las ${hora.slice(0, 5)}<br>
              👥 ${numPersonas} ${numPersonas === 1 ? "persona" : "personas"}<br>
              ${puntoEncuentro ? `📍 Punto de encuentro: ${puntoEncuentro}<br>` : ""}
              🎫 Número: <strong style="font-family:monospace">${inscripcion.numero}</strong>
            </div>
          </div>
          <p style="font-size:13px;color:#6b6b6b;background:#fff3cd;border-radius:8px;padding:12px">
            💡 Es un free tour: no pagás nada por adelantado. Al final, le dás al guía lo que consideres.
          </p>
          <p style="font-size:13px;color:#6b6b6b;margin-top:16px">
            Si no podés asistir, cancelá con antelación para liberar tu plaza a otras personas.
          </p>
        </div>
        <div style="border-top:1px solid #f3f3f3;padding:16px 32px;text-align:center;font-size:12px;color:#6b6b6b">
          PUEBLO · La plataforma del comercio local
        </div>
      </div>
    `;

    await sendEmail(email, `Inscripción confirmada — ${tourTitulo}`, emailCliente);

    // Avisar al guía (propietario del prestador) de la nueva inscripción.
    const { data: prestador } = await supabase
      .from("prestadores")
      .select("propietario_id")
      .eq("id", prestadorId)
      .maybeSingle();
    if (prestador?.propietario_id) {
      await notificarGuiaInscripcion(prestador.propietario_id, tourTitulo, numPersonas, fecha);
    }

    return { ok: true, numero: inscripcion.numero };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Cupo agotado")) {
      return { ok: false, error: "Lo sentimos, la sesión se ha completado mientras completabas el formulario." };
    }
    if (msg.includes("unique") || msg.includes("idx_inscripcion_email_sesion")) {
      return { ok: false, error: "Ya existe una inscripción confirmada para este email en esta sesión." };
    }
    return { ok: false, error: "No se pudo procesar la inscripción. Intentalo de nuevo." };
  }
}
