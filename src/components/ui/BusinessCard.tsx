import Link from "next/link";
import Image from "next/image";
import { Star, Bike, Clock } from "lucide-react";
import type { PrestadorCard } from "@/types";

const TIPO_COCINA_LABEL: Record<string, string> = {
  mediterranea: "Mediterránea",
  espanola:     "Española",
  italiana:     "Italiana",
  asiatica:     "Asiática",
  pizzeria:     "Pizzería",
  tapas:        "Tapas",
  vegana:       "Vegana",
  americana:    "Americana",
  mexicana:     "Mexicana",
  japonesa:     "Japonesa",
  fusion:       "Fusión",
};

interface Props {
  prestador: PrestadorCard & {
    categoriaLabel?: string;
    deliveryActivo?: boolean;
    proximaSesionLabel?: string | null;
  };
  hrefBase: string;
  showDeliveryBadge?: boolean;
  layout?: "vertical" | "horizontal";
  size?: "default" | "compact";
}

export default function BusinessCard({
  prestador,
  hrefBase,
  showDeliveryBadge,
  layout = "vertical",
  size = "default",
}: Props) {
  const href = `${hrefBase}/${prestador.slug}`;

  if (layout === "horizontal") {
    return <BusinessCardHorizontal prestador={prestador} href={href} />;
  }
  return (
    <BusinessCardVertical
      prestador={prestador}
      href={href}
      size={size}
      showDeliveryBadge={showDeliveryBadge}
    />
  );
}

function BusinessCardVertical({
  prestador,
  href,
  size,
  showDeliveryBadge,
}: {
  prestador: Props["prestador"];
  href: string;
  size: "default" | "compact";
  showDeliveryBadge?: boolean;
}) {
  const aspect = "aspect-[4/3]";
  const catDisplay = (prestador.tipoCocina ? (TIPO_COCINA_LABEL[prestador.tipoCocina] ?? prestador.tipoCocina) : null)
    ?? prestador.categoriaLabel
    ?? prestador.catLabel;

  return (
    <Link
      href={href}
      className="group block bg-white rounded-[19px] overflow-hidden border border-[#f0f0f0] hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-200 no-underline"
    >
      {/* Imagen */}
      <div className={`relative ${aspect} bg-fog overflow-hidden`}>
        {prestador.imagenUrl ? (
          <Image
            src={prestador.imagenUrl}
            alt={prestador.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 photo-fallback" />
        )}

        {/* Badges top-left */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {prestador.isDestacado && (
            <span className="bg-accent-warm text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-pill">
              Destacado
            </span>
          )}
          {showDeliveryBadge && prestador.deliveryActivo && (
            <span className="inline-flex items-center gap-1 bg-commerce text-white text-[10px] font-semibold px-2 py-0.5 rounded-pill">
              <Bike size={10} strokeWidth={2} /> Delivery
            </span>
          )}
          {!prestador.isOpen && (
            <span className="bg-surface-dark/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-pill backdrop-blur-sm">
              Cerrado
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={size === "compact" ? "p-3" : "px-[18px] py-4"}>
        {catDisplay && (
          <p className="font-barlow text-[11px] font-semibold uppercase tracking-[1px] text-accent-warm mb-1">
            {catDisplay}
          </p>
        )}
        <h3
          className={`font-fraunces font-semibold text-text-body line-clamp-1 mb-1.5 ${
            size === "compact" ? "text-sm" : "text-[18px]"
          }`}
        >
          {prestador.nombre}
        </h3>

        <div className="flex items-center gap-1.5 mb-1.5">
          {prestador.rating > 0 ? (
            <>
              <Star size={12} className="fill-amber-400 text-amber-400 flex-shrink-0" />
              <span className="font-barlow text-[13px] font-semibold text-text-body">
                {prestador.rating.toFixed(1)}
              </span>
              <span className="font-barlow text-[11px] text-text-muted">
                ({prestador.totalReviews})
              </span>
            </>
          ) : (
            <span className="font-barlow text-[11px] text-text-muted uppercase tracking-[0.6px]">
              Sin reseñas aún
            </span>
          )}
        </div>

        <p
          className={`font-barlow text-text-muted line-clamp-2 leading-snug ${
            size === "compact" ? "text-xs" : "text-[13px]"
          }`}
        >
          {prestador.descripcionCorta}
        </p>

        {prestador.proximaSesionLabel && (
          <div className="flex items-center gap-1 mt-2 font-barlow text-xs text-text-muted">
            <Clock size={11} strokeWidth={1.5} />
            {prestador.proximaSesionLabel}
          </div>
        )}
      </div>
    </Link>
  );
}

function BusinessCardHorizontal({
  prestador,
  href,
}: {
  prestador: Props["prestador"];
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex gap-4 bg-white rounded-card border border-divisor p-3 hover:bg-fog transition-colors no-underline"
    >
      <div className="relative w-24 h-24 flex-shrink-0 rounded-card overflow-hidden bg-fog">
        {prestador.imagenUrl ? (
          <Image
            src={prestador.imagenUrl}
            alt={prestador.nombre}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 photo-fallback" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="font-fraunces font-semibold text-text-body text-base line-clamp-1">
            {prestador.nombre}
          </h3>
          {prestador.rating > 0 && (
            <span className="flex items-center gap-0.5 text-amber-500 flex-shrink-0 text-sm">
              <Star size={11} fill="currentColor" />
              {prestador.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="font-barlow text-[11px] text-text-muted uppercase tracking-wider mb-1">
          {prestador.categoriaLabel ?? prestador.catLabel}
        </p>
        <p className="font-barlow text-xs text-text-muted line-clamp-2">
          {prestador.descripcionCorta}
        </p>
      </div>
    </Link>
  );
}
