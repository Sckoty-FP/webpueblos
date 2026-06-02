// web/src/components/ui/AdSlot.tsx
// Server Component async. Renderiza null si no hay banner activo para el slot.
import Image from "next/image";
import { getBannerParaSlot } from "@/lib/supabase/queries/banners";
import type { AdSlotKey } from "@/types/banners";

interface Props {
  slot: AdSlotKey;
  puebloId?: number | null;
  fullWidth?: boolean;
  priority?: boolean;
  spacing?: "compact" | "default" | "spacious";
}

export default async function AdSlot({
  slot,
  puebloId = null,
  fullWidth = true,
  priority = false,
  spacing = "default",
}: Props) {
  const banner = await getBannerParaSlot(slot, puebloId ?? null);
  if (!banner) return null;

  const paddingClass =
    spacing === "compact"
      ? "py-4 md:py-6"
      : spacing === "spacious"
        ? "py-12 md:py-16"
        : "py-8 md:py-10";

  const target = banner.abrir_nueva_pestana ? "_blank" : undefined;
  const rel = banner.abrir_nueva_pestana ? "noopener noreferrer sponsored" : "sponsored";
  const href = banner.link_url;

  return (
    <section className={`${fullWidth ? "w-full" : ""} ${paddingClass}`}>
      <div className="container-app">
        <a
          href={href}
          target={target}
          rel={rel}
          aria-label={`Publicidad: ${banner.titulo}`}
          className="block relative rounded-card-lg overflow-hidden border border-divisor"
        >
          <div className="relative w-full aspect-[3/1] md:aspect-[4/1] bg-fog">
            <Image
              src={banner.imagen_url}
              alt={banner.imagen_alt || banner.titulo}
              fill
              sizes="(max-width: 768px) 100vw, 1100px"
              priority={priority}
              className="object-cover"
            />
          </div>
          <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-pill">
            Publicidad
          </span>
        </a>
      </div>
    </section>
  );
}
