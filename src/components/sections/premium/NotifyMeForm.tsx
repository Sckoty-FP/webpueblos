"use client";

import { useState, useTransition } from "react";
import { registrarInteresPremium } from "@/app/actions/premium";

export default function NotifyMeForm({ precio }: { precio: number }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email inválido");
      return;
    }
    startTransition(async () => {
      try {
        await registrarInteresPremium(email);
        setDone(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Algo falló, probá de nuevo.");
      }
    });
  }

  if (done) {
    return (
      <p className="font-barlow text-base text-text-body bg-green-50 border border-green-200 rounded-card px-5 py-4">
        ¡Listo! Te avisamos a <strong>{email}</strong> cuando Premium esté disponible por {precio}€/mes.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        autoComplete="email"
        className="w-full font-barlow text-[15px] text-text-body border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary"
      />
      {error && <p className="font-barlow text-[13px] text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary hover:opacity-90 text-white font-barlow font-bold text-[15px] rounded-pill py-3.5 disabled:opacity-60 cursor-pointer"
      >
        {isPending ? "Enviando..." : "Avisame cuando esté listo"}
      </button>
    </form>
  );
}
