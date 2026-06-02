"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { readConsent, acceptAll, rejectAll } from "@/lib/consent/consent-store";
import { emitConsentChange } from "@/lib/consent/consent-events";
import CookieSettingsModal from "./CookieSettingsModal";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);

    function onOpen() {
      setModalOpen(true);
    }
    window.addEventListener("pueblo:cookies:open", onOpen);
    return () => window.removeEventListener("pueblo:cookies:open", onOpen);
  }, []);

  function handleAcceptAll() {
    const state = acceptAll();
    emitConsentChange(state);
    setVisible(false);
  }

  function handleRejectAll() {
    const state = rejectAll();
    emitConsentChange(state);
    setVisible(false);
  }

  function handleCustomize() {
    setModalOpen(true);
  }

  if (!visible && !modalOpen) return null;

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-desc"
          className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-md z-[60] bg-white border border-divisor rounded-[20px] shadow-2xl p-5 md:p-6"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cookie size={18} strokeWidth={1.5} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="cookie-title"
                className="font-fraunces font-semibold text-base text-text-body mb-1"
              >
                Usamos cookies
              </h2>
              <p
                id="cookie-desc"
                className="font-barlow text-sm text-text-muted leading-relaxed"
              >
                Las imprescindibles para que el sitio funcione. Las analíticas y de
                marketing son opcionales. Puedes cambiar tu decisión cuando quieras.{" "}
                <Link href="/cookies" className="text-primary hover:underline">
                  Saber más
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={handleRejectAll}
              className="flex-1 font-barlow font-bold text-sm border-2 border-text-body text-text-body bg-white hover:bg-fog rounded-full px-4 py-2.5"
            >
              Rechazar
            </button>
            <button
              onClick={handleCustomize}
              className="flex-1 font-barlow font-medium text-sm border border-divisor text-text-muted bg-white hover:bg-fog rounded-full px-4 py-2.5"
            >
              Personalizar
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 font-barlow font-bold text-sm bg-primary hover:bg-primary-hover text-white rounded-full px-4 py-2.5"
            >
              Aceptar todo
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <CookieSettingsModal
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            setVisible(false);
          }}
        />
      )}
    </>
  );
}
