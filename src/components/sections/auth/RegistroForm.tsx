"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Field = "nombre" | "email" | "password" | "confirm";
type Errors = Partial<Record<Field, string>>;

function validate(nombre: string, email: string, password: string, confirm: string): Errors {
  const e: Errors = {};
  if (!nombre.trim()) e.nombre = "Tu nombre es requerido";
  if (!email) e.email = "El email es requerido";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
  if (!password) e.password = "La contraseña es requerida";
  else if (password.length < 8) e.password = "Mínimo 8 caracteres";
  if (password && confirm !== password) e.confirm = "Las contraseñas no coinciden";
  return e;
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  const labels = ["Débil", "Regular", "Buena", "Fuerte"];
  const colors = ["#dc2626", "#d97706", "#2563eb", "#16a34a"];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : "#e5e7eb" }}
          />
        ))}
      </div>
      <p className="font-barlow text-[11px]" style={{ color: colors[score - 1] ?? "#6b6b6b" }}>
        {score > 0 ? labels[score - 1] : ""}
      </p>
    </div>
  );
}

export default function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [tipo, setTipo] = useState<"turista" | "prestador">("turista");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [authError, setAuthError] = useState("");

  function clear(field: Field) {
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(nombre, email, password, confirm);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setAuthError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          tipo,
        },
      },
    });

    if (error) {
      setAuthError(
        error.message.includes("already registered")
          ? "Este email ya tiene una cuenta. ¿Querés iniciar sesión?"
          : "Error al crear la cuenta. Intentá de nuevo."
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    setDone(true);
  }

  const EyeIcon = () => showPass ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );

  function inputClass(field: Field) {
    return `w-full font-barlow text-[15px] text-text-body border rounded-card px-4 py-3 outline-none transition-colors placeholder:text-text-muted`;
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
        <Link href={`/auth/login${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`} className="font-barlow text-[13px] text-primary no-underline hover:underline">
          ¿Ya tenés cuenta?
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {done ? (
            <div className="bg-white rounded-card-lg border border-divisor p-8 text-center" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#dcfce7" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="font-fraunces font-semibold text-[22px] text-text-body mb-2">¡Cuenta creada!</h2>
              <p className="font-barlow text-[14px] text-text-muted mb-1">Revisá tu email para confirmar tu cuenta.</p>
              <p className="font-barlow font-semibold text-[14px] text-primary mb-6">{email}</p>
              <Link href={`/auth/login${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`} className="block w-full font-barlow font-bold text-[15px] text-white bg-primary rounded-pill py-3.5 no-underline text-center hover:opacity-90 transition-opacity">
                Ir a iniciar sesión
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-card-lg border border-divisor p-7" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
              <div className="mb-6">
                <h1 className="font-fraunces font-semibold text-[26px] text-text-body leading-tight mb-1">Crear cuenta</h1>
                <p className="font-barlow text-[14px] text-text-muted">Unite a la comunidad PUEBLO</p>
              </div>

              {/* Tipo selector */}
              <div className="flex gap-2 mb-5 p-1 bg-fog rounded-card">
                {([["turista", "🏖️ Turista"], ["prestador", "🏪 Negocio"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTipo(val)}
                    className="flex-1 font-barlow font-medium text-[13px] py-2 rounded-[14px] cursor-pointer border-none transition-all duration-150"
                    style={{
                      background: tipo === val ? "#fff" : "transparent",
                      color: tipo === val ? "#1f1f1f" : "#6b6b6b",
                      boxShadow: tipo === val ? "rgba(0,0,0,0.08) 0px 1px 4px" : "none",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                {/* Nombre */}
                <div>
                  <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                    {tipo === "prestador" ? "Nombre del negocio" : "Nombre completo"}
                  </label>
                  <input type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); clear("nombre"); }}
                    placeholder={tipo === "prestador" ? "Restaurante Las Fuentes" : "Juan García"}
                    autoComplete="name"
                    className={inputClass("nombre")}
                    style={{ borderColor: errors.nombre ? "#dc2626" : "#e5e7eb" }}
                    onFocus={(e) => { if (!errors.nombre) e.target.style.borderColor = "#0070cc"; }}
                    onBlur={(e) => { if (!errors.nombre) e.target.style.borderColor = "#e5e7eb"; }}
                  />
                  {errors.nombre && <p className="font-barlow text-[12px] text-red-600 mt-1">{errors.nombre}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); clear("email"); }}
                    placeholder="tu@email.com" autoComplete="email"
                    className={inputClass("email")}
                    style={{ borderColor: errors.email ? "#dc2626" : "#e5e7eb" }}
                    onFocus={(e) => { if (!errors.email) e.target.style.borderColor = "#0070cc"; }}
                    onBlur={(e) => { if (!errors.email) e.target.style.borderColor = "#e5e7eb"; }}
                  />
                  {errors.email && <p className="font-barlow text-[12px] text-red-600 mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password}
                      onChange={(e) => { setPassword(e.target.value); clear("password"); }}
                      placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                      className={inputClass("password") + " pr-11"}
                      style={{ borderColor: errors.password ? "#dc2626" : "#e5e7eb" }}
                      onFocus={(e) => { if (!errors.password) e.target.style.borderColor = "#0070cc"; }}
                      onBlur={(e) => { if (!errors.password) e.target.style.borderColor = "#e5e7eb"; }}
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors cursor-pointer border-none bg-transparent p-1"
                    >
                      <EyeIcon />
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                  {errors.password && <p className="font-barlow text-[12px] text-red-600 mt-1">{errors.password}</p>}
                </div>

                {/* Confirm */}
                <div>
                  <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Confirmar contraseña</label>
                  <input type={showPass ? "text" : "password"} value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); clear("confirm"); }}
                    placeholder="Repetí tu contraseña" autoComplete="new-password"
                    className={inputClass("confirm")}
                    style={{ borderColor: errors.confirm ? "#dc2626" : confirm && confirm === password ? "#16a34a" : "#e5e7eb" }}
                    onFocus={(e) => { if (!errors.confirm) e.target.style.borderColor = "#0070cc"; }}
                    onBlur={(e) => { if (!errors.confirm && confirm !== password) e.target.style.borderColor = "#e5e7eb"; }}
                  />
                  {errors.confirm && <p className="font-barlow text-[12px] text-red-600 mt-1">{errors.confirm}</p>}
                  {!errors.confirm && confirm && confirm === password && (
                    <p className="font-barlow text-[12px] text-green-600 mt-1 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      Contraseñas coinciden
                    </p>
                  )}
                </div>

                {/* TOS */}
                <p className="font-barlow text-[12px] text-text-muted">
                  Al registrarte aceptás los{" "}
                  <Link href="/terminos" className="text-primary no-underline hover:underline">Términos de uso</Link>
                  {" "}y la{" "}
                  <Link href="/privacidad" className="text-primary no-underline hover:underline">Política de privacidad</Link>.
                </p>

                {authError && (
                  <p className="font-barlow text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-card px-4 py-2.5">
                    {authError}
                  </p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full font-barlow font-bold text-[15px] text-white bg-primary rounded-pill py-3.5 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Creando cuenta...
                    </>
                  ) : "Crear cuenta"}
                </button>
              </form>

              <p className="font-barlow text-[13px] text-text-muted text-center mt-5">
                ¿Ya tenés cuenta?{" "}
                <Link href={`/auth/login${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`} className="text-primary font-medium no-underline hover:underline">Iniciá sesión</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
