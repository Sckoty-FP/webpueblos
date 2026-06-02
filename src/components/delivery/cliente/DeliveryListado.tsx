"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Bike, X } from "lucide-react";
import type { PrestadorDeliveryPublico } from "@/lib/supabase/queries/delivery-publico";
import { isOpenNow } from "@/lib/utils/prestadores";
import { formatCurrency } from "@/lib/format/currency";

interface Props {
  negocios:   PrestadorDeliveryPublico[];
  puebloSlug: string;
}

function NegocioCard({ negocio, puebloSlug }: { negocio: PrestadorDeliveryPublico; puebloSlug: string }) {
  const abierto = isOpenNow(negocio.horarios);
  const cfg     = negocio.delivery_config;
  const etaMin  = cfg ? cfg.tiempo_preparacion_base_min + 15 : 30;
  const etaMax  = cfg ? cfg.tiempo_preparacion_base_min + 30 : 45;
  const gratis  = cfg?.tarifa_base === 0;

  return (
    <Link
      href={abierto ? `/${puebloSlug}/delivery/${negocio.slug}` : "#"}
      className="no-underline block group"
      style={{ opacity: abierto ? 1 : 0.72 }}
    >
      <div className="bg-white rounded-[19px] overflow-hidden border border-[#f0f0f0] transition-all duration-200 group-hover:-translate-y-[3px] group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] flex flex-col">
        {/* Imagen */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
          {negocio.imagen_portada_url ? (
            <Image
              src={negocio.imagen_portada_url}
              alt={negocio.nombre}
              fill
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[#f0f0f0] flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}

          {/* ETA chip */}
          {abierto ? (
            <span
              className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-[5px] rounded-pill font-barlow font-semibold text-[11px] text-white"
              style={{ background: "rgba(213,59,0,0.95)", backdropFilter: "blur(8px)" }}
            >
              <Bike size={11} strokeWidth={2} />
              {etaMin}–{etaMax} min
            </span>
          ) : (
            <span
              className="absolute top-2.5 right-2.5 inline-flex items-center px-2.5 py-[5px] rounded-pill font-barlow font-semibold text-[11px] text-white"
              style={{ background: "rgba(31,31,31,0.85)", backdropFilter: "blur(8px)" }}
            >
              Cerrado ahora
            </span>
          )}
        </div>

        {/* Cuerpo */}
        <div className="px-4 pt-3.5 pb-3">
          <p className="font-barlow text-[11px] font-semibold uppercase tracking-[0.8px] text-accent-warm mb-1">
            {negocio.tipo_cocina ?? "Gastronomía"}
          </p>
          <h3 className="font-fraunces font-semibold text-[18px] text-text-body leading-tight mb-1.5">
            {negocio.nombre}
          </h3>
          <div className="flex items-center gap-1.5 font-barlow text-[13px] text-text-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="font-semibold text-text-body">{negocio.rating_promedio.toFixed(1)}</span>
          </div>
        </div>

        {/* Strip inferior */}
        <div className="mt-auto border-t border-[#f0f0f0] bg-[#fafbfc] px-4 py-2.5 flex items-center gap-2 font-barlow text-[12px] text-text-muted">
          <Bike size={13} strokeWidth={1.8} />
          {gratis ? (
            <span className="text-[#059669] font-semibold">Envío gratis</span>
          ) : cfg ? (
            <>Envío <strong className="text-text-body">{formatCurrency(cfg.tarifa_base)}</strong></>
          ) : null}
          {cfg?.pedido_minimo ? (
            <>
              <span className="text-[#d1d5db] mx-0.5">·</span>
              <span>Mín. <strong className="text-text-body">{formatCurrency(cfg.pedido_minimo)}</strong></span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function DeliveryListado({ negocios, puebloSlug }: Props) {
  const [busqueda,   setBusqueda]   = useState("");
  const [soloAbierto, setSoloAbierto] = useState(false);
  const [soloGratis,  setSoloGratis]  = useState(false);

  const filtered = negocios.filter(n => {
    if (busqueda && !n.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (soloAbierto && !isOpenNow(n.horarios)) return false;
    if (soloGratis  && n.delivery_config?.tarifa_base !== 0) return false;
    return true;
  });

  const hayFiltros = busqueda || soloAbierto || soloGratis;
  const limpiar    = () => { setBusqueda(""); setSoloAbierto(false); setSoloGratis(false); };

  return (
    <>
      {/* Filtros sticky */}
      <div className="sticky top-14 z-30 bg-fog border-b border-[#ebeef2] py-4">
        <div className="container-app">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar negocio…"
                className="w-full pl-9 pr-3 py-[7px] bg-white border border-[#e5e7eb] rounded-pill font-barlow text-sm text-text-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="inline-flex items-center gap-2 font-barlow text-sm text-text-body cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soloAbierto}
                  onChange={e => setSoloAbierto(e.target.checked)}
                  className="w-4 h-4 rounded border-[#d1d5db] accent-primary"
                />
                Abierto ahora
              </label>
              <label className="inline-flex items-center gap-2 font-barlow text-sm text-text-body cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soloGratis}
                  onChange={e => setSoloGratis(e.target.checked)}
                  className="w-4 h-4 rounded border-[#d1d5db] accent-primary"
                />
                Envío gratis
              </label>
              {hayFiltros && (
                <button
                  onClick={limpiar}
                  className="inline-flex items-center gap-1 font-barlow text-sm text-primary cursor-pointer"
                >
                  <X size={14} strokeWidth={2} />
                  Limpiar
                </button>
              )}
            </div>

            <span className="font-barlow text-sm text-text-muted sm:ml-auto shrink-0">
              {filtered.length} {filtered.length === 1 ? "negocio" : "negocios"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container-app py-8 md:py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex w-20 h-20 rounded-full bg-[#f5f7fa] items-center justify-center mb-5">
              <Bike size={36} strokeWidth={1.5} className="text-text-muted" />
            </div>
            <p className="font-fraunces text-2xl text-text-body mb-2">Sin negocios que coincidan</p>
            <p className="font-barlow text-base text-text-muted mb-6">Probá quitando filtros.</p>
            {hayFiltros && (
              <button
                onClick={limpiar}
                className="font-barlow text-sm font-medium text-primary border border-primary px-5 py-2 rounded-pill hover:bg-primary hover:text-white transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(n => (
              <NegocioCard key={n.id} negocio={n} puebloSlug={puebloSlug} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
