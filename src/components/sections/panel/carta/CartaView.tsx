"use client";

import { useState, useTransition, useRef } from "react";
import type { PlatoDB } from "@/types/pedidos";
import { ALERGENOS_EU, CATEGORIAS_CARTA, CATEGORIAS_LABEL } from "@/types/carta";
import { formatCurrency } from "@/lib/format/currency";
import { uploadPlatoImagen } from "@/lib/supabase/storage";

// ─── Alérgeno badge ──────────────────────────────────────────────────────────

function AlergenoBadge({ code }: { code: string }) {
  const a = ALERGENOS_EU[code];
  if (!a) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-barlow px-1.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e]"
      title={a.label}
    >
      <span>{a.emoji}</span>
      <span className="hidden sm:inline">{a.label}</span>
    </span>
  );
}

// ─── Toggle rápido disponibilidad ────────────────────────────────────────────

function ToggleChip({
  active,
  label,
  onToggle,
}: {
  active: boolean;
  label: string;
  onToggle: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(onToggle)}
      disabled={pending}
      className={`text-[10px] font-barlow font-700 px-2 py-0.5 rounded-full border transition-colors ${
        active
          ? "bg-[#d1fae5] text-[#059669] border-[#059669]/20"
          : "bg-[#f3f4f6] text-[#6b7280] border-transparent"
      } ${pending ? "opacity-50" : ""}`}
    >
      {label}
    </button>
  );
}

// ─── Modal plato ─────────────────────────────────────────────────────────────

interface PlatoModalProps {
  plato?: PlatoDB;
  prestadorId: string;
  onClose: () => void;
  onSave: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
}

