"use client";

import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

/**
 * Botón para activar/desactivar las notificaciones push del usuario.
 * Se adapta al estado real del navegador (soporte, permiso, suscripción).
 *
 * Colocalo donde el usuario tenga contexto: panel del negocio (avisos de
 * pedidos), panel del guía (inscripciones), admin (tickets), perfil (cliente).
 */
export default function ActivarNotificaciones({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { estado, activar, desactivar } = usePushSubscription();

  // No tiene sentido mostrar nada si el navegador no soporta push.
  if (estado === "no_soportado") return null;

  const base =
    "inline-flex items-center gap-2 rounded-xl text-sm font-semibold transition disabled:opacity-60";
  const size = compact ? "px-3 py-1.5" : "px-4 py-2.5";

  if (estado === "cargando") {
    return (
      <button disabled className={`${base} ${size} bg-fog text-gray-500 ${className}`}>
        <Loader2 size={16} className="animate-spin" />
        {!compact && "Un momento…"}
      </button>
    );
  }

  if (estado === "denegado") {
    return (
      <span
        className={`${base} ${size} bg-fog text-gray-500 ${className}`}
        title="Las notificaciones están bloqueadas. Habilitalas desde los ajustes del navegador."
      >
        <BellOff size={16} />
        {!compact && "Notificaciones bloqueadas"}
      </span>
    );
  }

  if (estado === "activo") {
    return (
      <button
        onClick={desactivar}
        className={`${base} ${size} bg-primary/10 text-primary hover:bg-primary/15 ${className}`}
      >
        <BellRing size={16} />
        {compact ? "Activadas" : "Notificaciones activadas"}
      </button>
    );
  }

  // inactivo
  return (
    <button
      onClick={activar}
      className={`${base} ${size} bg-primary text-white hover:bg-primary/90 ${className}`}
    >
      <Bell size={16} />
      {compact ? "Activar" : "Activar notificaciones"}
    </button>
  );
}
