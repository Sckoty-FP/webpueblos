"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { DeliveryConfigDB, CalcPedidoResult, MetodoPagoDelivery, NominatimResult } from "@/types/delivery";
import { useCarrito, selectTotalItems, selectTotalPrecio } from "@/lib/store/carrito";
import { formatCurrency } from "@/lib/format/currency";
import {
  buscarDireccionAction,
  calcularPedidoAction,
  crearPedidoPublicoAction,
  reverseGeocodeAction,
} from "@/app/[pueblo]/delivery/actions";

const MapaDireccion = dynamic(() => import("./MapaDireccion"), { ssr: false });

interface PrestadorCheckout {
  id:     string;
  nombre: string;
  slug:   string;
  lat:    number | null;
  lon:    number | null;
  config: Pick<DeliveryConfigDB, 'tarifa_base' | 'pedido_minimo' | 'tiempo_preparacion_base_min' | 'acepta_efectivo' | 'acepta_transferencia' | 'acepta_bizum' | 'bizum_numero'> | null;
}

interface DefaultAddress {
  direccion: string;
  lat:       number;
  lon:       number;
}

interface Props {
  puebloSlug:     string;
  prestador:      PrestadorCheckout | null;
  defaultAddress?: DefaultAddress;
}

const DEFAULT_LAT = 40.41650;
const DEFAULT_LON = -3.70381;

