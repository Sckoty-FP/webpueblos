"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CATEGORIAS = [
  { group: "Hostelería",   items: [{ value: "restaurante", label: "Restaurante" }, { value: "bar", label: "Bar" }, { value: "cafeteria", label: "Cafetería" }, { value: "heladeria", label: "Heladería" }] },
  { group: "Hospedaje",    items: [{ value: "hotel", label: "Hotel" }, { value: "apartamento_turistico", label: "Apartamento turístico" }, { value: "camping", label: "Camping" }, { value: "hostal", label: "Hostal" }] },
  { group: "Comercio",     items: [{ value: "supermercado", label: "Supermercado" }, { value: "panaderia", label: "Panadería" }, { value: "farmacia", label: "Farmacia" }, { value: "tienda_ropa", label: "Tienda de ropa" }, { value: "comercio_general", label: "Comercio general" }] },
  { group: "Servicios personales", items: [{ value: "peluqueria", label: "Peluquería" }, { value: "estetica", label: "Estética" }, { value: "spa", label: "Spa" }, { value: "gimnasio", label: "Gimnasio" }] },
  { group: "Profesionales", items: [{ value: "fontaneria", label: "Fontanería" }, { value: "electricidad", label: "Electricidad" }, { value: "taller_mecanico", label: "Taller mecánico" }, { value: "limpieza", label: "Limpieza" }, { value: "jardineria", label: "Jardinería" }] },
  { group: "Salud",        items: [{ value: "clinica", label: "Clínica" }, { value: "fisioterapia", label: "Fisioterapia" }, { value: "veterinario", label: "Veterinario" }] },
  { group: "Ocio y deporte", items: [{ value: "alquiler_bicis", label: "Alquiler de bicis" }, { value: "alquiler_barcos", label: "Alquiler de barcos" }, { value: "escuela_nautica", label: "Escuela náutica" }, { value: "actividades_aventura", label: "Actividades aventura" }, { value: "tour_guiado", label: "Tour guiado" }] },
  { group: "Otro",         items: [{ value: "otro", label: "Otro" }] },
];

function toSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

interface Pueblo {
  id: number;
  nombre: string;
  slug: string;
}

export default function PanelOnboarding({
  userEmail,
  pueblos,
}: {
  userEmail: string;
  pueblos: Pueblo[];
}) {
  const [nombre,      setNombre]      = useState("");
  const [categoria,   setCategoria]   = useState("");
  const [puebloId,    setPuebloId]    = useState<number>(pueblos[0]?.id ?? 0);
  const [email,       setEmail]       = useState(userEmail);
  const [telefono,    setTelefono]    = useState("");
  const [direccion,   setDireccion]   = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !categoria || !email.trim() || !telefono.trim() || !direccion.trim()) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sesión expirada. Recargá la página."); setLoading(false); return; }

    const baseSlug = toSlug(nombre);
    const slug = baseSlug || `negocio-${Date.now()}`;

    const { error: err } = await supabase.from("prestadores").insert({
      pueblo_id:        puebloId,
      propietario_id:   user.id,
      nombre:           nombre.trim(),
      slug,
      descripcion_corta: descripcion.trim() || null,
      email:            email.trim(),
      telefono:         telefono.trim(),
      direccion:        direccion.trim(),
      activo:           false,
      verificado:       false,
    });

    if (err) {
      // Slug conflict — append random suffix and retry
      if (err.code === "23505") {
        const slugAlt = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
        const { error: err2 } = await supabase.from("prestadores").insert({
          pueblo_id:        puebloId,
          propietario_id:   user.id,
          nombre:           nombre.trim(),
          slug:             slugAlt,
          descripcion_corta: descripcion.trim() || null,
          email:            email.trim(),
          telefono:         telefono.trim(),
          direccion:        direccion.trim(),
          activo:           false,
          verificado:       false,
        });
        if (err2) { setError("Error al enviar la solicitud. Intentá de nuevo."); setLoading(false); return; }
      } else {
        setError("Error al enviar la solicitud. Intentá de nuevo.");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-fog flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-card-lg border border-divisor p-10" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#dcfce7" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="font-fraunces font-semibold text-[24px] text-text-body mb-3">¡Solicitud enviada!</h1>
          <p className="font-barlow text-[14px] text-text-muted mb-2">
            Recibimos los datos de <strong>{nombre}</strong>.
          </p>
          <p className="font-barlow text-[14px] text-text-muted mb-8">
            Los revisaremos y activaremos tu perfil en breve. Te avisaremos por email a <strong>{email}</strong>.
          </p>
          <Link
            href="/"
            className="inline-block font-barlow font-bold text-white bg-primary rounded-pill px-6 py-3 no-underline hover:opacity-90 transition-opacity"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 className="font-fraunces font-semibold text-[26px] text-text-body mb-2">Registrá tu negocio</h1>
          <p className="font-barlow text-[14px] text-text-muted">
            Completá estos datos. Los verificaremos y activaremos tu perfil en breve.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-card-lg border border-divisor p-7 flex flex-col gap-4"
          style={{ boxShadow: "rgba(0,0,0,0.06) 0px 4px 24px" }}
        >
          {/* Nombre */}
          <div>
            <label className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
              Nombre del negocio *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Restaurante Las Fuentes"
              className="w-full font-barlow text-[15px] border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary transition-colors placeholder:text-text-muted"
            />
          </div>

          {/* Categoría + Pueblo (row) */}
          <div className="flex gap-3 max-md:flex-col">
            <div className="flex-1">
              <label className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full font-barlow text-[15px] border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary transition-colors bg-white"
              >
                <option value="" disabled>Elegí una categoría</option>
                {CATEGORIAS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {pueblos.length > 1 && (
              <div className="flex-1">
                <label className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
                  Pueblo *
                </label>
                <select
                  value={puebloId}
                  onChange={(e) => setPuebloId(Number(e.target.value))}
                  className="w-full font-barlow text-[15px] border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary transition-colors bg-white"
                >
                  {pueblos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Email + Teléfono (row) */}
          <div className="flex gap-3 max-md:flex-col">
            <div className="flex-1">
              <label className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
                Email de contacto *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full font-barlow text-[15px] border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary transition-colors placeholder:text-text-muted"
              />
            </div>
            <div className="w-44 max-md:w-full">
              <label className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
                Teléfono *
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="600 000 000"
                className="w-full font-barlow text-[15px] border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary transition-colors placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
              Dirección *
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle Mayor 12, Alcocèber"
              className="w-full font-barlow text-[15px] border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary transition-colors placeholder:text-text-muted"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
              Descripción breve <span className="normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Contá en pocas palabras qué ofrece tu negocio..."
              className="w-full font-barlow text-[15px] border border-divisor rounded-card px-4 py-3 outline-none focus:border-primary transition-colors resize-none placeholder:text-text-muted"
            />
          </div>

          {error && (
            <p className="font-barlow text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-card px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-barlow font-bold text-[15px] text-white bg-primary rounded-pill py-3.5 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Enviando solicitud...
              </>
            ) : "Enviar solicitud →"}
          </button>

          <p className="font-barlow text-[12px] text-text-muted text-center">
            Una vez aprobado, recibirás un email y podrás acceder al panel completo.
          </p>
        </form>
      </div>
    </div>
  );
}
