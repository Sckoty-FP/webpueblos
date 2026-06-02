"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PropiedadDB } from "@/types";

const TIPOS = [
  { value: "habitacion",   label: "Habitación" },
  { value: "suite",        label: "Suite" },
  { value: "apartamento",  label: "Apartamento" },
  { value: "bungalow",     label: "Bungalow" },
  { value: "parcela",      label: "Parcela camping" },
  { value: "otro",         label: "Otro" },
];

const TIPO_LABELS: Record<string, string> = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]));

type FormData = {
  nombre: string;
  tipo: string;
  capacidad: string;
  precio_noche: string;
  descripcion: string;
};

const EMPTY_FORM: FormData = { nombre: "", tipo: "habitacion", capacidad: "2", precio_noche: "", descripcion: "" };

export default function PropiedadesManager({
  prestadorId,
  puebloId,
  propiedades: initial,
}: {
  prestadorId: string;
  puebloId: number;
  propiedades: PropiedadDB[];
}) {
  const [items, setItems]           = useState<PropiedadDB[]>(initial);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]           = useState("");

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
    setTimeout(() => document.getElementById("prop-nombre")?.focus(), 50);
  }

  function openEdit(p: PropiedadDB) {
    setEditingId(p.id);
    setForm({
      nombre:       p.nombre,
      tipo:         p.tipo,
      capacidad:    String(p.capacidad),
      precio_noche: p.precio_noche ? String(p.precio_noche) : "",
      descripcion:  p.descripcion ?? "",
    });
    setShowForm(true);
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSave() {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const FIELDS = "id, prestador_id, pueblo_id, nombre, tipo, capacidad, precio_noche, descripcion, fotos_urls, activo, created_at";
    const payload = {
      nombre:       form.nombre.trim(),
      tipo:         form.tipo,
      capacidad:    parseInt(form.capacidad) || 1,
      precio_noche: form.precio_noche ? parseFloat(form.precio_noche) : null,
      descripcion:  form.descripcion.trim() || null,
    };

    if (editingId) {
      const { data, error: err } = await supabase
        .from("propiedades")
        .update(payload)
        .eq("id", editingId)
        .select(FIELDS)
        .single();
      if (err) { setError("Error al guardar. Intentá de nuevo."); setSaving(false); return; }
      setItems((prev) => prev.map((x) => x.id === editingId ? (data as PropiedadDB) : x));
    } else {
      const { data, error: err } = await supabase
        .from("propiedades")
        .insert({ ...payload, prestador_id: prestadorId, pueblo_id: puebloId })
        .select(FIELDS)
        .single();
      if (err) { setError("Error al guardar. Intentá de nuevo."); setSaving(false); return; }
      setItems((prev) => [...prev, data as PropiedadDB]);
    }

    setSaving(false);
    cancelForm();
  }

  async function toggleActivo(p: PropiedadDB) {
    setTogglingId(p.id);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("propiedades")
      .update({ activo: !p.activo })
      .eq("id", p.id);
    if (!err) setItems((prev) => prev.map((x) => x.id === p.id ? { ...x, activo: !p.activo } : x));
    setTogglingId(null);
  }

  async function handleDelete(p: PropiedadDB) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(p.id);
    const supabase = createClient();
    const { error: err } = await supabase.from("propiedades").delete().eq("id", p.id);
    if (!err) setItems((prev) => prev.filter((x) => x.id !== p.id));
    setDeletingId(null);
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="font-barlow text-[14px] text-text-muted">
          {items.length} {items.length === 1 ? "propiedad registrada" : "propiedades registradas"}
        </p>
        {!showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="font-barlow font-semibold text-[13px] text-white bg-primary px-4 py-2 rounded-pill hover:opacity-90 transition-opacity"
          >
            + Nueva propiedad
          </button>
        )}
      </div>

      {/* Formulario add/edit */}
      {showForm && (
        <div
          className="bg-white rounded-card border border-divisor p-5 mb-4"
          style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}
        >
          <h3 className="font-barlow font-semibold text-[15px] text-text-body mb-4">
            {editingId ? "Editar propiedad" : "Nueva propiedad"}
          </h3>

          <div className="flex flex-col gap-3">
            <div>
              <label className="font-barlow text-[12px] text-text-muted block mb-1">Nombre *</label>
              <input
                id="prop-nombre"
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="ej: Habitación Doble Vista Mar"
                className="w-full font-barlow text-[14px] border border-divisor rounded-input px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-3 max-md:flex-col">
              <div className="flex-1">
                <label className="font-barlow text-[12px] text-text-muted block mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full font-barlow text-[14px] border border-divisor rounded-input px-3 py-2 focus:outline-none focus:border-primary bg-white"
                >
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="w-36 max-md:w-full">
                <label className="font-barlow text-[12px] text-text-muted block mb-1">Capacidad (personas)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.capacidad}
                  onChange={(e) => setForm((f) => ({ ...f, capacidad: e.target.value }))}
                  className="w-full font-barlow text-[14px] border border-divisor rounded-input px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="w-44 max-md:w-full">
                <label className="font-barlow text-[12px] text-text-muted block mb-1">Precio/noche (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_noche}
                  onChange={(e) => setForm((f) => ({ ...f, precio_noche: e.target.value }))}
                  placeholder="0.00"
                  className="w-full font-barlow text-[14px] border border-divisor rounded-input px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="font-barlow text-[12px] text-text-muted block mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                rows={2}
                placeholder="Describí brevemente esta unidad..."
                className="w-full font-barlow text-[14px] border border-divisor rounded-input px-3 py-2 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {error && <p className="font-barlow text-[12px] text-red-600">{error}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={cancelForm}
                className="font-barlow text-[13px] text-text-muted px-4 py-2 border border-divisor rounded-pill hover:bg-fog transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="font-barlow font-semibold text-[13px] text-white bg-primary px-4 py-2 rounded-pill hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de propiedades */}
      <div className="flex flex-col gap-3">
        {items.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-card border border-divisor p-5 flex items-start gap-4"
            style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px", opacity: p.activo ? 1 : 0.6 }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-barlow font-semibold text-[15px] text-text-body">{p.nombre}</span>
                <span className="font-barlow text-[11px] font-semibold text-accent-warm bg-accent-warm/10 px-2 py-0.5 rounded-sm">
                  {TIPO_LABELS[p.tipo] ?? p.tipo}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-barlow text-[13px] text-text-muted">
                  {p.capacidad} persona{p.capacidad !== 1 ? "s" : ""}
                </span>
                {p.precio_noche && (
                  <span className="font-barlow text-[13px] text-text-body font-medium">
                    {p.precio_noche}€/noche
                  </span>
                )}
              </div>
              {p.descripcion && (
                <p className="font-barlow text-[13px] text-text-muted mt-1.5 line-clamp-2">{p.descripcion}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openEdit(p)}
                className="font-barlow text-[12px] text-text-muted hover:text-primary transition-colors px-2 py-1 border border-divisor rounded-input bg-fog hover:bg-white"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(p)}
                disabled={deletingId === p.id}
                className="font-barlow text-[12px] text-red-400 hover:text-red-600 transition-colors px-2 py-1 border border-red-100 rounded-input hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === p.id ? "..." : "Eliminar"}
              </button>
              <button
                type="button"
                onClick={() => toggleActivo(p)}
                disabled={togglingId === p.id}
                className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent p-0 disabled:opacity-50"
                title={p.activo ? "Desactivar" : "Activar"}
              >
                <div
                  className="relative rounded-full transition-colors duration-200"
                  style={{ width: "36px", height: "20px", background: p.activo ? "var(--color-primary)" : "#e5e7eb" }}
                >
                  <div
                    className="absolute rounded-full bg-white"
                    style={{
                      width: "16px", height: "16px", top: "2px",
                      left: p.activo ? "calc(100% - 18px)" : "2px",
                      boxShadow: "rgba(0,0,0,0.2) 0px 1px 3px",
                      transition: "left 200ms",
                    }}
                  />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <p className="font-barlow text-[15px]">No tenés propiedades registradas todavía.</p>
          <p className="font-barlow text-[13px] mt-1">Agregá tu primera habitación, apartamento o unidad.</p>
        </div>
      )}
    </div>
  );
}
