"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ServicioDB } from "@/types";

const CAT_LABELS: Record<string, string> = {
  restaurante: "Restaurante", bar: "Bar", cafeteria: "Cafetería", heladeria: "Heladería",
  hotel: "Hotel", apartamento_turistico: "Apartamento turístico", camping: "Camping", hostal: "Hostal",
  supermercado: "Supermercado", panaderia: "Panadería", farmacia: "Farmacia",
  tienda_ropa: "Tienda ropa", comercio_general: "Comercio general",
  peluqueria: "Peluquería", estetica: "Estética", spa: "Spa", gimnasio: "Gimnasio",
  fontaneria: "Fontanería", electricidad: "Electricidad", taller_mecanico: "Taller mecánico",
  limpieza: "Limpieza", jardineria: "Jardinería",
  clinica: "Clínica", fisioterapia: "Fisioterapia", veterinario: "Veterinario",
  alquiler_bicis: "Alquiler bicis", alquiler_barcos: "Alquiler barcos",
  escuela_nautica: "Escuela náutica", actividades_aventura: "Actividades aventura",
  tour_guiado: "Tour guiado", otro: "Otro",
};

const CAT_GROUPS = [
  { group: "Hostelería",        cats: ["restaurante", "bar", "cafeteria", "heladeria"] },
  { group: "Hospedaje",         cats: ["hotel", "apartamento_turistico", "camping", "hostal"] },
  { group: "Comercio",          cats: ["supermercado", "panaderia", "farmacia", "tienda_ropa", "comercio_general"] },
  { group: "Servicios personales", cats: ["peluqueria", "estetica", "spa", "gimnasio"] },
  { group: "Profesionales",     cats: ["fontaneria", "electricidad", "taller_mecanico", "limpieza", "jardineria"] },
  { group: "Salud",             cats: ["clinica", "fisioterapia", "veterinario"] },
  { group: "Ocio y deporte",    cats: ["alquiler_bicis", "alquiler_barcos", "escuela_nautica", "actividades_aventura", "tour_guiado"] },
  { group: "Otro",              cats: ["otro"] },
];

const UNIDADES = ["por persona", "por hora", "por día", "por noche", "por sesión", "por servicio", "por grupo"];

const FIELDS = "id, nombre, slug, descripcion, categoria, precio_desde, precio_hasta, precio_unidad, reservable, duracion_minutos, capacidad_maxima, descuento_premium_porcentaje, descuento_premium_descripcion, activo, orden_visualizacion";

function toSlug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

type FormData = {
  nombre: string; categoria: string; descripcion: string;
  precio_desde: string; precio_hasta: string; precio_unidad: string;
  reservable: boolean; duracion_minutos: string; capacidad_maxima: string;
};

const EMPTY: FormData = {
  nombre: "", categoria: "", descripcion: "",
  precio_desde: "", precio_hasta: "", precio_unidad: "por persona",
  reservable: false, duracion_minutos: "", capacidad_maxima: "",
};

function PrecioDisplay({ s }: { s: ServicioDB }) {
  if (!s.precio_desde) return <span className="text-text-muted text-[13px]">Sin precio</span>;
  const from = `${s.precio_desde}€`;
  const to   = s.precio_hasta ? ` – ${s.precio_hasta}€` : "";
  const unit = s.precio_unidad ? ` / ${s.precio_unidad}` : "";
  return <span className="font-barlow text-[13px] text-text-body font-medium">{from}{to}{unit}</span>;
}

