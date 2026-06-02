"use client";

import { useRouter } from "next/navigation";
import { useCarrito } from "@/lib/store/carrito";
import type { PedidoItemDB } from "@/types/delivery";

interface Props {
  prestadorId:     string;
  prestadorSlug:   string;
  prestadorNombre: string;
  puebloSlug:      string;
  items:           PedidoItemDB[];
}

export default function PedirDeNuevoBtn({
  prestadorId,
  prestadorSlug,
  prestadorNombre,
  puebloSlug,
  items,
}: Props) {
  const router = useRouter();
  const { loadFromPedido } = useCarrito();

  function handleClick() {
    loadFromPedido(
      { prestadorId, prestadorSlug, prestadorNombre, puebloSlug },
      items.map(item => ({
        platoId:   item.plato_id ?? item.id,
        nombre:    item.nombre,
        precio:    item.precio_unitario,
        cantidad:  item.cantidad,
        imagenUrl: null,
      })),
    );
    router.push(`/${puebloSlug}/delivery/${prestadorSlug}`);
  }

  return (
    <button
      onClick={handleClick}
      className="font-barlow font-600 text-[13px] text-[#0070cc] px-4 py-2 rounded-xl border border-[#0070cc] hover:bg-[#f0f8ff] transition-colors whitespace-nowrap"
    >
      Pedir de nuevo
    </button>
  );
}
