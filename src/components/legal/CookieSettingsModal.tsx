"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CATEGORIES, type ConsentCategory } from "@/lib/consent/consent-categories";
import { readConsent, saveConsent, type ConsentState } from "@/lib/consent/consent-store";
import { emitConsentChange } from "@/lib/consent/consent-events";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function CookieSettingsModal({ onClose, onSaved }: Props) {
  const [state, setState] = useState<ConsentState>(() => {
    const c = readConsent();
    return c?.state ?? { necessary: true, analytics: false, marketing: false };
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(id: ConsentCategory) {
    if (id === "necessary") return;
    setState(s => ({ ...s, [id]: !s[id] }));
  }

  function handleSave() {
    const final = saveConsent(state);
    emitConsentChange(final.state);
    onSaved();
  }

  function handleAcceptAll() {
    const final = saveConsent({ necessary: true, analytics: true, marketing: true });
    emitConsentChange(final.state);
    onSaved();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center"
    >
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full md:max-w-lg bg-white rounded-t-[20px] md:rounded-[20px] p-6 md:p-7 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="cookie-modal-title"
            className="font-fraunces font-semibold text-xl text-text-body"
          >
            Preferencias de cookies
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-full hover:bg-fog flex items-center justify-center"
          >
            <X size={18} strokeWidth={1.5} className="text-text-muted" />
          </button>
        </div>

        <p className="font-barlow text-sm text-text-muted mb-5">
          Elige qué categorías de cookies quieres permitir. Podrás cambiar tu decisión en
          cualquier momento desde el footer.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="bg-fog rounded-[12px] p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="font-barlow font-semibold text-sm text-text-body">
                  {cat.label}
                </h3>
                <Toggle
                  checked={state[cat.id]}
                  disabled={cat.required}
                  onChange={() => toggle(cat.id)}
                  label={cat.label}
                />
              </div>
              <p className="font-barlow text-xs text-text-muted leading-relaxed">
                {cat.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            onClick={handleSave}
            className="flex-1 font-barlow font-medium text-sm border border-divisor text-text-body bg-white hover:bg-fog rounded-full px-4 py-2.5"
          >
            Guardar mi elección
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 font-barlow font-bold text-sm bg-primary hover:bg-primary-hover text-white rounded-full px-4 py-2.5"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={`Activar/desactivar ${label}`}
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        disabled
          ? "bg-divisor cursor-not-allowed"
          : checked
            ? "bg-primary"
            : "bg-divisor"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
