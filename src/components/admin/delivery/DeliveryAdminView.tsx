"use client";

import { useState } from "react";
import type { ComisionConfigDB, DeliveryPricingConfig, MetodosPagoConfig } from "@/types/admin";

interface Props {
  pricing:            DeliveryPricingConfig;
  metodos:            MetodosPagoConfig;
  comisiones:         ComisionConfigDB[];
  pueblos:            { id: number; nombre: string }[];
  onSavePricing:      (fd: FormData) => Promise<void>;
  onSaveMetodos:      (fd: FormData) => Promise<void>;
  onCrearComision:    (fd: FormData) => Promise<void>;
  onToggleComision:   (fd: FormData) => Promise<void>;
  onEditComision:     (fd: FormData) => Promise<void>;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-6">
      <h2 className="font-barlow font-semibold text-[13px] text-white/50 uppercase tracking-wider mb-5">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Toggle({
  name, checked, label, description,
}: {
  name: string; checked: boolean; label: string; description?: string;
}) {
  const [on, setOn] = useState(checked);
  return (
    <label className="flex items-start gap-4 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={checked}
          className="sr-only peer"
          onChange={(e) => setOn(e.target.checked)}
        />
        <div className="w-10 h-6 bg-white/10 rounded-full peer-checked:bg-primary transition-colors" />
        <div className={`
          absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
          ${on ? "translate-x-4" : "translate-x-0"}
        `} />
      </div>
      <div>
        <p className="font-barlow font-medium text-[14px] text-white">{label}</p>
        {description && <p className="font-barlow text-[12px] text-white/40 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

export default function DeliveryAdminView({
  pricing, metodos, comisiones, pueblos,
  onSavePricing, onSaveMetodos, onCrearComision, onToggleComision, onEditComision,
}: Props) {
  const [editId,  setEditId]  = useState<string | null>(null);
  const [editPct, setEditPct] = useState<string>("");
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-14 md:pt-0">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <p className="font-barlow text-[12px] text-white/30 uppercase tracking-widest mb-1">
            Delivery
          </p>
          <h1 className="font-fraunces font-semibold text-[28px] text-white">
            Configuración de delivery
          </h1>
          <p className="font-barlow text-[13px] text-white/40 mt-1">
            Precios de envío (modo plataforma) y métodos de pago habilitados.
          </p>
        </div>

        {/* ── Precios plataforma ─────────────────────────────────────────── */}
        <SectionCard title="Precios de envío — modo plataforma">
          <form action={onSavePricing} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "tarifa_base",            label: "Tarifa base (€)",     defaultValue: pricing.tarifa_base,            step: "0.10" },
                { name: "precio_km",              label: "Precio por km (€)",   defaultValue: pricing.precio_km,              step: "0.05" },
                { name: "porcentaje_restaurante", label: "% cedido restaurante", defaultValue: pricing.porcentaje_restaurante, step: "1" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block font-barlow text-[12px] text-white/50 mb-1.5">{field.label}</label>
                  <input
                    type="number"
                    name={field.name}
                    defaultValue={field.defaultValue}
                    step={field.step}
                    min="0"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5
                               font-barlow text-[14px] text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
            </div>
            <p className="font-barlow text-[11px] text-white/30">
              Estos precios aplican cuando el restaurante usa el modo "Plataforma" (repartidores de PUEBLO).
              El % cedido al restaurante es sobre el coste de envío (0% = PUEBLO se queda todo).
            </p>
            <button type="submit"
                    className="font-barlow font-bold text-[13px] text-white bg-primary rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity">
              Guardar precios
            </button>
          </form>
        </SectionCard>

        {/* ── Métodos de pago ────────────────────────────────────────────── */}
        <SectionCard title="Métodos de pago habilitados (master switch)">
          <form action={onSaveMetodos} className="space-y-4">
            <p className="font-barlow text-[12px] text-white/40 mb-4">
              Si deshabilitás un método aquí, ningún restaurante podrá activarlo.
              Cada restaurante puede activar/desactivar dentro de lo que esté habilitado.
            </p>
            <div className="space-y-4">
              <Toggle
                name="efectivo"
                checked={metodos.efectivo}
                label="Efectivo"
                description="El repartidor cobra en mano. Él confirma el cobro en su portal."
              />
              <Toggle
                name="bizum"
                checked={metodos.bizum}
                label="Bizum"
                description="El cliente paga al número Bizum del restaurante. El restaurante confirma la recepción."
              />
              <Toggle
                name="tarjeta"
                checked={metodos.tarjeta}
                label="Tarjeta / Pasarela de pago"
                description="(Próximamente) Stripe u otra pasarela. Deshabilitado hasta nueva implementación."
              />
            </div>
            <button type="submit"
                    className="font-barlow font-bold text-[13px] text-white bg-primary rounded-lg px-5 py-2.5 hover:opacity-90 transition-opacity mt-2">
              Guardar métodos
            </button>
          </form>
        </SectionCard>

        {/* ── Comisiones modo propio ─────────────────────────────────────── */}
        <SectionCard title="Comisión sobre pedidos — modo propio">
          <p className="font-barlow text-[12px] text-white/40 mb-5">
            Cuando el restaurante reparte con sus propios medios, PUEBLO cobra este % sobre el subtotal de comida.
            Se puede configurar globalmente o por pueblo/categoría (más específico tiene prioridad).
          </p>

          {/* Tabla existente */}
          <div className="space-y-2 mb-5">
            {comisiones.map((c) => (
              <div key={c.id}
                   className={`flex items-center gap-3 px-4 py-3 rounded-lg border
                     ${c.activa ? "bg-white/[0.03] border-white/[0.08]" : "bg-white/[0.01] border-white/[0.04] opacity-50"}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-barlow font-medium text-[13px] text-white">
                    {c.pueblo_id == null ? "Global" : `Pueblo #${c.pueblo_id}`}
                    {c.categoria ? ` · ${c.categoria}` : " · Todas las categorías"}
                  </p>
                  {c.observaciones && (
                    <p className="font-barlow text-[11px] text-white/30 truncate">{c.observaciones}</p>
                  )}
                </div>

                {editId === c.id ? (
                  <form action={onEditComision} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input
                      type="number"
                      name="porcentaje"
                      value={editPct}
                      onChange={(e) => setEditPct(e.target.value)}
                      step="0.5"
                      min="0"
                      max="100"
                      className="w-20 bg-white/[0.05] border border-white/10 rounded px-2 py-1 font-barlow text-[13px] text-white focus:outline-none focus:border-primary"
                    />
                    <span className="font-barlow text-[13px] text-white/40">%</span>
                    <button type="submit"
                            className="font-barlow text-[12px] font-bold text-emerald-400 hover:opacity-80 transition-opacity">
                      ✓
                    </button>
                    <button type="button" onClick={() => setEditId(null)}
                            className="font-barlow text-[12px] text-white/30 hover:text-white/60">
                      ✕
                    </button>
                  </form>
                ) : (
                  <span className="font-fraunces font-semibold text-[18px] text-white">
                    {c.porcentaje}%
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {editId !== c.id && (
                    <button
                      type="button"
                      onClick={() => { setEditId(c.id); setEditPct(String(c.porcentaje)); }}
                      className="font-barlow text-[11px] text-white/30 hover:text-white/60 transition-colors px-2 py-1"
                    >
                      Editar
                    </button>
                  )}
                  <form action={onToggleComision}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="activa" value={String(!c.activa)} />
                    <button type="submit"
                            className={`font-barlow text-[11px] px-2 py-1 rounded transition-colors
                              ${c.activa
                                ? "text-red-400/60 hover:text-red-400"
                                : "text-emerald-400/60 hover:text-emerald-400"}`}>
                      {c.activa ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          {/* Nueva comisión */}
          {showNew ? (
            <form action={onCrearComision} className="bg-white/[0.03] rounded-lg border border-white/[0.08] p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-barlow text-[11px] text-white/40 mb-1">Pueblo (vacío = global)</label>
                  <select name="pueblo_id"
                          className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary">
                    <option value="">Global</option>
                    {pueblos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-barlow text-[11px] text-white/40 mb-1">Categoría (vacío = todas)</label>
                  <input name="categoria" placeholder="restaurante..." defaultValue=""
                         className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary placeholder-white/20" />
                </div>
                <div>
                  <label className="block font-barlow text-[11px] text-white/40 mb-1">Porcentaje %</label>
                  <input name="porcentaje" type="number" step="0.5" min="0" max="100" defaultValue="8"
                         className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block font-barlow text-[11px] text-white/40 mb-1">Nota (opcional)</label>
                  <input name="observaciones" placeholder="Descuento verano..."
                         className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary placeholder-white/20" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit"
                        className="font-barlow font-bold text-[13px] text-white bg-primary rounded-lg px-4 py-2 hover:opacity-90 transition-opacity">
                  Crear
                </button>
                <button type="button" onClick={() => setShowNew(false)}
                        className="font-barlow text-[13px] text-white/40 hover:text-white/70 transition-colors px-4 py-2">
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowNew(true)}
                    className="font-barlow text-[13px] font-medium text-primary hover:opacity-80 transition-opacity flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Añadir override
            </button>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
