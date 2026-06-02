"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ClasificadoDB } from "@/types";
import { usePuebloSlug } from "@/lib/hooks/usePuebloSlug";

const TIPO_DISPLAY: Record<string, string> = {
  venta: "Venta", alquiler: "Alquiler", busco: "Busco", regalo: "Regalo", servicio: "Servicio",
};

const CAT_DISPLAY: Record<string, string> = {
  inmobiliaria: "Inmobiliaria", vehiculos: "Vehículos", electronica: "Electrónica",
  hogar: "Hogar", moda: "Moda", deporte: "Deporte", trabajo: "Trabajo",
  servicios: "Servicios", otros: "Otros",
};

const TIPO_COLORS: Record<string, { bg: string }> = {
  venta: { bg: "#d53b00" }, alquiler: { bg: "#0070cc" }, busco: { bg: "#059669" },
  regalo: { bg: "#7c3aed" }, servicio: { bg: "#ca8a04" },
};

const CAT_GRADS: Record<string, string> = {
  inmobiliaria: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 60%, #7dd3fc 100%)",
  vehiculos:    "linear-gradient(135deg, #1e293b 0%, #334155 60%, #94a3b8 100%)",
  electronica:  "linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #c4b5fd 100%)",
  hogar:        "linear-gradient(135deg, #064e3b 0%, #059669 60%, #6ee7b7 100%)",
  moda:         "linear-gradient(135deg, #831843 0%, #db2777 60%, #f9a8d4 100%)",
  deporte:      "linear-gradient(135deg, #7c2d12 0%, #ea580c 60%, #fdba74 100%)",
  trabajo:      "linear-gradient(135deg, #134e4a 0%, #0d9488 60%, #5eead4 100%)",
  servicios:    "linear-gradient(135deg, #713f12 0%, #ca8a04 60%, #fde68a 100%)",
  otros:        "linear-gradient(135deg, #374151 0%, #6b7280 60%, #d1d5db 100%)",
};

const NOISE = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function formatPrecio(precio: number | null, moneda: string, tipo: string): string {
  if (!precio) return "A consultar";
  const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda ?? "EUR", maximumFractionDigits: 0 });
  return tipo === "alquiler" ? `${fmt.format(precio)}/mes` : fmt.format(precio);
}

