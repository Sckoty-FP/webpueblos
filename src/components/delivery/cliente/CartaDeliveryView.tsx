"use client";

import { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { PlatoDB } from "@/types/pedidos";
import type { DeliveryConfigDB } from "@/types/delivery";
import { useCarrito, selectTotalItems, selectTotalPrecio } from "@/lib/store/carrito";
import { formatCurrency } from "@/lib/format/currency";
import { CATEGORIAS_LABEL } from "@/types/carta";

interface PrestadorInfo {
  id:              string;
  slug:            string;
  nombre:          string;
  descripcionCorta: string | null;
  imagenUrl:       string | null;
  lat:             number | null;
  lon:             number | null;
}

interface Props {
  prestador:    PrestadorInfo;
  deliveryConfig: Pick<DeliveryConfigDB, 'tarifa_base' | 'pedido_minimo' | 'tiempo_preparacion_base_min' | 'acepta_efectivo' | 'acepta_transferencia'> | null;
  platos:       PlatoDB[];
  puebloSlug:   string;
}

function PlatoRow({ plato, cantidad, onAdd, onRemove }: {
  plato:    PlatoDB;
  cantidad: number;
  onAdd:    () => void;
  onRemove: () => void;
}) {
  const precioFinal = plato.precio_oferta ?? plato.precio;

  return (
    <div className="flex gap-3 py-4 border-b border-[#f0f0f0] last:border-0">
      {plato.imagen_url && (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#f0f0f0]">
          <Image src={plato.imagen_url} alt={plato.nombre} fill sizes="80px" className="object-cover" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-barlow font-600 text-[15px] text-[#1f1f1f] leading-tight">{plato.nombre}</p>
        {plato.descripcion && (
          <p className="font-barlow text-[13px] text-[#888] mt-0.5 line-clamp-2">{plato.descripcion}</p>
        )}

        {/* Badges */}
        <div className="flex gap-1 mt-1 flex-wrap">
          {plato.vegetariano && <span className="text-[10px] font-barlow px-1.5 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46]">🌿 Veg</span>}
          {plato.sin_gluten  && <span className="text-[10px] font-barlow px-1.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e]">🌾 S/G</span>}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            {plato.precio_oferta ? (
              <span className="flex items-center gap-1.5">
                <span className="font-barlow font-700 text-[15px] text-[#059669]">{formatCurrency(plato.precio_oferta)}</span>
                <span className="font-barlow text-[12px] text-[#aaa] line-through">{formatCurrency(plato.precio)}</span>
              </span>
            ) : (
              <span className="font-barlow font-700 text-[15px] text-[#1f1f1f]">{formatCurrency(plato.precio)}</span>
            )}
          </div>

          {/* Stepper */}
          {cantidad === 0 ? (
            <button
              onClick={onAdd}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-[0.92]"
              style={{ background: "#d53b00" }}
              aria-label={`Agregar ${plato.nombre}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onRemove}
                className="w-7 h-7 rounded-full border border-[#e0e0e0] flex items-center justify-center hover:border-[#1f1f1f] transition-colors"
                aria-label="Quitar uno"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2.5">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <span className="font-barlow font-700 text-[15px] text-[#1f1f1f] w-5 text-center">{cantidad}</span>
              <button
                onClick={onAdd}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-[0.92]"
                style={{ background: "#d53b00" }}
                aria-label="Agregar uno"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CartaDeliveryView({ prestador, deliveryConfig, platos, puebloSlug }: Props) {
  const router   = useRouter();
  const { addItem, updateCantidad, items: carritoItems, prestadorId } = useCarrito();
  const totalItems  = useCarrito(selectTotalItems);
  const totalPrecio = useCarrito(selectTotalPrecio);

  const categorias = Array.from(new Set(platos.map(p => p.categoria)));
  const catRefs    = useRef<Record<string, HTMLElement | null>>({});

  const getCantidad = (platoId: string) => carritoItems.find(i => i.platoId === platoId)?.cantidad ?? 0;

  function handleAdd(plato: PlatoDB) {
    addItem(
      {
        prestadorId:     prestador.id,
        prestadorSlug:   prestador.slug,
        prestadorNombre: prestador.nombre,
        puebloSlug,
      },
      {
        platoId:   plato.id,
        nombre:    plato.nombre,
        precio:    plato.precio_oferta ?? plato.precio,
        imagenUrl: plato.imagen_url,
      },
    );
  }

  function handleRemove(platoId: string) {
    const actual = getCantidad(platoId);
    updateCantidad(platoId, actual - 1);
  }

  function scrollTo(cat: string) {
    catRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const carteSDeOtroPrestador = !!prestadorId && prestadorId !== prestador.id && totalItems > 0;
  const pedidoMinOk = !deliveryConfig?.pedido_minimo || totalPrecio >= deliveryConfig.pedido_minimo;

  return (
    <>
      {/* Hero compacto */}
      <div style={{ background: "linear-gradient(180deg,#121314 0%,#000 100%)" }} className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <a href={`/${puebloSlug}/delivery`} className="font-barlow text-[13px] text-white/40 no-underline hover:text-white/70 flex items-center gap-1 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Delivery en {puebloSlug}
          </a>

          <h1 className="font-fraunces font-semibold text-white text-[22px] mb-1">{prestador.nombre}</h1>

          {/* Info bar */}
          {deliveryConfig && (
            <div className="flex items-center gap-4 mt-2">
              <span className="font-barlow text-[13px] text-white/50">
                Envío {deliveryConfig.tarifa_base === 0 ? "gratis" : formatCurrency(deliveryConfig.tarifa_base)}
              </span>
              <span className="text-white/20">·</span>
              <span className="font-barlow text-[13px] text-white/50">
                {deliveryConfig.tiempo_preparacion_base_min + 15}–{deliveryConfig.tiempo_preparacion_base_min + 30} min
              </span>
              {deliveryConfig.pedido_minimo > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="font-barlow text-[13px] text-white/50">Mín. {formatCurrency(deliveryConfig.pedido_minimo)}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nav categorías sticky */}
      {categorias.length > 1 && (
        <div className="sticky top-14 z-20 bg-white border-b border-[#f0f0f0]" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-1 overflow-x-auto px-4 py-2.5 scrollbar-none">
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => scrollTo(cat)}
                  className="shrink-0 font-barlow font-500 text-[13px] px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                  style={{ background: "#f5f7fa", color: "#1f1f1f" }}
                >
                  {CATEGORIAS_LABEL[cat] ?? cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Carta */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {carteSDeOtroPrestador && (
          <div className="bg-[#fef3c7] rounded-xl px-4 py-3 text-[13px] font-barlow text-[#92400e]">
            Tenés items de otro negocio. Si agregás aquí, ese carrito se vaciará.
          </div>
        )}

        {platos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-fraunces font-semibold text-[18px] text-[#1f1f1f]">Sin platos disponibles</p>
            <p className="font-barlow text-[13px] text-[#888] mt-1">Este negocio todavía no tiene carta de delivery.</p>
          </div>
        ) : (
          categorias.map(cat => (
            <section key={cat} ref={el => { catRefs.current[cat] = el; }}>
              <h2 className="font-fraunces font-semibold text-[18px] text-[#1f1f1f] mb-3">
                {CATEGORIAS_LABEL[cat] ?? cat}
              </h2>
              <div className="bg-white rounded-2xl px-4 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                {platos
                  .filter(p => p.categoria === cat)
                  .map(p => (
                    <PlatoRow
                      key={p.id}
                      plato={p}
                      cantidad={getCantidad(p.id)}
                      onAdd={() => handleAdd(p)}
                      onRemove={() => handleRemove(p.id)}
                    />
                  ))
                }
              </div>
            </section>
          ))
        )}
      </div>

      {/* Barra flotante del carrito */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <button
              onClick={() => {
                if (pedidoMinOk) {
                  router.push(`/${puebloSlug}/delivery/checkout?negocio=${prestador.slug}`);
                }
              }}
              className="w-full rounded-2xl py-4 px-5 flex items-center justify-between transition-all"
              style={{
                background: pedidoMinOk ? "#d53b00" : "#b0b0b0",
                boxShadow: pedidoMinOk ? "0 8px 30px rgba(213,59,0,0.35)" : "none",
              }}
            >
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-barlow font-700 text-white text-[12px]">
                  {totalItems}
                </span>
                <span className="font-barlow font-600 text-white text-[15px]">Ver carrito</span>
              </span>
              <span className="font-barlow font-700 text-white text-[15px]">{formatCurrency(totalPrecio)}</span>
            </button>

            {!pedidoMinOk && deliveryConfig?.pedido_minimo && (
              <p className="font-barlow text-[12px] text-center mt-2 text-[#6b6b6b]">
                Mínimo {formatCurrency(deliveryConfig.pedido_minimo)} · Faltan {formatCurrency(deliveryConfig.pedido_minimo - totalPrecio)}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
