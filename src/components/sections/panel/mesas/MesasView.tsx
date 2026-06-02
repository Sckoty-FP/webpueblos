"use client";

import { useState, useTransition } from "react";
import type { MesaDB } from "@/types/carta";
import { ZONAS_MESA } from "@/types/carta";

// ─── QR Modal ────────────────────────────────────────────────────────────────

interface QrModalProps {
  mesa: MesaDB;
  qrDataUri: string;
  cartaUrl: string;
  onClose: () => void;
}

function QrModal({ mesa, qrDataUri, cartaUrl, onClose }: QrModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-[18px] w-full max-w-sm p-8 text-center" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase mb-1">QR · MESA {mesa.numero}</p>
        <h2 className="font-fraunces font-semibold text-[20px] mb-4">{mesa.nombre ?? `Mesa ${mesa.numero}`}</h2>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUri} alt={`QR Mesa ${mesa.numero}`} className="w-48 h-48 mx-auto mb-4 rounded-xl" />

        <p className="font-barlow text-[11px] text-[#888] mb-6 break-all">{cartaUrl}</p>

        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-[13px] font-barlow font-600 text-[#444] hover:bg-[#f9fafb] transition-colors"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#1f1f1f] text-white text-[13px] font-barlow font-600 hover:bg-[#333] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mesa Modal ───────────────────────────────────────────────────────────────

interface MesaModalProps {
  mesa?: MesaDB;
  onClose: () => void;
  onSave: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
}

function MesaModal({ mesa, onClose, onSave }: MesaModalProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError("");
    startTransition(async () => {
      const res = await onSave(fd);
      if (res.ok) { onClose(); }
      else { setError(res.error ?? "Error al guardar"); }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center px-4 pb-4">
      <div className="bg-white rounded-[18px] w-full max-w-md p-8" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.16)" }}>
        <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase mb-1">
          {mesa ? "EDITAR MESA" : "NUEVA MESA"}
        </p>
        <h2 className="font-fraunces font-semibold text-[20px] text-[#1f1f1f] mb-6">
          {mesa ? `Mesa ${mesa.numero}` : "Añadir mesa"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Número *</label>
              <input
                name="numero"
                type="number"
                min="1"
                max="999"
                required
                defaultValue={mesa?.numero}
                disabled={!!mesa}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc] disabled:bg-[#f5f5f5]"
                placeholder="1"
              />
            </div>

            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Capacidad</label>
              <input
                name="capacidad"
                type="number"
                min="1"
                max="20"
                defaultValue={mesa?.capacidad ?? 2}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Nombre (opcional)</label>
              <input
                name="nombre"
                defaultValue={mesa?.nombre ?? ""}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]"
                placeholder="Ej: Terraza principal, VIP..."
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Zona</label>
              <select
                name="zona"
                defaultValue={mesa?.zona ?? "interior"}
                className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc] bg-white capitalize"
              >
                {ZONAS_MESA.map((z) => (
                  <option key={z} value={z} className="capitalize">{z}</option>
                ))}
              </select>
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
              {pending ? "Guardando…" : mesa ? "Guardar" : "Añadir mesa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Mesa card ────────────────────────────────────────────────────────────────

const ZONA_EMOJI: Record<string, string> = {
  interior: "🏠",
  terraza:  "☀️",
  barra:    "🍺",
  privado:  "🔒",
};

interface MesaCardProps {
  mesa: MesaDB;
  qrDataUri: string;
  cartaUrl: string;
  onEdit: () => void;
  onEliminar: () => void;
  onQr: () => void;
}

function MesaCard({ mesa, qrDataUri, cartaUrl, onEdit, onEliminar, onQr }: MesaCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`relative bg-white rounded-2xl border border-[#f0f0f0] p-5 hover:border-[#d0d0d0] transition-colors ${!mesa.activa ? "opacity-50" : ""}`}>
      {/* Número de mesa */}
      <div className="w-12 h-12 rounded-xl bg-[#0070cc]/10 flex items-center justify-center mb-3">
        <span className="font-fraunces font-semibold text-[20px] text-[#0070cc]">{mesa.numero}</span>
      </div>

      <p className="font-barlow font-600 text-[14px] text-[#1f1f1f] mb-1">
        {mesa.nombre ?? `Mesa ${mesa.numero}`}
      </p>

      <div className="flex items-center gap-3 mb-4">
        <span className="font-barlow text-[12px] text-[#888]">
          {ZONA_EMOJI[mesa.zona] ?? "📍"} {mesa.zona}
        </span>
        <span className="text-[#e0e0e0]">·</span>
        <span className="font-barlow text-[12px] text-[#888]">
          👥 {mesa.capacidad} personas
        </span>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={onQr}
          className="flex-1 py-2 rounded-xl border border-[#e5e5e5] text-[12px] font-barlow font-600 text-[#444] hover:bg-[#f9fafb] transition-colors"
          title="Ver QR"
        >
          📱 QR
        </button>
        <button
          onClick={onEdit}
          className="p-2 rounded-xl border border-[#e5e5e5] text-[#666] hover:bg-[#f0f0f0] transition-colors"
          title="Editar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-xl border border-[#e5e5e5] text-[#888] hover:bg-[#fde8ec] hover:text-[#c81b3a] hover:border-[#f9a8b4] transition-colors"
            title="Eliminar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
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

interface MesasViewProps {
  mesas: MesaDB[];
  qrMap: Record<string, string>; // mesaId → data URI
  cartaBaseUrl: string;          // /{pueblo}/restaurantes/{slug}/carta
  onCrear: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
  onActualizar: (id: string, data: FormData) => Promise<{ ok: boolean; error?: string }>;
  onEliminar: (id: string) => Promise<{ ok: boolean }>;
}

export default function MesasView({ mesas, qrMap, cartaBaseUrl, onCrear, onActualizar, onEliminar }: MesasViewProps) {
  const [modal, setModal] = useState<"nueva" | MesaDB | null>(null);
  const [qrModal, setQrModal] = useState<MesaDB | null>(null);

  const [items, setItems] = useState(mesas);

  function handleEliminar(id: string) {
    setItems((prev) => prev.filter((m) => m.id !== id));
    onEliminar(id);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#fafafa] border-b border-[#f0f0f0] px-8 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase mb-0.5">PANEL · MESAS</p>
          <h1 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f]">Gestión de mesas</h1>
        </div>
        <button
          onClick={() => setModal("nueva")}
          className="flex items-center gap-2 bg-[#1f1f1f] text-white font-barlow font-600 text-[13px] px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors shrink-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva mesa
        </button>
      </div>

      <div className="px-8 py-6">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🪑</p>
            <p className="font-fraunces font-semibold text-[18px] text-[#1f1f1f] mb-2">Sin mesas configuradas</p>
            <p className="font-barlow text-[14px] text-[#888] mb-6">Añadí las mesas de tu restaurante para generar los QRs</p>
            <button
              onClick={() => setModal("nueva")}
              className="bg-[#1f1f1f] text-white font-barlow font-600 text-[13px] px-5 py-2.5 rounded-xl hover:bg-[#333] transition-colors"
            >
              Añadir primera mesa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((mesa) => (
              <MesaCard
                key={mesa.id}
                mesa={mesa}
                qrDataUri={qrMap[mesa.id] ?? ""}
                cartaUrl={`${cartaBaseUrl}?mesa=${mesa.id}`}
                onEdit={() => setModal(mesa)}
                onEliminar={() => handleEliminar(mesa.id)}
                onQr={() => setQrModal(mesa)}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {items.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#f0f0f0] flex gap-6">
            <div>
              <p className="text-[11px] font-barlow text-[#888] uppercase tracking-wider">Total mesas</p>
              <p className="font-fraunces font-semibold text-[20px]">{items.filter((m) => m.activa).length}</p>
            </div>
            <div>
              <p className="text-[11px] font-barlow text-[#888] uppercase tracking-wider">Capacidad total</p>
              <p className="font-fraunces font-semibold text-[20px]">
                {items.filter((m) => m.activa).reduce((acc, m) => acc + m.capacidad, 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "nueva" && (
        <MesaModal
          onClose={() => setModal(null)}
          onSave={(fd) => onCrear(fd).then((res) => {
            if (res.ok) window.location.reload();
            return res;
          })}
        />
      )}
      {modal && modal !== "nueva" && (
        <MesaModal
          mesa={modal as MesaDB}
          onClose={() => setModal(null)}
          onSave={(fd) => onActualizar((modal as MesaDB).id, fd).then((res) => {
            if (res.ok) window.location.reload();
            return res;
          })}
        />
      )}
      {qrModal && (
        <QrModal
          mesa={qrModal}
          qrDataUri={qrMap[qrModal.id] ?? ""}
          cartaUrl={`${cartaBaseUrl}?mesa=${qrModal.id}`}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
}
