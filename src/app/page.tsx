import type { Metadata } from "next";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import LandingHero from "@/components/landing/LandingHero";

export const revalidate = 3600;
import PueblosShowcase from "@/components/landing/PueblosShowcase";
import QueEncontraras from "@/components/landing/QueEncontraras";
import B2BSection from "@/components/landing/B2BSection";
import AyuntamientosSection from "@/components/landing/AyuntamientosSection";
import AdSlot from "@/components/ui/AdSlot";
import JsonLd from "@/components/seo/JsonLd";
import { getPueblos } from "@/lib/supabase/queries/pueblos";
import { getActividadesDestacadasPorPueblo } from "@/lib/supabase/queries/landing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app";

const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PUEBLO",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    "https://instagram.com/pueblo.app",
    "https://facebook.com/pueblo.app",
    "https://tiktok.com/@pueblo.app",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "hola@pueblo.app",
      areaServed: "ES",
      availableLanguage: ["Spanish"],
    },
  ],
};

export const metadata: Metadata = {
  title: "PUEBLO — La plataforma de los pueblos mediterráneos",
  description:
    "Descubrí pueblos turísticos del Mediterráneo español. Gastronomía, actividades, servicios y muro social en una sola plataforma.",
  openGraph: {
    title: "PUEBLO — La plataforma de los pueblos mediterráneos",
    description: "Descubrí pueblos turísticos del Mediterráneo español.",
    type: "website",
    locale: "es_ES",
    siteName: "PUEBLO",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PUEBLO",
    description: "La plataforma de los pueblos mediterráneos",
  },
};

export default async function LandingPage() {
  const pueblos = await getPueblos();
  const destacados = await getActividadesDestacadasPorPueblo(pueblos.map((p) => p.id));

  return (
    <>
      <Nav variant="landing" />
      <main className="min-h-screen bg-black text-white">
        <LandingHero pueblos={pueblos} />
        <PueblosShowcase pueblos={pueblos} destacados={destacados} />
        <AdSlot slot="landing-mid" />
        <QueEncontraras />
        <B2BSection />
        <AyuntamientosSection />
        <AdSlot slot="landing-pre-footer" />
      </main>
      <Footer variant="institutional" />
      <MobileBottomNav variant="landing" />
      <JsonLd data={ORG_LD} />
    </>
  );
}
