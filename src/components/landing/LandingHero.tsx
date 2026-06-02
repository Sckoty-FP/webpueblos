"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { PuebloDB } from "@/lib/supabase/queries/pueblos";

const ROTATE_INTERVAL = 6500;

const HERO_ESTATICAS = [
  { src: "/landing/hero-1.jpg", alt: "Calle de pueblo mediterráneo al atardecer", pueblo: "El Mediterráneo" },
  { src: "/landing/hero-2.jpg", alt: "Terraza de bar en plaza de pueblo", pueblo: "El Mediterráneo" },
  { src: "/landing/hero-3.jpg", alt: "Barca de pescador en cala mediterránea", pueblo: "El Mediterráneo" },
  { src: "/landing/hero-4.jpg", alt: "Vista aérea de pueblo costero mediterráneo", pueblo: "El Mediterráneo" },
];

interface Props {
  pueblos: PuebloDB[];
}

export default function LandingHero({ pueblos }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const fotosDB = pueblos
    .filter((p) => p.imagen_portada)
    .map((p) => ({
      src: p.imagen_portada!,
      alt: `Vista de ${p.nombre}${p.provincia ? `, ${p.provincia}` : ""}`,
      pueblo: p.nombre,
    }));

  const fotos = fotosDB.length > 0 ? fotosDB : HERO_ESTATICAS;

  useEffect(() => {
    if (fotos.length <= 1 || paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % fotos.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(id);
  }, [fotos.length, paused]);

  function goTo(i: number) {
    setIndex(i);
    setPaused(true);
    setTimeout(() => setPaused(false), 20000);
  }

  const current = fotos[index];

  return (
    <section className="relative min-h-screen max-h-[920px] w-full overflow-hidden">
      {/* Foto rotativa */}
      <AnimatePresence mode="wait">
        {current ? (
          <motion.div
            key={current.src}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-dark via-black to-surface-dark" />
        )}
      </AnimatePresence>

      {/* Scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      {/* Acentos atmosféricos */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 80%, rgba(184,149,106,0.18), transparent 70%), radial-gradient(ellipse 80% 60% at 50% 20%, rgba(0,112,204,0.12), transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen max-h-[920px] flex flex-col items-center justify-center px-4 text-center">
        <motion.span
          className="block uppercase tracking-[0.18em] text-sm font-fraunces text-accent-warm mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Mediterráneo
        </motion.span>

        <motion.h1
          className="display-hero text-white max-w-[720px] mb-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Conocé el pueblo que<br />te quedaba por descubrir.
        </motion.h1>

        <motion.p
          className="font-barlow text-lg md:text-xl font-light text-white/85 max-w-[560px] mb-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Plataforma turística, comercio y comunidad del Mediterráneo español.
          Un pueblo, una experiencia.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <a
            href="#pueblos"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-barlow font-medium px-7 py-3 rounded-pill transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
          >
            Elegí tu pueblo
            <ChevronDown size={18} strokeWidth={2} />
          </a>
          <Link
            href="/para-negocios"
            className="inline-flex items-center justify-center bg-transparent border-2 border-white/40 hover:border-white text-white font-barlow font-medium px-7 py-3 rounded-pill transition-all duration-180 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            Soy negocio
          </Link>
        </motion.div>

        {/* Dots paginación */}
        {fotos.length > 1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
            {fotos.map((f, i) => (
              <button
                key={f.src}
                onClick={() => goTo(i)}
                aria-label={`Ver foto ${i + 1}: ${f.pueblo}`}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background:
                    i === index ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
                  transform: i === index ? "scale(1.3)" : "scale(1)",
                }}
              />
            ))}
          </div>
        )}

        {/* Crédito foto */}
        {current && (
          <div className="absolute bottom-8 right-6 text-right">
            <span className="block font-fraunces text-xs text-white/55 uppercase tracking-wider">
              {current.pueblo}
            </span>
          </div>
        )}

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <ChevronDown size={28} strokeWidth={1.5} color="rgba(255,255,255,0.55)" />
        </div>
      </div>
    </section>
  );
}
