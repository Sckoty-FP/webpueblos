"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function validateEmail(email: string): string | undefined {
  if (!email) return "El email es requerido";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email inválido";
  return undefined;
}

export default function RecuperarForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setError(err); return; }
    setError(undefined);
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/nueva-clave`;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    // No revelamos si el email existe o no (evita enumeración de cuentas).
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-fog flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5">
        <Link href="/" className="no-underline flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-primary flex items-center justify-center">
            <span className="font-fraunces font-semibold text-white text-[13px]">P</span>
          </div>
          <span className="font-fraunces font-semibold text-text-body text-[16px]">PUEBLO</span>
        </Link>
        <Link href="/auth/login" className="font-barlow text-[13px] text-primary no-underline hover:underline">
          Volver a entrar
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="bg-white rounded-card-lg border border-divisor p-8 text-center" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#dbeafe" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0070cc" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="font-fraunces font-semibold text-[22px] text-text-body mb-2">Revisá tu email</h2>
              <p className="font-barlow text-[14px] text-text-muted mb-6">
                Si <span className="text-text-body font-medium">{email}</span> tiene una cuenta, te enviamos un enlace para restablecer tu contraseña. Revisá también el spam.
              </p>
              <Link href="/auth/login" className="block w-full font-barlow font-bold text-[15px] text-white bg-primary rounded-pill py-3.5 no-underline text-center hover:opacity-90 transition-opacity">
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-card-lg border border-divisor p-7" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
              {/* Header */}
              <div className="mb-7">
                <h1 className="font-fraunces font-semibold text-[26px] text-text-body leading-tight mb-1">Recuperar contraseña</h1>
                <p className="font-barlow text-[14px] text-text-muted">Te enviamos un enlace a tu email para crear una nueva.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                {/* Email */}
                <div>
                  <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(undefined); }}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    className="w-full font-barlow text-[15px] text-text-body border rounded-card px-4 py-3 outline-none transition-colors placeholder:text-text-muted"
                    style={{ borderColor: error ? "#dc2626" : "#e5e7eb" }}
                    onFocus={(e) => { if (!error) e.target.style.borderColor = "#0070cc"; }}
                    onBlur={(e) => { if (!error) e.target.style.borderColor = "#e5e7eb"; }}
                  />
                  {error && <p className="font-barlow text-[12px] text-red-600 mt-1">{error}</p>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-barlow font-bold text-[15px] text-white bg-primary rounded-pill py-3.5 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Enviando...
                    </>
                  ) : "Enviar enlace"}
                </button>
              </form>

              <p className="font-barlow text-[13px] text-text-muted text-center mt-5">
                ¿Te acordaste?{" "}
                <Link href="/auth/login" className="text-primary font-medium no-underline hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
