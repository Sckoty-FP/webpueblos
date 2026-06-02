"use client";

import { useState, useMemo } from "react";
import PlatoCard from "./PlatoCard";
import type { PlatoDB } from "@/types/pedidos";

interface Props {
  platos: PlatoDB[];
  mostrarDeliveryToggle?: boolean;
}

export default function CartaPublica({ platos, mostrarDeliveryToggle }: Props) {
  const [soloDelivery, setSoloDelivery] = useState(false);

  const visibles = useMemo(
    () => (soloDelivery ? platos.filter(p => p.disponible_delivery) : platos),
    [platos, soloDelivery],
  );

  const grupos = useMemo(() => {
    const map = new Map<string, PlatoDB[]>();
    for (const p of visibles) {
      const cat = p.categoria || "Otros";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries());
  }, [visibles]);

  return (
    <div>
      {mostrarDeliveryToggle && (
        <div className="mb-6">
          <label className="inline-flex items-center gap-2 font-barlow text-sm text-text-body cursor-pointer">
            <input
              type="checkbox"
              checked={soloDelivery}
              onChange={e => setSoloDelivery(e.target.checked)}
              className="rounded border-divisor"
            />
            Ver solo platos disponibles para delivery
          </label>
        </div>
      )}

      <div className="space-y-12">
        {grupos.map(([categoria, items]) => (
          <section key={categoria}>
            <h3 className="font-fraunces text-2xl font-semibold text-text-body mb-5 pb-3 border-b border-divisor">
              {categoria}
            </h3>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              {items.map(p => (
                <PlatoCard key={p.id} plato={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
