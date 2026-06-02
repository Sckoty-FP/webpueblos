import type { Metadata } from "next";
import NuevaClaveForm from "@/components/sections/auth/NuevaClaveForm";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
};

export default function NuevaClavePage() {
  return <NuevaClaveForm />;
}
