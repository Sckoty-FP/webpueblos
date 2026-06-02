"use client";

import { useEffect, useRef } from "react";
import { upsertUbicacionAction } from "@/app/repartidor/actions";

const INTERVALO_MS = 60_000; // 60 segundos

/**
 * Publica la ubicación del repartidor al servidor cada 60 s mientras está en turno.
 * - Usa watchPosition para mantener la posición actualizada en memoria.
 * - Publica solo cuando el documento es visible y hay una posición válida.
 * - Se desactiva automáticamente cuando enTurno es false.
 */
export function usePosicionRepartidor(enTurno: boolean) {
  const posRef      = useRef<GeolocationPosition | null>(null);
  const watchIdRef  = useRef<number | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enTurno || typeof navigator === "undefined" || !navigator.geolocation) return;

    // Mantener posición actualizada en memoria
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { posRef.current = pos; },
      () => { /* silenciar errores de geolocalización */ },
      { enableHighAccuracy: true, timeout: 10_000 },
    );

    // Publicar cada 60 s mientras el documento esté visible
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      const pos = posRef.current;
      if (!pos) return;
      const bateria = (navigator as Navigator & { getBattery?: () => Promise<{ level: number }> }).getBattery;
      if (bateria) {
        bateria().then((b) => {
          void upsertUbicacionAction(pos.coords.latitude, pos.coords.longitude, Math.round(b.level * 100));
        }).catch(() => {
          void upsertUbicacionAction(pos.coords.latitude, pos.coords.longitude);
        });
      } else {
        void upsertUbicacionAction(pos.coords.latitude, pos.coords.longitude);
      }
    }, INTERVALO_MS);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current !== null) clearInterval(timerRef.current);
      watchIdRef.current = null;
      timerRef.current   = null;
      posRef.current     = null;
    };
  }, [enTurno]);
}
