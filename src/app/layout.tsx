import type { Metadata, Viewport } from "next";
import { Barlow, Fraunces } from "next/font/google";
import "./globals.css";
import CookieConsentBanner from "@/components/legal/CookieConsentBanner";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-barlow-var",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-fraunces-var",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pueblo.app";
const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SITE_NAME = "PUEBLO";
const DEFAULT_OG = `${SITE_URL}/og-default.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Tu pueblo, en una sola app`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Plataforma para pueblos turísticos del Mediterráneo. Gastronomía, actividades, servicios, free tours y muro social, pueblo por pueblo.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  generator: "Next.js",
  keywords: ["pueblos", "turismo", "Mediterráneo", "restaurantes", "actividades", "España"],
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "es_ES",
    url: SITE_URL,
    title: `${SITE_NAME} — Tu pueblo, en una sola app`,
    description: "Plataforma para pueblos turísticos del Mediterráneo.",
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Plataforma para pueblos turísticos del Mediterráneo.",
    images: [DEFAULT_OG],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    languages: { es: "/" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121314" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${barlow.variable} ${fraunces.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {SUPABASE_ORIGIN && <link rel="preconnect" href={SUPABASE_ORIGIN} />}
        {SUPABASE_ORIGIN && <link rel="dns-prefetch" href={SUPABASE_ORIGIN} />}
      </head>
      <body className="min-h-screen">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
