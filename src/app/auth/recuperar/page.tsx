import type { Metadata } from "next";
import RecuperarForm from "@/components/sections/auth/RecuperarForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default function RecuperarPage() {
  return <RecuperarForm />;
}