export default function ServiciosManager({
  prestadorId,
  puebloId,
  servicios: initial,
}: {
  prestadorId: string;
  puebloId: number;
  servicios: ServicioDB[];
}) {
  const [items,      setItems]      = useState<ServicioDB[]>(initial);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState<FormData>(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error,      setError]      = useState("");

  function f(patch: Partial<FormData>) { setForm((p) => ({ ...p, ...patch })); }

  function openAdd() {
    setEditingId(null); setForm(EMPTY); setShowForm(true); setError("");
    setTimeout(() => document.getElementById("svc-nombre")?.focus(), 50);
  }

  function openEdit(s: ServicioDB) {
    setEditingId(s.id);
    setForm({
      nombre:           s.nombre,
      categoria:        s.categoria,
      descripcion:      s.descripcion ?? "",
      precio_desde:     s.precio_desde != null ? String(s.precio_desde) : "",
      precio_hasta:     s.precio_hasta != null ? String(s.precio_hasta) : "",
      precio_unidad:    s.precio_unidad ?? "por persona",
      reservable:       s.reservable,
      duracion_minutos: s.duracion_minutos != null ? String(s.duracion_minutos) : "",
      capacidad_maxima: s.capacidad_maxima != null ? String(s.capacidad_maxima) : "",
    });
    setShowForm(true); setError("");
  }

  function cancelForm() { setShowForm(false); setEditingId(null); setForm(EMPTY); setError(""); }

  async function handleSave() {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!form.categoria)     { setError("Elegí una categoría."); return; }
    setSaving(true); setError("");
    const supabase = createClient();

    const payload = {
      nombre:           form.nombre.trim(),
      categoria:        form.categoria,
      descripcion:      form.descripcion.trim() || null,
      precio_desde:     form.precio_desde ? parseFloat(form.precio_desde) : null,
      precio_hasta:     form.precio_hasta ? parseFloat(form.precio_hasta) : null,
      precio_unidad:    form.precio_unidad || null,
      reservable:       form.reservable,
      duracion_minutos: form.reservable && form.duracion_minutos ? parseInt(form.duracion_minutos) : null,
      capacidad_maxima: form.reservable && form.capacidad_maxima ? parseInt(form.capacidad_maxima) : null,
    };

    if (editingId) {
      const { data, error: err } = await supabase
        .from("servicios").update(payload).eq("id", editingId).select(FIELDS).single();
      if (err) { setError("Error al guardar."); setSaving(false); return; }
      setItems((p) => p.map((x) => x.id === editingId ? (data as ServicioDB) : x));
    } else {
      const baseSlug = toSlug(form.nombre) || `servicio-${Date.now()}`;
      const insert = { ...payload, prestador_id: prestadorId, pueblo_id: puebloId, slug: baseSlug };
      let { data, error: err } = await supabase.from("servicios").insert(insert).select(FIELDS).single();
      if (err?.code === "23505") {
        const retry = { ...insert, slug: `${baseSlug}-${Math.random().toString(36).slice(2, 5)}` };
        const r2 = await supabase.from("servicios").insert(retry).select(FIELDS).single();
        data = r2.data; err = r2.error;
      }
      if (err) { setError("Error al guardar."); setSaving(false); return; }
      setItems((p) => [...p, data as ServicioDB]);
    }

    setSaving(false); cancelForm();
  }

  async function toggleActivo(s: ServicioDB) {
    setTogglingId(s.id);
    const supabase = createClient();
    const { error: err } = await supabase.from("servicios").update({ activo: !s.activo }).eq("id", s.id);
    if (!err) setItems((p) => p.map((x) => x.id === s.id ? { ...x, activo: !s.activo } : x));
    setTogglingId(null);
  }

  async function handleDelete(s: ServicioDB) {
    if (!confirm(`¿Eliminar "${s.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(s.id);
    const supabase = createClient();
    const { error: err } = await supabase.from("servicios").delete().eq("id", s.id);
    if (!err) setItems((p) => p.filter((x) => x.id !== s.id));
    setDeletingId(null);
  }

  const inputCls = "w-full font-barlow text-[14px] border border-divisor rounded-input px-3 py-2 focus:outline-none focus:border-primary bg-white";

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="font-barlow text-[14px] text-text-muted">
          {items.length} {items.length === 1 ? "servicio registrado" : "servicios registrados"}
        </p>
        {!showForm && (
          <button type="button" onClick={openAdd}
            className="font-barlow font-semibold text-[13px] text-white bg-primary px-4 py-2 rounded-pill hover:opacity-90 transition-opacity">
            + Nuevo servicio
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-card border border-divisor p-5 mb-4"
          style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}>
          <h3 className="font-barlow font-semibold text-[15px] text-text-body mb-4">
            {editingId ? "Editar servicio" : "Nuevo servicio"}
          </h3>
          <div className="flex flex-col gap-3">

            {/* Nombre */}
            <div>
              <label className="font-barlow text-[12px] text-text-muted block mb-1">Nombre *</label>
              <input id="svc-nombre" type="text" value={form.nombre}
                onChange={(e) => f({ nombre: e.target.value })}
                placeholder="ej: Menú degustación, Corte y peinado, Habitación doble..."
                className={inputCls} />
            </div>

            {/* Categoría + Reservable */}
            <div className="flex gap-3 items-end max-md:flex-col">
              <div className="flex-1">
                <label className="font-barlow text-[12px] text-text-muted block mb-1">Categoría *</label>
                <select value={form.categoria} onChange={(e) => f({ categoria: e.target.value })}
                  className={inputCls}>
                  <option value="" disabled>Elegí una categoría</option>
                  {CAT_GROUPS.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.cats.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 pb-2 cursor-pointer shrink-0">
                <div
                  onClick={() => f({ reservable: !form.reservable })}
                  className="relative rounded-full transition-colors duration-200 cursor-pointer"
                  style={{ width: "36px", height: "20px", background: form.reservable ? "var(--color-primary)" : "#e5e7eb", flexShrink: 0 }}>
                  <div className="absolute rounded-full bg-white"
                    style={{ width: "16px", height: "16px", top: "2px", left: form.reservable ? "calc(100% - 18px)" : "2px", boxShadow: "rgba(0,0,0,0.2) 0px 1px 3px", transition: "left 200ms" }} />
                </div>
                <span className="font-barlow text-[13px] text-text-body">Reservable</span>
              </label>
            </div>

            {/* Descripción */}
            <div>
              <label className="font-barlow text-[12px] text-text-muted block mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => f({ descripcion: e.target.value })}
                rows={2} placeholder="Describí brevemente este servicio..."
                className={inputCls + " resize-none"} />
            </div>

            {/* Precio */}
            <div className="flex gap-3 max-md:flex-col">
              <div className="w-36 max-md:w-full">
                <label className="font-barlow text-[12px] text-text-muted block mb-1">Precio desde (€)</label>
                <input type="number" min="0" step="0.01" value={form.precio_desde}
                  onChange={(e) => f({ precio_desde: e.target.value })}
                  placeholder="0.00" className={inputCls} />
              </div>
              <div className="w-36 max-md:w-full">
                <label className="font-barlow text-[12px] text-text-muted block mb-1">Precio hasta (€)</label>
                <input type="number" min="0" step="0.01" value={form.precio_hasta}
                  onChange={(e) => f({ precio_hasta: e.target.value })}
                  placeholder="opcional" className={inputCls} />
              </div>
              <div className="flex-1">
                <label className="font-barlow text-[12px] text-text-muted block mb-1">Unidad</label>
                <select value={form.precio_unidad} onChange={(e) => f({ precio_unidad: e.target.value })}
                  className={inputCls}>
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Duración + Capacidad (solo si reservable) */}
            {form.reservable && (
              <div className="flex gap-3 max-md:flex-col">
                <div className="flex-1">
                  <label className="font-barlow text-[12px] text-text-muted block mb-1">Duración (minutos)</label>
                  <input type="number" min="1" value={form.duracion_minutos}
                    onChange={(e) => f({ duracion_minutos: e.target.value })}
                    placeholder="60" className={inputCls} />
                </div>
                <div className="flex-1">
                  <label className="font-barlow text-[12px] text-text-muted block mb-1">Capacidad máxima</label>
                  <input type="number" min="1" value={form.capacidad_maxima}
                    onChange={(e) => f({ capacidad_maxima: e.target.value })}
                    placeholder="personas" className={inputCls} />
                </div>
              </div>
            )}

            {error && <p className="font-barlow text-[12px] text-red-600">{error}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={cancelForm}
                className="font-barlow text-[13px] text-text-muted px-4 py-2 border border-divisor rounded-pill hover:bg-fog transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="font-barlow font-semibold text-[13px] text-white bg-primary px-4 py-2 rounded-pill hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {items.map((s) => (
          <div key={s.id}
            className="bg-white rounded-card border border-divisor p-5 flex items-start gap-4"
            style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px", opacity: s.activo ? 1 : 0.6 }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-barlow font-semibold text-[15px] text-text-body">{s.nombre}</span>
                {s.reservable && (
                  <span className="font-barlow text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-sm">Reservable</span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-barlow text-[12px] text-text-muted bg-fog px-2 py-0.5 rounded-sm">
                  {CAT_LABELS[s.categoria] ?? s.categoria}
                </span>
                <PrecioDisplay s={s} />
                {s.duracion_minutos && (
                  <span className="font-barlow text-[12px] text-text-muted">{s.duracion_minutos} min</span>
                )}
              </div>
              {s.descripcion && (
                <p className="font-barlow text-[13px] text-text-muted mt-1.5 line-clamp-2">{s.descripcion}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => openEdit(s)}
                className="font-barlow text-[12px] text-text-muted hover:text-primary transition-colors px-2 py-1 border border-divisor rounded-input bg-fog hover:bg-white">
                Editar
              </button>
              <button type="button" onClick={() => handleDelete(s)} disabled={deletingId === s.id}
                className="font-barlow text-[12px] text-red-400 hover:text-red-600 transition-colors px-2 py-1 border border-red-100 rounded-input hover:bg-red-50 disabled:opacity-50">
                {deletingId === s.id ? "..." : "Eliminar"}
              </button>
              <button type="button" onClick={() => toggleActivo(s)} disabled={togglingId === s.id}
                className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent p-0 disabled:opacity-50">
                <div className="relative rounded-full transition-colors duration-200"
                  style={{ width: "36px", height: "20px", background: s.activo ? "var(--color-primary)" : "#e5e7eb" }}>
                  <div className="absolute rounded-full bg-white"
                    style={{ width: "16px", height: "16px", top: "2px", left: s.activo ? "calc(100% - 18px)" : "2px", boxShadow: "rgba(0,0,0,0.2) 0px 1px 3px", transition: "left 200ms" }} />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <p className="font-barlow text-[15px]">No tenés servicios registrados todavía.</p>
          <p className="font-barlow text-[13px] mt-1">Agregá tu primer servicio con el botón de arriba.</p>
        </div>
      )}
    </div>
  );
}
