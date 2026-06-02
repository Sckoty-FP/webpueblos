"use client";

import { usePathname } from "next/navigation";

const RESERVED = new Set(["auth", "perfil", "servicios", "muro", "actividades", "clasificados"]);

export function usePuebloSlug(): string | null {
  const pathname = usePathname();
  const first = pathname.split("/").filter(Boolean)[0];
  return first && !RESERVED.has(first) ? first : null;
}