export default function CheckoutView({ puebloSlug, prestador, defaultAddress }: Props) {
  const router  = useRouter();
  const carrito = useCarrito();
  const totalItems  = useCarrito(selectTotalItems);
  const totalPrecio = useCarrito(selectTotalPrecio);

  // Formulario
  const [nombre,    setNombre]    = useState("");
  const [telefono,  setTelefono]  = useState("");
  const [email,     setEmail]     = useState("");
  const [direccion, setDireccion] = useState(defaultAddress?.direccion ?? "");
  const [detalles,  setDetalles]  = useState("");
  const [notas,     setNotas]     = useState("");
  const [metodo,    setMetodo]    = useState<MetodoPagoDelivery>("efectivo");

  // Geocoding — fallback: dirección guardada → coords del negocio → Madrid
  const [lat, setLat] = useState<number>(defaultAddress?.lat ?? prestador?.lat ?? DEFAULT_LAT);
  const [lon, setLon] = useState<number>(defaultAddress?.lon ?? prestador?.lon ?? DEFAULT_LON);
  const [sugerencias, setSugerencias]     = useState<NominatimResult[]>([]);
  const [loadingGeo,  setLoadingGeo]      = useState(false);
  const [geoError,    setGeoError]        = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cálculo
  const [calcResult, setCalcResult] = useState<CalcPedidoResult | null>(null);
  const [calcError,  setCalcError]  = useState<string | null>(null);
  const [calcDone,   setCalcDone]   = useState(false);

  // Submit
  const [isPending,  startTransition]  = useTransition();
  const [submitError, setSubmitError]  = useState<string | null>(null);

  const puedePagar = !!prestador && totalItems > 0 && nombre && telefono && calcDone && !calcError;

  // Auto-calcular si el cliente ya tiene una dirección guardada.
  // Sin esto, el botón "Confirmar pedido" queda deshabilitado indefinidamente
  // (calcDone nunca se vuelve true) hasta que el usuario toca el mapa o el autocomplete.
  // Depende de totalItems porque el carrito de Zustand se hidrata desde localStorage
  // de forma asíncrona: si calculamos antes de la hidratación, el subtotal sería 0
  // y dispararía PedidoMinimoError. El ref-guard asegura que corra una sola vez.
  const autoCalcedRef = useRef(false);
  useEffect(() => {
    if (autoCalcedRef.current) return;
    if (defaultAddress && prestador?.lat && prestador?.lon && totalItems > 0) {
      autoCalcedRef.current = true;
      calcular(defaultAddress.lat, defaultAddress.lon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems]);

  // Calcular cuando el usuario tiene lat/lon definidos (tras seleccionar dirección)
  async function calcular(pLat: number, pLon: number) {
    if (!prestador?.lat || !prestador?.lon) return;
    setCalcError(null);
    setCalcDone(false);

    const res = await calcularPedidoAction(
      prestador.id,
      prestador.lat,
      prestador.lon,
      pLat,
      pLon,
      carrito.items.map(i => ({ plato_id: i.platoId, cantidad: i.cantidad })),
    );

    if (res.ok) {
      setCalcResult(res.result);
      setCalcDone(true);
    } else {
      setCalcError(res.error);
      setCalcResult(null);
    }
  }

  function handleDireccionChange(value: string) {
    setDireccion(value);
    setGeoError(null);
    setCalcDone(false);
    setSugerencias([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 4) return;

    debounceRef.current = setTimeout(async () => {
      setLoadingGeo(true);
      const results = await buscarDireccionAction(value);
      setSugerencias(results);
      setLoadingGeo(false);
    }, 450);
  }

  async function handleSeleccionarSugerencia(r: NominatimResult) {
    const newLat = parseFloat(r.lat);
    const newLon = parseFloat(r.lon);
    const addr   = r.address;
    const partes: string[] = [];
    if (addr?.road) partes.push(addr.house_number ? `${addr.road} ${addr.house_number}` : addr.road);
    const loc = addr?.village ?? addr?.town ?? addr?.city;
    if (loc) partes.push(loc);
    const label = partes.length > 0 ? partes.join(", ") : r.display_name;

    setDireccion(label);
    setLat(newLat);
    setLon(newLon);
    setSugerencias([]);
    await calcular(newLat, newLon);
  }

  async function handleMarkerMove(newLat: number, newLon: number) {
    setLat(newLat);
    setLon(newLon);
    const addr = await reverseGeocodeAction(newLat, newLon);
    if (addr) setDireccion(addr);
    setCalcDone(false);
    await calcular(newLat, newLon);
  }

  function handleSubmit() {
    if (!puedePagar || !calcResult || !prestador) return;
    setSubmitError(null);

    startTransition(async () => {
      const res = await crearPedidoPublicoAction({
        prestadorId:       prestador.id,
        nombreCliente:     nombre,
        telefonoCliente:   telefono,
        emailCliente:      email || null,
        direccion,
        detallesDireccion: detalles || null,
        latitud:           lat,
        longitud:          lon,
        notasCliente:      notas || null,
        metodoPago:        metodo,
        calcResult,
        items: carrito.items.map(i => ({
          platoId:  i.platoId,
          nombre:   i.nombre,
          precio:   i.precio,
          cantidad: i.cantidad,
        })),
      });

      if (res.ok) {
        carrito.clearCarrito();
        router.push(`/${puebloSlug}/delivery/pedido/${res.numeroPedido}`);
      } else {
        setSubmitError(res.error);
      }
    });
  }

  // Sin carrito → redirigir
  if (!prestador || totalItems === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <p className="font-fraunces font-semibold text-[20px] text-[#1f1f1f] mb-2">Carrito vacío</p>
        <p className="font-barlow text-[14px] text-[#888] mb-6">Agregá platos desde la carta antes de pagar.</p>
        <a
          href={`/${puebloSlug}/delivery`}
          className="inline-flex items-center gap-2 font-barlow font-600 text-[14px] text-white px-6 py-3 rounded-full no-underline"
          style={{ background: "#d53b00" }}
        >
          Ver negocios
        </a>
      </div>
    );
  }

  const aceptaEfectivo     = prestador.config?.acepta_efectivo !== false;
  const aceptaBizum        = prestador.config?.acepta_bizum === true;
  const bizumNumero        = prestador.config?.bizum_numero ?? null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
      {/* Header */}
      <div>
        <a href={`/${puebloSlug}/delivery/${prestador.slug}`} className="font-barlow text-[13px] text-[#6b6b6b] no-underline flex items-center gap-1 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {prestador.nombre}
        </a>
        <h1 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f]">Checkout</h1>
      </div>

      {/* Resumen de items */}
      <div className="bg-white rounded-2xl p-4 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] mb-3">Tu pedido</p>
        <div className="space-y-2">
          {carrito.items.map(i => (
            <div key={i.platoId} className="flex justify-between">
              <span className="font-barlow text-[14px] text-[#1f1f1f]">{i.cantidad}× {i.nombre}</span>
              <span className="font-barlow font-600 text-[14px] text-[#1f1f1f]">{formatCurrency(i.precio * i.cantidad)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#f0f0f0] mt-3 pt-3 flex justify-between">
          <span className="font-barlow text-[14px] text-[#6b6b6b]">Subtotal</span>
          <span className="font-barlow font-600 text-[14px] text-[#1f1f1f]">{formatCurrency(totalPrecio)}</span>
        </div>
      </div>

      {/* Dirección */}
      <div className="bg-white rounded-2xl p-4 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] mb-3">Dirección de entrega</p>

        {/* Mapa */}
        <div className="mb-3">
          <MapaDireccion
            lat={lat}
            lon={lon}
            negocioLat={prestador.lat}
            negocioLon={prestador.lon}
            onMarkerMove={handleMarkerMove}
          />
          <p className="font-barlow text-[11px] text-[#aaa] mt-1.5 text-center">Arrastrá el pin para ajustar la ubicación</p>
        </div>

        {/* Input dirección con autocomplete */}
        <div className="relative">
          <input
            type="text"
            value={direccion}
            onChange={e => handleDireccionChange(e.target.value)}
            placeholder="Calle y número"
            className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 font-barlow text-[14px] text-[#1f1f1f] outline-none focus:border-[#0070cc] transition-colors"
          />
          {loadingGeo && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#0070cc] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {sugerencias.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e0e0e0] rounded-xl overflow-hidden z-50"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              {sugerencias.map(s => (
                <button
                  key={s.place_id}
                  onClick={() => handleSeleccionarSugerencia(s)}
                  className="w-full text-left px-4 py-3 border-b border-[#f0f0f0] last:border-0 hover:bg-[#f5f7fa] transition-colors"
                >
                  <p className="font-barlow text-[13px] text-[#1f1f1f] line-clamp-1">{s.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {geoError && <p className="font-barlow text-[12px] text-[#d53b00] mt-1">{geoError}</p>}

        <input
          type="text"
          value={detalles}
          onChange={e => setDetalles(e.target.value)}
          placeholder="Piso, puerta, portal (opcional)"
          className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 font-barlow text-[14px] text-[#1f1f1f] outline-none focus:border-[#0070cc] transition-colors mt-2"
        />

        {/* Estado del cálculo */}
        {calcError && (
          <div className="mt-2 bg-[#fee2e2] rounded-xl px-3 py-2">
            <p className="font-barlow text-[13px] text-[#991b1b]">{calcError}</p>
          </div>
        )}
        {calcDone && calcResult && (
          <div className="mt-2 bg-[#d1fae5] rounded-xl px-3 py-2 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#059669" stroke="none">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            <p className="font-barlow text-[13px] text-[#065f46]">
              Distancia {calcResult.distancia_km.toFixed(1)} km · ETA ~{calcResult.eta_minutos} min
            </p>
          </div>
        )}
      </div>

      {/* Datos de contacto */}
      <div className="bg-white rounded-2xl p-4 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] mb-3">Datos de contacto</p>
        <div className="space-y-2">
          <input
            type="text" value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Nombre completo *"
            className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors"
          />
          <input
            type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="Teléfono *"
            className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors"
          />
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email (opcional)"
            className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors"
          />
          <textarea
            value={notas} onChange={e => setNotas(e.target.value)}
            placeholder="Notas para el negocio (opcional)"
            rows={2}
            className="w-full border border-[#e0e0e0] rounded-xl px-3 py-2.5 font-barlow text-[14px] outline-none focus:border-[#0070cc] transition-colors resize-none"
          />
        </div>
      </div>

      {/* Método de pago */}
      <div className="bg-white rounded-2xl p-4 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] mb-3">Método de pago</p>
        <div className="space-y-2">
          {aceptaEfectivo && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors"
              style={{ borderColor: metodo === "efectivo" ? "#0070cc" : "#e0e0e0", background: metodo === "efectivo" ? "#f0f8ff" : "white" }}>
              <input type="radio" name="metodo" value="efectivo" checked={metodo === "efectivo"}
                onChange={() => setMetodo("efectivo")} className="accent-[#0070cc]" />
              <div>
                <p className="font-barlow font-600 text-[14px] text-[#1f1f1f]">Efectivo a la entrega</p>
                <p className="font-barlow text-[12px] text-[#888]">Pago en mano al repartidor</p>
              </div>
            </label>
          )}
          {aceptaBizum && (
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors"
              style={{ borderColor: metodo === "bizum" ? "#0070cc" : "#e0e0e0", background: metodo === "bizum" ? "#f0f8ff" : "white" }}>
              <input type="radio" name="metodo" value="bizum" checked={metodo === "bizum"}
                onChange={() => setMetodo("bizum")} className="accent-[#0070cc]" />
              <div>
                <p className="font-barlow font-600 text-[14px] text-[#1f1f1f]">Bizum</p>
                <p className="font-barlow text-[12px] text-[#888]">
                  {bizumNumero ? `Paga al ${bizumNumero} al recibir el pedido` : "Paga por Bizum al recibir el pedido"}
                </p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Resumen total */}
      {calcDone && calcResult && (
        <div className="bg-white rounded-2xl p-4 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] mb-3">Resumen</p>
          <div className="space-y-1.5">
            <div className="flex justify-between font-barlow text-[14px] text-[#6b6b6b]">
              <span>Subtotal</span><span>{formatCurrency(calcResult.subtotal)}</span>
            </div>
            <div className="flex justify-between font-barlow text-[14px] text-[#6b6b6b]">
              <span>Envío ({calcResult.distancia_km.toFixed(1)} km)</span>
              <span>{calcResult.coste_envio === 0 ? "Gratis" : formatCurrency(calcResult.coste_envio)}</span>
            </div>
            <div className="flex justify-between font-barlow font-700 text-[16px] text-[#1f1f1f] border-t border-[#f0f0f0] pt-2 mt-1">
              <span>Total</span><span>{formatCurrency(calcResult.total)}</span>
            </div>
            <p className="font-barlow text-[12px] text-[#888]">ETA estimada: ~{calcResult.eta_minutos} min</p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="bg-[#fee2e2] rounded-xl px-4 py-3">
          <p className="font-barlow text-[13px] text-[#991b1b]">{submitError}</p>
        </div>
      )}

      {/* CTA sticky */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 bg-gradient-to-t from-[#f5f7fa] via-[#f5f7fa]/80 to-transparent pt-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!puedePagar || isPending}
            className="w-full rounded-2xl py-4 font-barlow font-700 text-[15px] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#d53b00", boxShadow: "0 8px 30px rgba(213,59,0,0.3)" }}
          >
            {isPending ? "Enviando pedido…" : `Confirmar pedido${calcResult ? ` · ${formatCurrency(calcResult.total)}` : ""}`}
          </button>
          {!calcDone && !calcError && totalItems > 0 && (
            <p className="font-barlow text-[12px] text-[#6b6b6b] text-center mt-2">
              Indicá tu dirección en el mapa o el buscador para calcular el envío.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
