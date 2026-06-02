"use client";

import { useState, useTransition } from "react";
import { toggleBannerActivo, eliminarBanner, crearBanner, type BannerInput } from "@/app/actions/admin/banners";
import type { BannerDB, AdSlotKey } from "@/types/banners";
import { AD_SLOT_LABEL } from "@/types/banners";

const SLOTS = Object.keys(AD_SLOT_LABEL) as AdSlotKey[];

function BannerRow({ banner }: { banner: BannerDB }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-lg p-4 flex items-start gap-4">
      {banner.imagen_url && (
        <img
          src={banner.imagen_url}
          alt={banner.imagen_alt}
          className="w-20 h-12 object-cover rounded flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-barlow font-semibold text-[14px] text-white/90 truncate">{banner.titulo}</p>
          <span className={`font-barlow text-[10px] font-bold px-2 py-0.5 rounded-full ${banner.activo ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
            {banner.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        <p className="font-barlow text-[12px] text-white/40 mb-1">{AD_SLOT_LABEL[banner.slot]}</p>
        <p className="font-barlow text-[11px] text-white/30">
          {banner.impresiones.toLocaleString("es-ES")} impresiones · {banner.clicks} clicks
          {banner.prioridad > 0 && ` · prioridad ${banner.prioridad}`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => startTransition(async () => { await toggleBannerActivo(banner.id, !banner.activo); })}
          disabled={isPending}
          className="font-barlow text-[12px] px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors disabled:opacity-40 cursor-pointer bg-transparent"
        >
          {banner.activo ? "Pausar" : "Activar"}
        </button>
        <button
          onClick={() => {
            if (!confirm("¿Eliminar este banner?")) return;
            startTransition(async () => { await eliminarBanner(banner.id); });
          }}
          disabled={isPending}
          className="font-barlow text-[12px] px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 cursor-pointer bg-transparent"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

const EMPTY_FORM: BannerInput = {
  slot: "landing-mid",
  titulo: "",
  imagen_url: "",
  imagen_alt: "",
  link_url: "",
  abrir_nueva_pestana: true,
  prioridad: 50,
  pueblo_id: null,
  fecha_inicio: null,
  fecha_fin: null,
};

function NuevoBannerForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<BannerInput>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof BannerInput>(k: K, v: BannerInput[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo || !form.imagen_url || !form.link_url) {
      setError("Título, imagen y link son obligatorios");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await crearBanner(form);
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <form onSubmit={submit} className="bg-white/[0.05] border border-white/[0.1] rounded-lg p-5 mb-6">
      <h3 className="font-barlow font-semibold text-white/90 text-[15px] mb-4">Nuevo banner</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block font-barlow text-[11px] text-white/40 uppercase tracking-wide mb-1">Slot</label>
          <select
            value={form.slot}
            onChange={e => set("slot", e.target.value as AdSlotKey)}
            className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded text-white font-barlow text-sm"
          >
            {SLOTS.map(s => <option key={s} value={s}>{AD_SLOT_LABEL[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-barlow text-[11px] text-white/40 uppercase tracking-wide mb-1">Título</label>
          <input value={form.titulo} onChange={e => set("titulo", e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded text-white font-barlow text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block font-barlow text-[11px] text-white/40 uppercase tracking-wide mb-1">URL imagen</label>
          <input value={form.imagen_url} onChange={e => set("imagen_url", e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded text-white font-barlow text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block font-barlow text-[11px] text-white/40 uppercase tracking-wide mb-1">Alt imagen</label>
          <input value={form.imagen_alt} onChange={e => set("imagen_alt", e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded text-white font-barlow text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block font-barlow text-[11px] text-white/40 uppercase tracking-wide mb-1">Link URL</label>
          <input value={form.link_url} onChange={e => set("link_url", e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded text-white font-barlow text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block font-barlow text-[11px] text-white/40 uppercase tracking-wide mb-1">Prioridad (0-100)</label>
          <input type="number" min={0} max={100} value={form.prioridad} onChange={e => set("prioridad", Number(e.target.value))}
            className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded text-white font-barlow text-sm focus:outline-none focus:border-primary" />
        </div>
      </div>
      {error && <p className="font-barlow text-[12px] text-red-400 mt-3">{error}</p>}
      <div className="flex items-center gap-3 mt-4">
        <button type="submit" disabled={isPending}
          className="bg-primary hover:opacity-90 text-white font-barlow font-medium text-sm px-6 py-2 rounded-full disabled:opacity-50 cursor-pointer">
          {isPending ? "Creando..." : "Crear banner"}
        </button>
        <button type="button" onClick={onClose}
          className="font-barlow text-sm text-white/50 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function BannersAdminView({ banners }: { banners: BannerDB[] }) {
  const [showForm, setShowForm] = useState(false);

  const bySlot = SLOTS.reduce<Record<string, BannerDB[]>>((acc, slot) => {
    acc[slot] = banners.filter(b => b.slot === slot);
    return acc;
  }, {});

  return (
    <div>
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 bg-primary hover:opacity-90 text-white font-barlow font-medium text-sm px-6 py-2.5 rounded-full cursor-pointer"
        >
          + Nuevo banner
        </button>
      )}
      {showForm && <NuevoBannerForm onClose={() => setShowForm(false)} />}

      {SLOTS.map(slot => {
        const items = bySlot[slot] ?? [];
        if (items.length === 0) return null;
        return (
          <div key={slot} className="mb-8">
            <h3 className="font-barlow font-semibold text-[13px] text-white/40 uppercase tracking-widest mb-3">
              {AD_SLOT_LABEL[slot]}
            </h3>
            <div className="flex flex-col gap-3">
              {items.map(b => <BannerRow key={b.id} banner={b} />)}
            </div>
          </div>
        );
      })}

      {banners.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="font-barlow text-white/30">No hay banners todavía. Creá el primero.</p>
        </div>
      )}
    </div>
  );
}
