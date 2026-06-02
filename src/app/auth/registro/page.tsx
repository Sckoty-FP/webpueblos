import { Suspense } from "react";
import type { Metadata } from "next";
import RegistroForm from "@/components/sections/auth/RegistroForm";

export const metadata: Metadata = {
  title: "Crear cuenta — Alcocèber · PUEBLO",
};

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <RegistroForm />
    </Suspense>
  );
}
