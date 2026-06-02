import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Star, Bike, MessageSquare } from "lucide-react";
import CartaPublica from "./CartaPublica";
import BadgeDelivery from "./BadgeDelivery";
import type { PrestadorDB } from "@/types";
import type { PlatoDB } from "@/types/pedidos";

interface Props {
  puebloSlug: string;
  prestador: PrestadorDB;
  platos: PlatoDB[];
}

export default function RestauranteDetalle({ puebloSlug, prestador, platos }: Props) {
  const tieneDelivery = !!prestador.delivery_activo;

  return (
    <div className="min-h-screen bg-fog">
      <section className="relative h-[40vh] md:h-[50vh] max-h-[480px] bg-surface-dark">
        {prestador.imagen_portada_url ? (
          <Image
            src={prestador.imagen_portada_url}
            alt={prestador.nombre}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 photo-rest" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-end pb-8 md:pb-12">
          <div className="container-app">
            <div className="flex items-center gap-2 mb-2">
              {prestador.tipo_cocina && (
                <span className="text-[11px] font-medium uppercase tracking-wider bg-white/15 backdrop-blur-sm text-white px-2.5 py-1 rounded-pill">
                  {prestador.tipo_cocina}
                </span>
              )}
              {tieneDelivery && <BadgeDelivery />}
            </div>
            <h1 className="display-section text-white mb-3">{prestador.nombre}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/85 font-barlow text-sm">
              {prestador.rating_promedio > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                  {prestador.rating_promedio.toFixed(1)} ({prestador.total_reviews})
                </span>
              )}
              {prestador.direccion && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} strokeWidth={1.5} />
                  {prestador.direccion}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-14 z-30 bg-white border-b border-divisor shadow-sm">
        <div className="container-app py-3 flex flex-wrap gap-2 md:gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {prestador.telefono && (
              <a
                href={`tel:${prestador.telefono}`}
                className="inline-flex items-center gap-2 bg-fog hover:bg-divisor text-text-body font-barlow text-sm px-4 py-2 rounded-pill transition-colors"
              >
                <Phone size={14} strokeWidth={1.5} /> Llamar
              </a>
            )}
            {prestador.whatsapp && (
              <a
                href={`https://wa.me/${prestador.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-fog hover:bg-divisor text-text-body font-barlow text-sm px-4 py-2 rounded-pill transition-colors"
              >
                <MessageSquare size={14} strokeWidth={1.5} /> WhatsApp
              </a>
            )}
          </div>
          {tieneDelivery && (
            <Link
              href={`/${puebloSlug}/delivery/${prestador.slug}`}
              className="inline-flex items-center gap-2 bg-commerce hover:bg-commerce-active text-white font-barlow font-medium text-sm px-5 py-2 rounded-pill transition-colors"
            >
              <Bike size={16} strokeWidth={1.5} /> Pedir delivery
            </Link>
          )}
        </div>
      </div>

      <section className="container-app py-12 md:py-16">
        <h2 className="display-module text-text-body mb-6">Carta</h2>
        {platos.length === 0 ? (
          <p className="font-barlow text-base text-text-muted">
            El negocio aún no ha publicado su carta.
          </p>
        ) : (
          <CartaPublica platos={platos} mostrarDeliveryToggle={tieneDelivery} />
        )}
      </section>
    </div>
  );
}
