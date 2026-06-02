"use client";

import { useState, useTransition } from "react";
import { enviarContacto, type ContactoResult } from "@/app/contacto/actions";
import { Send, CheckCircle2 } from "lucide-react";

const TIPOS = [
  { value: "negocio", label: "Tengo un negocio" },
  { value: "ayuntamiento", label: "Soy del ayuntamiento" },
  { value: "interesado_pueblo", label: "Quiero PUEBLO en mi pueblo" },
  { value: "turista", label: "Soy turista / usuario" },
  { value: "otro", label: "Otro" },
] as const;

type TipoValue = (typeof TIPOS)[number]["value"];

interface Props {
  tipoInicial: TipoValue;
}

export default function ContactoForm({ tipoInicial }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ContactoResult | null>(null);
  const [tipo, setTipo] = useState<string>(tipoInicial);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const r = await enviarContacto(formData);
      setResult(r);
      if (r.ok) {
        (document.getElementById("contacto-form") as HTMLFormElement | null)?.reset();
        setTipo(tipoInicial);
      }
    });
  }

  if (result?.ok) {
    return (
      <div className="bg-surface-dark border border-white/8 rounded-card-lg p-8 lg:p-12 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mb-5">
          <CheckCircle2 size={28} strokeWidth={1.5} />
        </div>
        <h2 className="font-fraunces text-2xl font-semibold text-white mb-2">
          ¡Mensaje enviado!
        </h2>
        <p className="font-barlow text-base text-white/70 mb-6 max-w-md">
          Recibimos tu mensaje y te contestamos en menos de 24h hábiles.
        </p>
        <button
          onClick={() => setResult(null)}
          className="font-barlow text-sm text-primary hover:underline"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;

  return (
    <form
      id="contacto-form"
      action={onSubmit}
      className="bg-surface-dark border border-white/8 rounded-card-lg p-6 md:p-8 space-y-5"
    >
      {/* Honeypot anti-spam */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
        aria-hidden="true"
      />

      <div className="grid md:grid-cols-2 gap-5">
        <Field
          label="Tu nombre *"
          name="nombre"
          type="text"
          required
          fieldError={fieldErrors?.nombre?.[0]}
        />
        <Field
          label="Email *"
          name="email"
          type="email"
          required
          fieldError={fieldErrors?.email?.[0]}
        />
      </div>

      <Field
        label="Teléfono"
        name="telefono"
        type="tel"
        fieldError={fieldErrors?.telefono?.[0]}
      />

      {/* Tipo */}
      <div>
        <label className="block font-barlow text-sm text-white/85 mb-2">Soy *</label>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <label key={t.value} className="cursor-pointer">
              <input
                type="radio"
                name="tipo"
                value={t.value}
                checked={tipo === t.value}
                onChange={(e) => setTipo(e.target.value)}
                className="sr-only peer"
              />
              <span className="block font-barlow text-sm px-4 py-2 rounded-pill border-2 border-white/15 text-white/85 peer-checked:border-primary peer-checked:bg-primary/15 peer-checked:text-white transition-colors duration-150 select-none">
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Campo pueblo solo para ayuntamiento / interesado_pueblo */}
      {(tipo === "ayuntamiento" || tipo === "interesado_pueblo") && (
        <Field
          label="¿Qué pueblo?"
          name="pueblo_interes"
          type="text"
          placeholder="Ej: Peñíscola"
        />
      )}

      <div>
        <label htmlFor="mensaje" className="block font-barlow text-sm text-white/85 mb-2">
          Mensaje *
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          rows={5}
          className="w-full bg-black border border-white/15 rounded-card px-4 py-3 font-barlow text-base text-white placeholder:text-white/35 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 resize-y"
          placeholder="Contanos qué necesitás o qué te interesaría saber…"
        />
        {fieldErrors?.mensaje?.[0] && (
          <p className="font-barlow text-xs text-error mt-1.5">{fieldErrors.mensaje[0]}</p>
        )}
      </div>

      {result && !result.ok && !result.fieldErrors && (
        <p className="font-barlow text-sm text-error">{result.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-barlow font-medium px-7 py-3 rounded-pill transition-all duration-180 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-dark"
      >
        {pending ? (
          "Enviando…"
        ) : (
          <>
            Enviar mensaje
            <Send size={16} strokeWidth={2} />
          </>
        )}
      </button>

      <p className="font-barlow text-xs text-white/45">
        Al enviar aceptás nuestra{" "}
        <a href="/privacidad" className="underline hover:text-white">
          política de privacidad
        </a>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  placeholder,
  fieldError,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  fieldError?: string;
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block font-barlow text-sm text-white/85 mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full bg-black border border-white/15 rounded-card px-4 py-3 font-barlow text-base text-white placeholder:text-white/35 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
      {fieldError && (
        <p className="font-barlow text-xs text-error mt-1.5">{fieldError}</p>
      )}
    </div>
  );
}
