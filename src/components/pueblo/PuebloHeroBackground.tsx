"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
  /** URLs de las fotos a rotar. Si está vacío, usa `fallback`. */
  imagenes: string[];
  /** Foto única de respaldo (pueblo.imagen_portada) si no hay set de rotación. */
  fallback: string | null;
  alt: string;
}

const INTERVALO_MS = 6000;
const FADE_MS = 1200;

/**
 * Fondo del hero del pueblo. Si hay varias `imagenes`, las cicla con un
 * cross-fade suave. Si hay una sola (o solo `fallback`), la muestra estática.
 * Si no hay ninguna, cae al fondo `.photo-hero` (degradado de color).
 *
 * Es la única parte cliente del hero (el resto es Server Component): solo
 * necesita un timer para la rotación.
 */
export default function PuebloHeroBackground({ imagenes, fallback, alt }: Props) {
  const fotos = imagenes.length > 0 ? imagenes : fallback ? [fallback] : [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (fotos.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % fotos.length), INTERVALO_MS);
    return () => clearInterval(t);
  }, [fotos.length]);

  if (fotos.length === 0) {
    return <div className="absolute inset-0 photo-hero" />;
  }

  return (
    <div className="absolute inset-0">
      {fotos.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          priority={i === 0}
          className="object-cover transition-opacity ease-in-out"
          style={{ opacity: i === idx ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
        />
      ))}
    </div>
  );
}
