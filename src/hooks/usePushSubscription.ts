"use client";

import { useCallback, useEffect, useState } from "react";
import { suscribirPushAction, desuscribirPushAction } from "@/lib/push/actions";

/**
 * Hook de suscripción a Web Push para el usuario autenticado.
 *
 * Maneja: detección de soporte, estado del permiso, registro del service worker,
 * suscripción vía PushManager (con la clave pública VAPID) y persistencia en el
 * backend a través de los server actions. Best-effort: nunca lanza al caller.
 */

export type EstadoPush =
  | "no_soportado"   // el navegador no soporta push o falta la clave VAPID
  | "denegado"       // el usuario bloqueó las notificaciones
  | "inactivo"       // soportado pero sin suscripción
  | "activo"         // suscrito y persistido
  | "cargando";      // operación en curso

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Convierte la clave VAPID base64-url a Uint8Array (lo que pide applicationServerKey). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function soportado(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(VAPID_PUBLIC)
  );
}

async function registrarSW(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js");
}

function extraerClaves(sub: PushSubscription) {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  };
}

export function usePushSubscription() {
  const [estado, setEstado] = useState<EstadoPush>("cargando");

  // Estado inicial al montar.
  useEffect(() => {
    if (!soportado()) {
      setEstado("no_soportado");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("denegado");
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready.catch(() => registrarSW());
        const sub = await reg.pushManager.getSubscription();
        if (!cancelado) setEstado(sub ? "activo" : "inactivo");
      } catch {
        if (!cancelado) setEstado("inactivo");
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const activar = useCallback(async () => {
    if (!soportado()) return;
    setEstado("cargando");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "denegado" : "inactivo");
        return;
      }
      const reg = await registrarSW();
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC!) as BufferSource,
        });
      }

      const claves = extraerClaves(sub);
      const res = await suscribirPushAction({ ...claves, userAgent: navigator.userAgent });
      setEstado(res.ok ? "activo" : "inactivo");
    } catch (e) {
      console.error("[push] activar falló:", e);
      setEstado("inactivo");
    }
  }, []);

  const desactivar = useCallback(async () => {
    setEstado("cargando");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await desuscribirPushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("inactivo");
    } catch (e) {
      console.error("[push] desactivar falló:", e);
      setEstado("inactivo");
    }
  }, []);

  return { estado, activar, desactivar };
}