function PlatoModal({ plato, prestadorId, onClose, onSave }: PlatoModalProps) {
  const [alergenos, setAlergenos] = useState<string[]>(plato?.alergenos ?? []);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function toggleAlergeno(code: string) {
    setAlergenos((prev) =>
      prev.includes(code) ? prev.filter((a) => a !== code) : [...prev, code]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    alergenos.forEach((a) => fd.append("alergenos[]", a));
    fd.delete("imagen");
    setError("");
    startTransition(async () => {
      const file = imageInputRef.current?.files?.[0];
      if (file && file.size > 0) {
        const url = await uploadPlatoImagen(prestadorId, file);
        if (url) fd.set("imagen_url", url);
      } else if (plato?.imagen_url) {
        fd.set("imagen_url", plato.imagen_url);
      }
      const res = await onSave(fd);
      if (res.ok) { onClose(); }
      else { setError(res.error ?? "Error al guardar"); }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-4 pb-4 overflow-y-auto">
      <div className="bg-white rounded-[18px] w-full max-w-lg p-8 my-4" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.16)" }}>
        <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase mb-1">
          {plato ? "EDITAR PLATO" : "NUEVO PLATO"}
        </p>
        <h2 className="font-fraunces font-semibold text-[20px] text-[#1f1f1f] mb-6">
          {plato ? plato.nombre : "Añadir a la carta"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Nombre *</label>
              <input
                name="nombre"
                required
                defaultValue={plato?.nombre}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]"
                placeholder="Ej: Paella valenciana"
              />
            </div>

            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Categoría *</label>
              <select
                name="categoria"
                required
                defaultValue={plato?.categoria ?? "principal"}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc] bg-white"
              >
                {CATEGORIAS_CARTA.map((c) => (
                  <option key={c} value={c}>{CATEGORIAS_LABEL[c]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Precio (€) *</label>
              <input
                name="precio"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={plato?.precio}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Precio oferta (€)</label>
              <input
                name="precio_oferta"
                type="number"
                step="0.01"
                min="0"
                defaultValue={plato?.precio_oferta ?? ""}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Preparación (min)</label>
              <input
                name="tiempo_preparacion_min"
                type="number"
                min="1"
                max="120"
                defaultValue={plato?.tiempo_preparacion_min ?? 15}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]"
              />
            </div>

            <div className="col-span-2">
              <p className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1">Imagen</p>
              {(imagePreview || plato?.imagen_url) && (
                <img
                  src={imagePreview ?? plato!.imagen_url!}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-xl mb-2"
                />
              )}
              <label className="flex items-center gap-3 w-full border border-[#e5e5e5] rounded-xl px-4 py-3 cursor-pointer hover:border-[#0070cc] transition-colors">
                <span className="text-[12px] font-barlow font-600 bg-[#f0f0f0] text-[#444] px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0">
                  {imagePreview || plato?.imagen_url ? "Cambiar imagen" : "Seleccionar imagen"}
                </span>
                <span className="text-[13px] font-barlow text-[#888] truncate">
                  {imageFileName ?? "Ningún archivo seleccionado"}
                </span>
                <input
                  ref={imageInputRef}
                  type="file"
                  name="imagen"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setImagePreview(URL.createObjectURL(f));
                      setImageFileName(f.name);
                    }
                  }}
                />
              </label>
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Descripción</label>
              <textarea
                name="descripcion"
                rows={2}
                defaultValue={plato?.descripcion ?? ""}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc] resize-none"
                placeholder="Ingredientes principales, preparación..."
              />
            </div>
          </div>

          {/* Atributos */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[13px] font-barlow cursor-pointer">
              <input type="checkbox" name="vegetariano" value="1" defaultChecked={plato?.vegetariano} className="rounded" />
              🌿 Vegetariano
            </label>
            <label className="flex items-center gap-2 text-[13px] font-barlow cursor-pointer">
              <input type="checkbox" name="vegano" value="1" defaultChecked={plato?.vegano} className="rounded" />
              🌱 Vegano
            </label>
            <label className="flex items-center gap-2 text-[13px] font-barlow cursor-pointer">
              <input type="checkbox" name="sin_gluten" value="1" defaultChecked={plato?.sin_gluten} className="rounded" />
              🌾 Sin gluten
            </label>
          </div>

          {/* Disponibilidad */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[13px] font-barlow cursor-pointer">
              <input type="checkbox" name="disponible_local" value="1" defaultChecked={plato?.disponible_local ?? true} className="rounded" />
              🍽️ Local
            </label>
            <label className="flex items-center gap-2 text-[13px] font-barlow cursor-pointer">
              <input type="checkbox" name="disponible_delivery" value="1" defaultChecked={plato?.disponible_delivery} className="rounded" />
              🛵 Delivery
            </label>
          </div>

          {/* Alérgenos */}
          <div>
            <p className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-2">Alérgenos (EU)</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ALERGENOS_EU).map(([code, { label, emoji }]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleAlergeno(code)}
                  className={`text-[11px] font-barlow px-2.5 py-1 rounded-full border transition-colors ${
                    alergenos.includes(code)
                      ? "bg-[#fef3c7] text-[#92400e] border-[#f59e0b]"
                      : "bg-[#f9fafb] text-[#6b7280] border-[#e5e7eb]"
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-[12px] text-[#c81b3a] font-barlow">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#e5e5e5] text-[14px] font-barlow font-600 text-[#444] hover:bg-[#f9fafb] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-3 rounded-xl bg-[#1f1f1f] text-white text-[14px] font-barlow font-600 hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {pending ? "Guardando…" : plato ? "Guardar cambios" : "Añadir plato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Plato row ────────────────────────────────────────────────────────────────

interface PlatoRowProps {
  plato: PlatoDB;
  onEdit: () => void;
  onToggle: (campo: "disponible_local" | "disponible_delivery" | "activo", valor: boolean) => void;
  onEliminar: () => void;
}

function PlatoRow({ plato, onEdit, onToggle, onEliminar }: PlatoRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-[#f0f0f0] bg-white hover:border-[#d0d0d0] transition-colors ${!plato.activo ? "opacity-50" : ""}`}>
      {/* Imagen o placeholder */}
      <div className="w-12 h-12 rounded-lg bg-[#f5f5f5] shrink-0 overflow-hidden flex items-center justify-center">
        {plato.imagen_url
          ? <img src={plato.imagen_url} alt={plato.nombre} className="w-full h-full object-cover" />
          : <span className="text-2xl">🍽️</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] truncate">{plato.nombre}</p>
          {plato.vegetariano && <span title="Vegetariano" className="text-[11px]">🌿</span>}
          {plato.vegano && <span title="Vegano" className="text-[11px]">🌱</span>}
          {plato.sin_gluten && <span title="Sin gluten" className="text-[11px]">🌾</span>}
          {(plato.picante ?? 0) > 0 && <span title={`Picante ${plato.picante}/3`}>{"🌶️".repeat(plato.picante ?? 0)}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="font-barlow font-700 text-[13px] text-[#1f1f1f]">
            {formatCurrency(plato.precio)}
            {plato.precio_oferta && (
              <span className="ml-1 text-[11px] text-[#059669]">{formatCurrency(plato.precio_oferta)}</span>
            )}
          </p>
          <span className="text-[#d0d0d0]">·</span>
          <p className="font-barlow text-[11px] text-[#888]">{plato.tiempo_preparacion_min} min</p>
          {plato.alergenos.length > 0 && (
            <>
              <span className="text-[#d0d0d0]">·</span>
              <div className="flex gap-1 flex-wrap">
                {plato.alergenos.map((a) => <AlergenoBadge key={a} code={a} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-1 shrink-0">
        <ToggleChip
          active={plato.disponible_local}
          label="Local"
          onToggle={() => onToggle("disponible_local", !plato.disponible_local)}
        />
        <ToggleChip
          active={plato.disponible_delivery}
          label="Delivery"
          onToggle={() => onToggle("disponible_delivery", !plato.disponible_delivery)}
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-[#f0f0f0] text-[#666] transition-colors"
          title="Editar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-lg hover:bg-[#fde8ec] text-[#888] hover:text-[#c81b3a] transition-colors"
            title="Desactivar"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={() => { onEliminar(); setConfirmDelete(false); }}
              className="px-2 py-1 text-[11px] font-barlow font-700 rounded-lg bg-[#c81b3a] text-white"
            >
              Sí
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-[11px] font-barlow rounded-lg bg-[#f0f0f0] text-[#444]"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface CartaViewProps {
  prestadorId: string;
  platos: PlatoDB[];
  onCrear: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
  onActualizar: (id: string, data: FormData) => Promise<{ ok: boolean; error?: string }>;
  onToggle: (id: string, campo: "disponible_local" | "disponible_delivery" | "activo", valor: boolean) => Promise<{ ok: boolean }>;
  onEliminar: (id: string) => Promise<{ ok: boolean }>;
}

export default function CartaView({ prestadorId, platos, onCrear, onActualizar, onToggle, onEliminar }: CartaViewProps) {
  const [filtro, setFiltro] = useState<string>("todos");
  const [modal, setModal] = useState<"nuevo" | PlatoDB | null>(null);
  const [items, setItems] = useState(platos);

  // Optimistic toggle
  function handleToggle(id: string, campo: "disponible_local" | "disponible_delivery" | "activo", valor: boolean) {
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, [campo]: valor } : p));
    onToggle(id, campo, valor).catch(() => {
      setItems(platos); // revert on error
    });
  }

  function handleEliminar(id: string) {
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, activo: false } : p));
    onEliminar(id);
  }

  // Agrupación por categoría
  const categorias = Array.from(new Set(items.map((p) => p.categoria)));
  const filtrados = filtro === "todos" ? items : items.filter((p) => p.categoria === filtro);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#fafafa] border-b border-[#f0f0f0] px-8 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase mb-0.5">PANEL · CARTA</p>
          <h1 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f]">Carta del restaurante</h1>
        </div>
        <button
          onClick={() => setModal("nuevo")}
          className="flex items-center gap-2 bg-[#1f1f1f] text-white font-barlow font-600 text-[13px] px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors shrink-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo plato
        </button>
      </div>

      <div className="px-8 py-6 max-w-4xl">
        {/* Filtros de categoría */}
        {categorias.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setFiltro("todos")}
              className={`text-[12px] font-barlow font-600 px-3 py-1.5 rounded-full border transition-colors ${
                filtro === "todos"
                  ? "bg-[#1f1f1f] text-white border-[#1f1f1f]"
                  : "border-[#e5e5e5] text-[#666] hover:border-[#999]"
              }`}
            >
              Todos ({items.length})
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltro(cat)}
                className={`text-[12px] font-barlow font-600 px-3 py-1.5 rounded-full border transition-colors ${
                  filtro === cat
                    ? "bg-[#1f1f1f] text-white border-[#1f1f1f]"
                    : "border-[#e5e5e5] text-[#666] hover:border-[#999]"
                }`}
              >
                {CATEGORIAS_LABEL[cat] ?? cat} ({items.filter((p) => p.categoria === cat).length})
              </button>
            ))}
          </div>
        )}

        {/* Lista de platos */}
        {filtrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="font-fraunces font-semibold text-[18px] text-[#1f1f1f] mb-2">Sin platos aún</p>
            <p className="font-barlow text-[14px] text-[#888] mb-6">Añadí el primer plato a tu carta</p>
            <button
              onClick={() => setModal("nuevo")}
              className="bg-[#1f1f1f] text-white font-barlow font-600 text-[13px] px-5 py-2.5 rounded-xl hover:bg-[#333] transition-colors"
            >
              Añadir primer plato
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((plato) => (
              <PlatoRow
                key={plato.id}
                plato={plato}
                onEdit={() => setModal(plato)}
                onToggle={(campo, valor) => handleToggle(plato.id, campo, valor)}
                onEliminar={() => handleEliminar(plato.id)}
              />
            ))}
          </div>
        )}

        {/* Stats rápidas */}
        {items.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#f0f0f0] flex gap-6">
            <div>
              <p className="text-[11px] font-barlow text-[#888] uppercase tracking-wider">Total platos</p>
              <p className="font-fraunces font-semibold text-[20px]">{items.filter((p) => p.activo).length}</p>
            </div>
            <div>
              <p className="text-[11px] font-barlow text-[#888] uppercase tracking-wider">Con delivery</p>
              <p className="font-fraunces font-semibold text-[20px]">{items.filter((p) => p.disponible_delivery && p.activo).length}</p>
            </div>
            <div>
              <p className="text-[11px] font-barlow text-[#888] uppercase tracking-wider">Categorías</p>
              <p className="font-fraunces font-semibold text-[20px]">{categorias.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "nuevo" && (
        <PlatoModal
          prestadorId={prestadorId}
          onClose={() => setModal(null)}
          onSave={(fd) => onCrear(fd).then((res) => {
            if (res.ok) window.location.reload();
            return res;
          })}
        />
      )}
      {modal && modal !== "nuevo" && (
        <PlatoModal
          plato={modal}
          prestadorId={prestadorId}
          onClose={() => setModal(null)}
          onSave={(fd) => onActualizar((modal as PlatoDB).id, fd).then((res) => {
            if (res.ok) window.location.reload();
            return res;
          })}
        />
      )}
    </div>
  );
}
