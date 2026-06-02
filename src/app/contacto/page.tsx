import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import ContactoForm from "@/components/landing/contacto/ContactoForm";
import { Mail, MapPin } from "lucide-react";
import type { TipoContacto } from "@/types/contacto";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Hablemos. Negocios, ayuntamientos, usuarios o interesados en sumar un pueblo. Responde un humano, no un bot.",
};

interface Props {
  searchParams: Promise<{ tipo?: string }>;
}

type FormTipo = Exclude<TipoContacto, "premium-interes">;
const FORM_TIPOS: FormTipo[] = ["negocio", "ayuntamiento", "turista", "interesado_pueblo", "otro"];

export default async function ContactoPage({ searchParams }: Props) {
  const { tipo } = await searchParams;
  const tipoInicial: FormTipo = FORM_TIPOS.includes(tipo as FormTipo)
    ? (tipo as FormTipo)
    : "otro";

  return (
    <>
      <Nav variant="landing" />
      <main className="min-h-screen bg-black text-white pt-24 pb-20">
        <div className="container-app">
          <div className="grid lg:grid-cols-[5fr_7fr] gap-12 lg:gap-20">

            {/* Columna izquierda: pitch */}
            <div>
              <span className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-4">
                Contacto
              </span>
              <h1 className="display-section text-white mb-4">Hablemos.</h1>
              <p className="font-barlow text-lg text-white/70 mb-10 leading-relaxed">
                Si tenés un negocio, sos del ayuntamiento, querés traer PUEBLO a tu pueblo
                o tenés cualquier duda — escribinos. Responde un humano, no un bot, en
                menos de 24h hábiles.
              </p>

              <ul className="space-y-5">
                <li className="flex items-start gap-3">
                  <Mail size={20} strokeWidth={1.5} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-fraunces text-base font-semibold text-white">Email</p>
                    <a
                      href="mailto:hola@pueblo.app"
                      className="font-barlow text-sm text-white/65 hover:text-white transition-colors"
                    >
                      hola@pueblo.app
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={20} strokeWidth={1.5} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-fraunces text-base font-semibold text-white">Sede</p>
                    <p className="font-barlow text-sm text-white/65">
                      Costa del Azahar, Castellón, España
                    </p>
                  </div>
                </li>
              </ul>

              <div className="hidden lg:block relative w-[260px] h-[260px] mt-12 opacity-60">
                <Image
                  src="/landing/contacto-illustration.svg"
                  alt="Ilustración: dos cafés en una mesa"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Columna derecha: form */}
            <ContactoForm tipoInicial={tipoInicial} />
          </div>
        </div>
      </main>
      <Footer variant="institutional" />
    </>
  );
}
