import Image from "next/image";
import { Leaf, Wheat, Flame } from "lucide-react";
import type { PlatoDB } from "@/types/pedidos";
import { formatCurrency } from "@/lib/format/currency";

const ALERGENO_ICONS: Record<string, string> = {
  gluten: "🌾",
  lacteos: "🥛",
  huevo: "🥚",
  frutos_secos: "🥜",
  pescado: "🐟",
  marisco: "🦐",
  soja: "🌱",
  apio: "🌿",
  mostaza: "🟡",
  sulfitos: "🍇",
  sesamo: "⚪",
  altramuces: "🫘",
  cacahuetes: "🥜",
  moluscos: "🐚",
};

function Tag({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "success" | "warning" | "error";
}) {
  const colors = {
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-barlow font-medium px-1.5 py-0.5 rounded-pill ${colors[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}

export default function PlatoCard({ plato }: { plato: PlatoDB }) {
  return (
    <article className="flex gap-4">
      {plato.imagen_url && (
        <div className="shrink-0 w-24 h-24 rounded-card overflow-hidden bg-fog relative">
          <Image
            src={plato.imagen_url}
            alt={plato.nombre}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className="font-fraunces text-lg font-semibold text-text-body leading-snug">
            {plato.nombre}
          </h4>
          <span className="font-fraunces text-lg font-semibold text-primary whitespace-nowrap">
            {plato.precio_oferta && plato.precio_oferta < plato.precio ? (
              <>
                <span className="text-text-muted line-through text-sm mr-1.5">
                  {formatCurrency(plato.precio)}
                </span>
                {formatCurrency(plato.precio_oferta)}
              </>
            ) : (
              formatCurrency(plato.precio)
            )}
          </span>
        </div>
        {plato.descripcion && (
          <p className="font-barlow text-sm text-text-muted mb-2 line-clamp-2">
            {plato.descripcion}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {plato.vegetariano && (
            <Tag icon={<Leaf size={11} />} label="Vegetariano" tone="success" />
          )}
          {plato.vegano && <Tag icon={<Leaf size={11} />} label="Vegano" tone="success" />}
          {plato.sin_gluten && (
            <Tag icon={<Wheat size={11} />} label="Sin gluten" tone="warning" />
          )}
          {plato.picante && plato.picante > 0 && (
            <Tag
              icon={<Flame size={11} />}
              label={"🌶".repeat(plato.picante)}
              tone="error"
            />
          )}
          {plato.alergenos?.map(a => (
            <span key={a} className="text-base" title={a}>
              {ALERGENO_ICONS[a] ?? "·"}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
