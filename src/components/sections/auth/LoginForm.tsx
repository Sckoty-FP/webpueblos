"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { captchaEnabled } from "@/components/system/Turnstile";

type Field = "email" | "password";
type Errors = Partial<Record<Field, string>>;

function validate(email: string, password: string): Errors {
  const e: Errors = {};
  if (!email) e.email = "El email es requerido";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
  if (!password) e.password = "La contraseña es requerida";
  else if (password.length < 6) e.password = "Mínimo 6 caracteres";
  return e;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [authError, setAuthError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  function resetCaptcha() {
    setCaptchaToken("");
    setCaptchaKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(email, password);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (captchaEnabled && !captchaToken) { setAuthError("Completá la verificación de seguridad"); return; }
    setErrors({});
    setAuthError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      ...(captchaEnabled ? { options: { captchaToken } } : {}),
    });

    if (error) {
      setAuthError("Email o contraseña incorrectos");
      resetCaptcha();
      setLoading(false);
      return;
    }

    setDone(true);
    const raw = searchParams.get("redirect") ?? "/";
    const safe = raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://") ? raw : "/";
    router.push(safe);
    router.refresh();
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
        <Link href={`/auth/registro${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`} className="font-barlow text-[13px] text-primary no-underline hover:underline">
          ¿No tenés cuenta?
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {done ? (
            <div className="bg-white rounded-card-lg border border-divisor p-8 text-center" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#dcfce7" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="font-fraunces font-semibold text-[22px] text-text-body mb-2">¡Bienvenido/a!</h2>
              <p className="font-barlow text-[14px] text-text-muted mb-6">Sesión iniciada correctamente.</p>
              <Link href="/" className="block w-full font-barlow font-bold text-[15px] text-white bg-primary rounded-pill py-3.5 no-underline text-center hover:opacity-90 transition-opacity">
                Ir al inicio
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-card-lg border border-divisor p-7" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
              {/* Header */}
              <div className="mb-7">
                <h1 className="font-fraunces font-semibold text-[26px] text-text-body leading-tight mb-1">Iniciar sesión</h1>
                <p className="font-barlow text-[14px] text-text-muted">Accedé a tu cuenta de PUEBLO</p>
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
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    className="w-full font-barlow text-[15px] text-text-body border rounded-card px-4 py-3 outline-none transition-colors placeholder:text-text-muted"
                    style={{ borderColor: errors.email ? "#dc2626" : "#e5e7eb" }}
                    onFocus={(e) => { if (!errors.email) e.target.style.borderColor = "#0070cc"; }}
                    onBlur={(e) => { if (!errors.email) e.target.style.borderColor = "#e5e7eb"; }}
                  />
                  {errors.email && <p className="font-barlow text-[12px] text-red-600 mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide">
                      Contraseña
                    </label>
                    <Link href="/auth/recuperar" className="font-barlow text-[12px] text-primary no-underline hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="font-barlow text-[12px] text-red-600 mt-1">{errors.password}</p>}
                </div>

                {/* Auth error */}
                {authError && (
                  <p className="font-barlow text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-card px-4 py-2.5">
                    {authError}
                  </p>
                )}

                <Turnstile key={captchaKey} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || (captchaEnabled && !captchaToken)}
                  className="w-full font-barlow font-bold text-[15px] text-white bg-primary rounded-pill py-3.5 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Entrando...
                    </>
                  ) : "Entrar"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-divisor" />
                <span className="font-barlow text-[12px] text-text-muted">o continuá con</span>
                <div className="flex-1 h-px bg-divisor" />
              </div>

              {/* Social */}
              <div className="flex gap-2">
                {[
                  { label: "Google", color: "#4285F4", icon: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
                  { label: "Apple", color: "#000", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
                ].map(({ label, color, icon }) => (
                  <button
                    key={label}
                    className="flex-1 flex items-center justify-center gap-2 font-barlow font-medium text-[14px] text-text-body border border-divisor rounded-pill py-2.5 cursor-pointer hover:bg-fog transition-colors bg-white"
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              <p className="font-barlow text-[13px] text-text-muted text-center mt-5">
                ¿No tenés cuenta?{" "}
                <Link href={`/auth/registro${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`} className="text-primary font-medium no-underline hover:underline">
                  Registrate
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
