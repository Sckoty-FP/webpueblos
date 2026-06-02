import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/sections/auth/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión — Alcocèber · PUEBLO",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
