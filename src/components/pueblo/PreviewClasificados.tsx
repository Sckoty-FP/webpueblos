import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { formatCurrency } from "@/lib/format/currency";
import type { ClasificadoDB } from "@/types";

interface Props {
  puebloSlug: string;
  items: ClasificadoDB[];
}

const TIPO_LABEL: Record<string, string> = {
  venta:    "Venta",
  alquiler: "Alquiler",
  busco:    "Busca",
  regalo:   "Regalo",
  servicio: "Servicio",
};

const TIPO_COLOR: Record<string, string> = {
  venta:    "#0070cc",
  alquiler: "#14a06b",
  busco:    "#7c3aed",
  regalo:   "#d97706",
  servicio: "#B8956A",
};

export default function PreviewClasificados({ puebloSlug, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section id="clasificados" className="bg-white py-20 md:py-24">
      <div className="container-app">
        <SectionHeader
          eyebrow="Clasificados"
          title="Mercadillo del pueblo"
          subtitle="Compra-venta, alquileres y servicios de vecinos."
          cta={{ label: "Ver todos", href: `/${puebloSlug}/clasificados` }}
          variant="light"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.slice(0, 4).map((c) => {
            const tipoColor = TIPO_COLOR[c.tipo] ?? "#6b6b6b";
            return (
              <Link
                key={c.id}
                href={`/${puebloSlug}/clasificados/${c.id}`}
                className="group block bg-white rounded-[19px] overflow-hidden border border-[#f0f0f0] hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-200 no-underline"
              >
                <div className="relative aspect-square overflow-hidden bg-fog">
                  {c.imagenes_urls?.[0] ? (
                    <Image
                      src={c.imagenes_urls[0]}
                      alt={c.titulo}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Tag size={32} strokeWidth={1} className="text-[#e0e0e0]" />
                    </div>
                  )}
                  <span
                    className="absolute top-2.5 left-2.5 font-barlow text-[10px] font-semibold uppercase tracking-wide text-white px-2 py-0.5 rounded-pill backdrop-blur-sm"
                    style={{ background: tipoColor + "cc" }}
                  >
                    {TIPO_LABEL[c.tipo] ?? c.tipo}
                  </span>
                </div>

                <div className="px-[14px] py-3.5">
                  <h3 className="font-fraunces text-sm font-semibold text-text-body line-clamp-2 leading-snug mb-1.5">
                    {c.titulo}
                  </h3>
                  {c.precio !== null ? (
                    <p className="font-fraunces text-base font-bold" style={{ color: tipoColor }}>
                      {formatCurrency(c.precio)}
                    </p>
                  ) : (
                    <p className="font-barlow text-xs text-text-muted italic">Precio a consultar</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
