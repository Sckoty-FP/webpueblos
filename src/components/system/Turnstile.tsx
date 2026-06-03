"use client";

import { useEffect, useRef } from "react";

/**
 * Widget de Cloudflare Turnstile (CAPTCHA) para los formularios de auth (SEC-005).
 *
 * Degrada con gracia: si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no está seteada, NO
 * renderiza nada y los forms no exigen token — así el login sigue funcionando
 * hasta que Elias cargue las keys y active el captcha en Supabase Auth.
 *
 * Carga el script oficial bajo demanda (sin dependencias npm). El token de
 * Turnstile es de un solo uso: tras un intento fallido, remontá el widget
 * (cambiá su `key`) para obtener uno nuevo.
 */

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const captchaEnabled = TURNSTILE_SITE_KEY.length > 0;

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

function ensureScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.turnstile) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener("load", () => resolve(), { once: true });
    document.head.appendChild(s);
  });
}

type Props = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
};

export default function Turnstile({ onVerify, onExpire }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!captchaEnabled) return;
    let cancelled = false;

    ensureScript().then(() => {
      if (cancelled || !ref.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => onVerify(token),
        "expired-callback": () => onExpire?.(),
        "error-callback": () => onExpire?.(),
      });
    });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* el widget ya pudo haberse desmontado */
        }
      }
    };
    // Montaje único; el remount para refrescar el token se hace vía `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!captchaEnabled) return null;
  return <div ref={ref} className="my-1 flex justify-center" />;
}
