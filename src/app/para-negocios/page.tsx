import type { Metadata } from "next";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import NegociosHero from "@/components/landing/negocios/NegociosHero";
import NegociosBeneficios from "@/components/landing/negocios/NegociosBeneficios";
import NegociosModulos from "@/components/landing/negocios/NegociosModulos";
import NegociosPlanes from "@/components/landing/negocios/NegociosPlanes";
import NegociosCasosUso from "@/components/landing/negocios/NegociosCasosUso";
import NegociosFAQ from "@/components/landing/negocios/NegociosFAQ";
import NegociosCTA from "@/components/landing/negocios/NegociosCTA";
import { getConfigPlataforma } from "@/lib/supabase/queries/config-plataforma";

export const metadata: Metadata = {
  title: "Para negocios — PUEBLO | Plataforma para tu negocio local",
  description:
    "Reservas, carta digital, delivery, inventario, caja y más. Todo en un solo panel para tu negocio del pueblo. Sin instalar nada.",
  openGraph: {
    title: "PUEBLO — Para negocios",
    description: "El día a día de tu negocio, sin papeleo.",
    type: "website",
    locale: "es_ES",
    images: [{ url: "/og-para-negocios.jpg", width: 1200, height: 630 }],
  },
};

export default async function ParaNegociosPage() {
  const config = await getConfigPlataforma();

  return (
    <>
      <Nav variant="landing" />
      <main className="min-h-screen bg-black text-white">
        <NegociosHero />
        <NegociosBeneficios />
        <NegociosModulos />
        <NegociosPlanes config={config} />
        <NegociosCasosUso />
        <NegociosFAQ />
        <NegociosCTA />
      </main>
      <Footer variant="institutional" />
    </>
  );
}
