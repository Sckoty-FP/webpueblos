import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import type { PrestadorCard } from "@/types";

type DestacadoItem = PrestadorCard & { href: string };

interface Props {
  puebloSlug: string;
  items: DestacadoItem[];
}

export default function BloqueDestacados({ puebloSlug, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="bg-[#121314] py-16 md:py-20">
      <div className="container-app">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9 md:mb-11">
          <div>
            <p className="font-fraunces text-xs uppercase tracking-[0.18em] text-white/60 mb-3">
              Directorio
            </p>
            <h2 className="display-section text-white">
              Recomendados esta semana.
            </h2>
          </div>
          <Link
            href={`/${puebloSlug}/servicios`}
            className="font-barlow text-sm text-white/50 hover:text-white transition-colors no-underline whitespace-nowrap"
          >
            Ver directorio →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.slice(0, 6).map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="group block bg-[#161616] rounded-[19px] overflow-hidden no-underline transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_16px_36px_rgba(0,0,0,0.4)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {item.imagenUrl ? (
                  <Image
                    src={item.imagenUrl}
                    alt={item.nombre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 photo-hero" />
                )}

                <div className="absolute top-3 left-3">
                  <span
                    className="font-barlow text-[11px] font-semibold text-white px-2.5 py-1 rounded-full backdrop-blur-sm"
                    style={{
                      background: item.isOpen
                        ? "rgba(20,160,107,0.9)"
                        : "rgba(31,31,31,0.85)",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {item.isOpen ? "Abierto" : "Cerrado"}
                  </span>
                </div>

                <div className="absolute top-3 right-3 w-[34px] h-[34px] rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                  <Heart size={14} strokeWidth={2} />
                </div>

                {item.tags[0] && (
                  <div
                    className="absolute bottom-3 left-3 font-barlow text-[11px] font-medium text-white px-2.5 py-1 rounded-full backdrop-blur-sm"
                    style={{ background: "rgba(0,0,0,0.65)" }}
                  >
                    {item.tags[0]}
                  </div>
                )}
              </div>

              <div className="px-5 pt-[18px] pb-5">
                <div className="font-barlow text-[11px] font-semibold uppercase tracking-[1.2px] text-[#1eaedb] mb-1.5">
                  {item.catLabel}
                </div>
                <h3 className="font-fraunces text-[19px] font-semibold text-white mb-1.5 leading-tight">
                  {item.nombre}
                </h3>
                <p className="font-barlow text-[13px] text-white/55 mb-4 leading-relaxed line-clamp-2">
                  {item.descripcionCorta}
                </p>
                <div className="flex items-center justify-between">
                  {item.rating > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span className="font-barlow text-[13px] font-semibold text-white">
                        {item.rating.toFixed(1)}
                      </span>
                      <span className="font-barlow text-[11px] text-white/40">
                        ({item.totalReviews})
                      </span>
                    </div>
                  ) : (
                    <span className="font-barlow text-[11px] text-white/30 uppercase tracking-[0.8px]">
                      Nuevo
                    </span>
                  )}
                  <span className="ml-auto font-barlow font-semibold text-[12px] text-white bg-commerce px-3.5 py-[7px] rounded-pill">
                    Ver más
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
