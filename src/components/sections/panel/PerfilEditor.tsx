"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadPortada, uploadGaleria, deleteStorageFile } from "@/lib/supabase/storage";
import { getCatFromServicios } from "@/lib/utils/prestadores";
import type { PanelPrestador } from "@/lib/supabase/queries/panel";

const TIPOS_COCINA = [
  "Española / Mediterránea", "Italiana", "Japonesa / Sushi", "Mexicana",
  "Americana / Hamburguesería", "China", "India", "Árabe / Libanesa",
  "Francesa", "Griega", "Mariscos", "Parrilla / Asador",
  "Vegana / Vegetariana", "Pizza", "Tapas / Pintxos", "Fusión", "Otra",
];

/* ─── Photo upload zone ─────────────────────────────────────────────────────── */
function PhotoZone({
  url,
  onUpload,
  loading,
  label,
  aspectClass = "aspect-video",
}: {
  url: string | null;
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
  label: string;
  aspectClass?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    await onUpload(file);
  }

  return (
    <div>
      <p className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2">{label}</p>
      <div
        className={`${aspectClass} relative rounded-card border-2 border-dashed overflow-hidden cursor-pointer transition-all duration-200`}
        style={{ borderColor: dragging ? "var(--color-primary)" : "#e5e7eb", background: dragging ? "rgba(0,112,204,0.04)" : "#fafafa" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {url ? (
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-200"
          style={{ background: url ? "rgba(0,0,0,0.45)" : "transparent", opacity: url && !dragging && !loading ? 0 : 1 }}
        >
          {loading ? (
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={url ? "white" : "var(--color-primary)"} strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={url ? "white" : "var(--color-primary)"} strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="font-barlow text-[13px] font-medium" style={{ color: url ? "white" : "#6b6b6b" }}>
                {url ? "Cambiar foto" : "Subir foto"}
              </p>
              <p className="font-barlow text-[11px]" style={{ color: url ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>
                JPG, PNG o WebP · máx 5MB
              </p>
            </>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}

/* ─── Field ─────────────────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full font-barlow text-[15px] text-text-body border border-[#e5e7eb] rounded-card px-4 py-2.5 outline-none focus:border-primary transition-colors placeholder:text-text-muted";

/* ─── Main component ─────────────────────────────────────────────────────────── */
export default function PerfilEditor({ prestador }: { prestador: PanelPrestador }) {
  const catId = getCatFromServicios(prestador.servicios).id;
  const isComida = catId === "restaurantes" || catId === "bares";

  const [form, setForm] = useState({
    nombre:            prestador.nombre,
    descripcion_corta: prestador.descripcion_corta ?? "",
    descripcion:       prestador.descripcion ?? "",
    telefono:          prestador.telefono,
    whatsapp:          prestador.whatsapp ?? "",
    web:               prestador.web ?? "",
    instagram:         prestador.instagram ?? "",
    facebook:          prestador.facebook ?? "",
    tiktok:            prestador.tiktok ?? "",
    direccion:         prestador.direccion,
    tipo_cocina:       prestador.tipo_cocina ?? "",
  });
  const [portadaUrl, setPortadaUrl]     = useState(prestador.imagen_portada_url);
  const [galeriaUrls, setGaleriaUrls]   = useState<string[]>(prestador.galeria_urls ?? []);
  const [uploadingPortada, setUploadingPortada] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState("");
  const galeriaRef                      = useRef<HTMLInputElement>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    setSaved(false);
  }

  async function handlePortadaUpload(file: File) {
    setUploadingPortada(true);
    const url = await uploadPortada(prestador.id, file);
    if (url) {
      setPortadaUrl(url);
      await updateField("imagen_portada_url", url);
    } else {
      setError("Error al subir la foto. Verificá que el bucket 'prestadores' existe en Supabase Storage.");
    }
    setUploadingPortada(false);
  }

  async function handleGaleriaUpload(file: File) {
    setUploadingGaleria(true);
    const url = await uploadGaleria(prestador.id, file);
    if (url) {
      const newUrls = [...galeriaUrls, url];
      setGaleriaUrls(newUrls);
      await updateField("galeria_urls", newUrls);
    }
    setUploadingGaleria(false);
  }

  async function removeGaleriaPhoto(url: string) {
    const newUrls = galeriaUrls.filter((u) => u !== url);
    setGaleriaUrls(newUrls);
    await updateField("galeria_urls", newUrls);
    await deleteStorageFile(url);
  }

  async function updateField(field: string, value: unknown) {
    const supabase = createClient();
    await supabase.from("prestadores").update({ [field]: value }).eq("id", prestador.id);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("prestadores")
      .update({ ...form })
      .eq("id", prestador.id);
    setSaving(false);
    if (err) { setError("No se pudo guardar. Intentá de nuevo."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl">
      {/* Portada */}
      <section className="bg-white rounded-card border border-divisor p-6 mb-6" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}>
        <h2 className="font-barlow font-semibold text-[16px] text-text-body mb-4">Foto de portada</h2>
        <PhotoZone
          url={portadaUrl}
          onUpload={handlePortadaUpload}
          loading={uploadingPortada}
          label="Portada (aparece en la tarjeta del servicio)"
          aspectClass="aspect-video max-h-56"
        />
      </section>

      {/* Galería */}
      <section className="bg-white rounded-card border border-divisor p-6 mb-6" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}>
        <h2 className="font-barlow font-semibold text-[16px] text-text-body mb-1">Galería</h2>
        <p className="font-barlow text-[13px] text-text-muted mb-4">Hasta 10 fotos. Aparecen en el detalle del servicio.</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {galeriaUrls.map((url) => (
            <div key={url} className="relative aspect-square rounded-card overflow-hidden group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeGaleriaPhoto(url)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
          {galeriaUrls.length < 10 && (
            <button
              type="button"
              onClick={() => galeriaRef.current?.click()}
              disabled={uploadingGaleria}
              className="aspect-square rounded-card border-2 border-dashed border-[#e5e7eb] flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-transparent hover:border-primary/60 transition-colors disabled:opacity-50"
            >
              {uploadingGaleria ? (
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span className="font-barlow text-[11px] text-text-muted">Agregar</span>
                </>
              )}
            </button>
          )}
        </div>
        <input ref={galeriaRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { const files = Array.from(e.target.files ?? []); for (const f of files) { await handleGaleriaUpload(f); } e.target.value = ""; }} />
      </section>

      {/* Info básica */}
      <section className="bg-white rounded-card border border-divisor p-6 mb-6" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}>
        <h2 className="font-barlow font-semibold text-[16px] text-text-body mb-5">Información del negocio</h2>
        <div className="flex flex-col gap-4">
          <Field label="Nombre del negocio">
            <input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Descripción corta (aparece en la tarjeta)">
            <input value={form.descripcion_corta} onChange={(e) => set("descripcion_corta", e.target.value)} maxLength={200} placeholder="Una línea que describe tu negocio" className={inputCls} />
            <p className="font-barlow text-[11px] text-text-muted mt-1 text-right">{form.descripcion_corta.length}/200</p>
          </Field>
          <Field label="Descripción completa">
            <textarea value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} rows={4} placeholder="Contá más sobre tu negocio, historia, especialidades..." className={inputCls + " resize-none"} />
          </Field>
          <Field label="Dirección">
            <input value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Calle, número, localidad" className={inputCls} />
          </Field>
          {isComida && (
            <Field label="Tipo de cocina">
              <select value={form.tipo_cocina} onChange={(e) => set("tipo_cocina", e.target.value)} className={inputCls + " cursor-pointer"}>
                <option value="">Sin especificar</option>
                {TIPOS_COCINA.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="font-barlow text-[11px] text-text-muted mt-1">Aparece como filtro en la página de servicios.</p>
            </Field>
          )}
        </div>
      </section>

      {/* Contacto */}
      <section className="bg-white rounded-card border border-divisor p-6 mb-6" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}>
        <h2 className="font-barlow font-semibold text-[16px] text-text-body mb-5">Contacto y redes</h2>
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <Field label="Teléfono">
            <input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} type="tel" className={inputCls} />
          </Field>
          <Field label="WhatsApp">
            <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} type="tel" placeholder="+34 600 000 000" className={inputCls} />
          </Field>
          <Field label="Sitio web">
            <input value={form.web} onChange={(e) => set("web", e.target.value)} type="url" placeholder="https://..." className={inputCls} />
          </Field>
          <Field label="Instagram">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-barlow text-text-muted text-[15px]">@</span>
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="tu_negocio" className={inputCls + " pl-8"} />
            </div>
          </Field>
          <Field label="Facebook">
            <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="facebook.com/tu-negocio" className={inputCls} />
          </Field>
          <Field label="TikTok">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-barlow text-text-muted text-[15px]">@</span>
              <input value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="tu_negocio" className={inputCls + " pl-8"} />
            </div>
          </Field>
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-white border-t border-divisor px-6 py-4 -mx-8 flex items-center justify-between max-md:-mx-4" style={{ boxShadow: "rgba(0,0,0,0.08) 0px -4px 16px" }}>
        {error && <p className="font-barlow text-[13px] text-red-600">{error}</p>}
        {saved && !error && <p className="font-barlow text-[13px] text-green-600 flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Guardado</p>}
        {!error && !saved && <span />}
        <button
          type="submit"
          disabled={saving}
          className="font-barlow font-bold text-[15px] text-white bg-primary rounded-pill px-7 py-2.5 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