function ContactModal({ c, isOpen, onClose }: { c: ClasificadoDB; isOpen: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(`Hola, me interesa el anuncio "${c.titulo}". ¿Podría darme más información?`);

  if (!isOpen) return null;

  function handleSend() {
    if (!name || !email) return;
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); }, 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-[24px] sm:rounded-card-lg overflow-hidden" style={{ maxHeight: "90dvh", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-divisor flex-shrink-0">
          <div>
            <p className="font-barlow text-[11px] font-semibold text-text-muted uppercase tracking-wider">Contactar</p>
            <p className="font-barlow font-semibold text-[15px] text-text-body leading-tight line-clamp-1">{c.titulo}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-fog text-text-muted hover:bg-divisor cursor-pointer border-none transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#dcfce7" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="font-fraunces font-semibold text-[20px] text-text-body mb-1">¡Mensaje enviado!</p>
              <p className="font-barlow text-[13px] text-text-muted">El anunciante te contactará pronto.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {[
                { key: "name", label: "Nombre", val: name, set: setName, type: "text", ph: "Tu nombre" },
                { key: "email", label: "Email", val: email, set: setEmail, type: "email", ph: "tu@email.com" },
              ].map(({ key, label, val, set, type, ph }) => (
                <div key={key}>
                  <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                    className="w-full font-barlow text-[15px] text-text-body border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary transition-colors placeholder:text-text-muted"
                  />
                </div>
              ))}
              <div>
                <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Mensaje</label>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4}
                  className="w-full font-barlow text-[14px] text-text-body border border-divisor rounded-card px-4 py-3 resize-none outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}
        </div>
        {!sent && (
          <div className="px-6 py-4 border-t border-divisor flex-shrink-0">
            <button onClick={handleSend} disabled={!name || !email}
              className="w-full font-barlow font-bold text-[15px] text-white bg-commerce rounded-pill py-3.5 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enviar mensaje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClasificadoDetalle({ clasificado: c }: { clasificado: ClasificadoDB }) {
  const [modalOpen, setModalOpen] = useState(false);
  const puebloSlug = usePuebloSlug();
  const grad = CAT_GRADS[c.categoria] ?? "linear-gradient(135deg,#334155,#475569)";
  const tc = TIPO_COLORS[c.tipo] ?? { bg: "#6b7280" };
  const precioFmt = formatPrecio(c.precio, c.moneda, c.tipo);

  const hasPhoto = c.imagenes_urls?.length > 0;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(240px, 40vw, 380px)" }}>
        {hasPhoto ? (
          <Image src={c.imagenes_urls[0]} alt={c.titulo} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: grad }} />
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: NOISE, backgroundSize: "200px" }} />
          </>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />

        <div className="absolute top-4 left-4">
          <nav className="flex items-center gap-2">
            <Link href={puebloSlug ? `/${puebloSlug}` : "/"} className="font-barlow text-[12px] text-white/70 hover:text-white no-underline">Inicio</Link>
            <span className="text-white/40 text-[12px]">/</span>
            <Link href={puebloSlug ? `/${puebloSlug}/clasificados` : "/clasificados"} className="font-barlow text-[12px] text-white/70 hover:text-white no-underline">Clasificados</Link>
            <span className="text-white/40 text-[12px]">/</span>
            <span className="font-barlow text-[12px] text-white/90 line-clamp-1 max-w-[180px]">{c.titulo}</span>
          </nav>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          <span className="font-barlow font-bold text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-pill" style={{ background: tc.bg, color: "#fff" }}>
            {TIPO_DISPLAY[c.tipo] ?? c.tipo}
          </span>
          {c.destacado && (
            <span className="font-barlow font-semibold text-[11px] px-2.5 py-1 rounded-pill" style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}>
              Destacado
            </span>
          )}
        </div>

        <div className="absolute bottom-5 left-5">
          <p className="font-fraunces font-semibold text-white" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 1 }}>{precioFmt}</p>
          <p className="font-barlow text-white/80 text-[14px] mt-1">{CAT_DISPLAY[c.categoria] ?? c.categoria}</p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-7">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <h1 className="font-fraunces font-semibold text-text-body leading-snug mb-2" style={{ fontSize: "clamp(20px, 3vw, 26px)" }}>
              {c.titulo}
            </h1>

            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="font-barlow font-semibold text-[12px] px-2.5 py-1 rounded-pill" style={{ background: tc.bg, color: "#fff" }}>
                {TIPO_DISPLAY[c.tipo] ?? c.tipo}
              </span>
              <span className="font-barlow text-[12px] text-text-muted bg-fog px-2.5 py-1 rounded-pill">
                {CAT_DISPLAY[c.categoria] ?? c.categoria}
              </span>
            </div>

            {/* Description */}
            <div className="bg-white rounded-card-lg border border-divisor p-5 mb-5">
              <p className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-3">Descripción</p>
              <p className="font-barlow text-[14px] text-text-body leading-relaxed">{c.descripcion}</p>
            </div>

            {/* Contact info if any */}
            {(c.telefono_contacto || c.email_contacto) && (
              <div className="bg-white rounded-card-lg border border-divisor p-5 mb-5">
                <p className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-3">Contacto directo</p>
                <div className="flex flex-col gap-2">
                  {c.telefono_contacto && (
                    <a href={`tel:${c.telefono_contacto}`} className="flex items-center gap-2 font-barlow text-[14px] text-primary no-underline hover:underline">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.41 2 2 0 0 1 3.6 1.23h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.9-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2z"/>
                      </svg>
                      {c.telefono_contacto}
                    </a>
                  )}
                  {c.email_contacto && (
                    <a href={`mailto:${c.email_contacto}`} className="flex items-center gap-2 font-barlow text-[14px] text-primary no-underline hover:underline">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      {c.email_contacto}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Gallery */}
            {c.imagenes_urls?.length > 1 && (
              <div className="mb-5">
                <p className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-3">Galería</p>
                <div className="grid grid-cols-3 gap-2">
                  {c.imagenes_urls.slice(1).map((url, i) => (
                    <div key={i} className="relative rounded-card overflow-hidden" style={{ height: 90 }}>
                      <Image src={url} alt={c.titulo} fill sizes="(max-width: 640px) 33vw, 15vw" className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Widget ─────────────────────────────────────────── */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-card-lg border border-divisor p-5 sticky top-20" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 24px" }}>
              <p className="font-fraunces font-semibold text-[26px] text-accent-warm leading-none mb-0.5">{precioFmt}</p>
              <p className="font-barlow text-[12px] text-text-muted mb-4">{TIPO_DISPLAY[c.tipo] ?? c.tipo}</p>

              <button
                onClick={() => setModalOpen(true)}
                className="w-full font-barlow font-bold text-[15px] text-white bg-commerce rounded-pill py-3.5 cursor-pointer hover:opacity-90 transition-opacity mb-2.5"
              >
                Contactar
              </button>

              {c.telefono_contacto && (
                <a
                  href={`tel:${c.telefono_contacto}`}
                  className="w-full font-barlow font-medium text-[14px] text-primary border-2 border-primary rounded-pill py-3 cursor-pointer hover:bg-fog transition-colors bg-transparent flex items-center justify-center gap-2 no-underline"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.41 2 2 0 0 1 3.6 1.23h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.9-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2z"/>
                  </svg>
                  Llamar
                </a>
              )}

              <div className="mt-4 pt-4 border-t border-divisor flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span className="font-barlow text-[12px] text-text-muted">Anuncio verificado por PUEBLO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile CTA ────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 px-4">
        <div className="bg-white rounded-card-lg border border-divisor p-3 flex gap-2" style={{ boxShadow: "rgba(0,0,0,0.15) 0px -4px 20px" }}>
          <div className="flex-1 min-w-0">
            <p className="font-fraunces font-semibold text-[20px] text-accent-warm leading-none">{precioFmt}</p>
            <p className="font-barlow text-[11px] text-text-muted line-clamp-1">{CAT_DISPLAY[c.categoria] ?? c.categoria}</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="flex-shrink-0 font-barlow font-bold text-[14px] text-white bg-commerce rounded-pill px-5 py-2.5 cursor-pointer hover:opacity-90 transition-opacity">
            Contactar
          </button>
        </div>
      </div>

      <ContactModal c={c} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
