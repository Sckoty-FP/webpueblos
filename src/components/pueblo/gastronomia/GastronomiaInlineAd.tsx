"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PrestadorCard } from "@/types";

interface Props {
  items: PrestadorCard[];
  puebloSlug: string;
}

export default function GastronomiaInlineAd({ items, puebloSlug }: Props) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % items.length);
        setFading(false);
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[idx % items.length];

  return (
    <div className="col-span-full relative rounded-[24px] overflow-hidden border border-divisor"
      style={{ aspectRatio: "4 / 1" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {current.imagenUrl ? (
          <Image
            src={current.imagenUrl}
            alt={current.nombre}
            fill
            sizes="(max-width: 1280px) 100vw, 1100px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 photo-hero" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)" }}
        />
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex items-center h-full px-8 md:px-12 transition-opacity duration-300"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <div>
          <p className="font-barlow text-[11px] font-semibold uppercase tracking-[1.5px] text-white/60 mb-1.5">
            {current.tipoCocina ?? current.catLabel}
          </p>
          <h3 className="font-fraunces text-2xl md:text-[28px] font-semibold text-white mb-4 leading-tight">
            {current.nombre}
          </h3>
          {current.descripcionCorta && (
            <p className="font-barlow text-sm text-white/65 mb-4 max-w-xs line-clamp-1">
              {current.descripcionCorta}
            </p>
          )}
          <Link
            href={`/${puebloSlug}/gastronomia/${current.slug}`}
            className="inline-flex items-center gap-2 bg-white hover:bg-fog text-text-body font-barlow font-semibold text-sm px-5 py-2.5 rounded-pill no-underline transition-colors"
          >
            Ver carta <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>

      {/* Publicidad label */}
      <span className="absolute top-3 right-3 bg-black/55 backdrop-blur-sm text-white text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-pill">
        Publicidad
      </span>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="transition-all duration-300"
              style={{
                width: i === idx ? 16 : 6,
                height: 6,
                borderRadius: 999,
                background: i === idx ? "#fff" : "rgba(255,255,255,0.35)",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
