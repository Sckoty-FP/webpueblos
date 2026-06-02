"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Field = "password" | "confirm";
type Errors = Partial<Record<Field, string>>;

function validate(password: string, confirm: string): Errors {
  const e: Errors = {};
  if (!password) e.password = "La contraseña es requerida";
  else if (password.length < 6) e.password = "Mínimo 6 caracteres";
  if (confirm !== password) e.confirm = "Las contraseñas no coinciden";
  return e;
}

export default function NuevaClaveForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [authError, setAuthError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(password, confirm);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setAuthError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setAuthError("No pudimos actualizar la contraseña. El enlace puede haber expirado — pedí uno nuevo.");
      setLoading(false);
      return;
    }

    setDone(true);
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
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {done ? (
            <div className="bg-white rounded-card-lg border border-divisor p-8 text-center" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#dcfce7" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="font-fraunces font-semibold text-[22px] text-text-body mb-2">Contraseña actualizada</h2>
              <p className="font-barlow text-[14px] text-text-muted mb-6">Ya podés entrar con tu nueva contraseña.</p>
              <Link href="/" className="block w-full font-barlow font-bold text-[15px] text-white bg-primary rounded-pill py-3.5 no-underline text-center hover:opacity-90 transition-opacity">
                Ir al inicio
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-card-lg border border-divisor p-7" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
              {/* Header */}
              <div className="mb-7">
                <h1 className="font-fraunces font-semibold text-[26px] text-text-body leading-tight mb-1">Nueva contraseña</h1>
                <p className="font-barlow text-[14px] text-text-muted">Elegí una contraseña para tu cuenta de PUEBLO.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                {/* Password */}
                <div>
                  <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full font-barlow text-[15px] text-text-body border rounded-card px-4 py-3 pr-11 outline-none transition-colors placeholder:text-text-muted"
                      style={{ borderColor: errors.password ? "#dc2626" : "#e5e7eb" }}
                      onFocus={(e) => { if (!errors.password) e.target.style.borderColor = "#0070cc"; }}
                      onBlur={(e) => { if (!errors.password) e.target.style.borderColor = "#e5e7eb"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors cursor-pointer border-none bg-transparent p-1"
                    >
                      {showPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="font-barlow text-[12px] text-red-600 mt-1">{errors.password}</p>}
                </div>

                {/* Confirm */}
                <div>
                  <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                    Repetir contraseña
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined })); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full font-barlow text-[15px] text-text-body border rounded-card px-4 py-3 outline-none transition-colors placeholder:text-text-muted"
                    style={{ borderColor: errors.confirm ? "#dc2626" : "#e5e7eb" }}
                    onFocus={(e) => { if (!errors.confirm) e.target.style.borderColor = "#0070cc"; }}
                    onBlur={(e) => { if (!errors.confirm) e.target.style.borderColor = "#e5e7eb"; }}
                  />
                  {errors.confirm && <p className="font-barlow text-[12px] text-red-600 mt-1">{errors.confirm}</p>}
                </div>

                {/* Auth error */}
                {authError && (
                  <p className="font-barlow text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-card px-4 py-2.5">
                    {authError}{" "}
                    <Link href="/auth/recuperar" className="underline font-medium">Pedir nuevo enlace</Link>
                  </p>
                )}

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
                      Guardando...
                    </>
                  ) : "Guardar contraseña"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
