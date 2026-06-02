"use client";

import { useState } from "react";

interface Negocio {
  id:                string;
  nombre:            string;
  slug:              string;
  activo:            boolean;
  verificado:        boolean | null;
  delivery_activo:   boolean;
  delivery_modo:     string | null;
  suscripcion_estado: string | null;
  tipo_cocina:       string | null;
  created_at:        string;
  pueblos:           { nombre: string } | null;
}

interface Props {
  negocios:    Negocio[];
  pueblos:     { id: number; nombre: string }[];
  onSuspender: (fd: FormData) => Promise<void>;
  onActivar:   (fd: FormData) => Promise<void>;
}

const SUSCRIPCION_COLOR: Record<string, string> = {
  activa:    "text-emerald-400 bg-emerald-400/10",
  trial:     "text-amber-400 bg-amber-400/10",
  vencida:   "text-red-400 bg-red-400/10",
  cancelada: "text-white/30 bg-white/5",
};

const CATEGORIA_LABEL: Record<string, string> = {
  restaurante:         "Restaurante",
  bar:                 "Bar",
  cafeteria:           "Cafetería",
  heladeria:           "Heladería",
  hotel:               "Hotel",
  apartamento_turistico: "Apartamento",
  camping:             "Camping",
  hostal:              "Hostal",
  supermercado:        "Supermercado",
  panaderia:           "Panadería",
  farmacia:            "Farmacia",
  tienda_ropa:         "Ropa",
  comercio_general:    "Comercio",
  peluqueria:          "Peluquería",
  estetica:            "Estética",
  spa:                 "Spa",
  gimnasio:            "Gimnasio",
  fontaneria:          "Fontanería",
  electricidad:        "Electricidad",
  taller_mecanico:     "Taller",
  limpieza:            "Limpieza",
  jardineria:          "Jardinería",
  clinica:             "Clínica",
  fisioterapia:        "Fisioterapia",
  veterinario:         "Veterinario",
  alquiler_bicis:      "Bicis",
  alquiler_barcos:     "Barcos",
  escuela_nautica:     "Náutica",
  actividades_aventura: "Aventura",
  tour_guiado:         "Tour",
  otro:                "Otro",
};

export default function NegociosAdminView({ negocios, onSuspender, onActivar }: Props) {
  const [busqueda,    setBusqueda]    = useState("");
  const [filtroCateg, setFiltroCateg] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [suspendId,   setSuspendId]   = useState<string | null>(null);
  const [motivo,      setMotivo]      = useState("");

  const categorias = [...new Set(negocios.map((n) => n.tipo_cocina).filter(Boolean))].sort() as string[];

  const filtrados = negocios.filter((n) => {
    if (busqueda     && !n.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroCateg  && n.tipo_cocina !== filtroCateg)  return false;
    if (filtroEstado === "activo"    && !n.activo)     return false;
    if (filtroEstado === "suspendido" && n.activo)     return false;
    if (filtroEstado === "delivery"  && !n.delivery_activo) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-14 md:pt-0">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-barlow text-[12px] text-white/30 uppercase tracking-widest mb-1">Admin</p>
            <h1 className="font-fraunces font-semibold text-[28px] text-white">Negocios</h1>
            <p className="font-barlow text-[13px] text-white/40 mt-1">
              {negocios.length} negocios registrados
            </p>
          </div>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar negocio..."
            className="bg-white/[0.05] border border-white/10 rounded-lg px-4 py-2.5
                       font-barlow text-[13px] text-white placeholder-white/20
                       focus:outline-none focus:border-primary transition-colors w-64"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Categoría */}
          <select
            value={filtroCateg}
            onChange={(e) => setFiltroCateg(e.target.value)}
            className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{CATEGORIA_LABEL[c] ?? c}</option>
            ))}
          </select>

          {/* Estado */}
          {(["", "activo", "suspendido", "delivery"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`font-barlow text-[12px] font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap
                ${filtroEstado === e
                  ? "bg-primary text-white"
                  : "bg-white/[0.05] text-white/40 hover:text-white/70"}`}
            >
              {e === ""          ? `Todos (${negocios.length})`
               : e === "activo"  ? `Activos (${negocios.filter((n) => n.activo).length})`
               : e === "suspendido" ? `Suspendidos (${negocios.filter((n) => !n.activo).length})`
               : `Con delivery (${negocios.filter((n) => n.delivery_activo).length})`}
            </button>
          ))}

          {(filtroCateg || filtroEstado) && (
            <button
              onClick={() => { setFiltroCateg(""); setFiltroEstado(""); }}
              className="font-barlow text-[12px] text-white/30 hover:text-white/60 px-3 py-2"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Negocio", "Categoría", "Pueblo", "Suscripción", "Delivery", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-barlow text-[11px] text-white/30 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((n) => (
                  <tr key={n.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {n.verificado && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                               className="text-primary flex-shrink-0"
                               stroke="currentColor" strokeWidth="2.5">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                          </svg>
                        )}
                        <div>
                          <p className="font-barlow font-medium text-[13px] text-white">{n.nombre}</p>
                          <p className="font-barlow text-[11px] text-white/30">/{n.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-barlow text-[11px] text-white/50 bg-white/[0.06] px-2 py-1 rounded-full">
                        {n.tipo_cocina ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-barlow text-[13px] text-white/60">
                      {(n.pueblos as { nombre: string } | null)?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-barlow text-[11px] font-medium px-2 py-1 rounded-full
                        ${SUSCRIPCION_COLOR[n.suscripcion_estado ?? ""] ?? "text-white/30 bg-white/5"}`}>
                        {n.suscripcion_estado ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {n.delivery_activo ? (
                        <span className="font-barlow text-[11px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                          {n.delivery_modo ?? "activo"}
                        </span>
                      ) : (
                        <span className="font-barlow text-[11px] text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-barlow text-[11px] font-medium px-2 py-1 rounded-full
                        ${n.activo ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
                        {n.activo ? "Activo" : "Suspendido"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {n.activo ? (
                          <button
                            onClick={() => { setSuspendId(n.id); setMotivo(""); }}
                            className="font-barlow text-[11px] text-red-400/70 hover:text-red-400 transition-colors px-2 py-1"
                          >
                            Suspender
                          </button>
                        ) : (
                          <form action={onActivar}>
                            <input type="hidden" name="id" value={n.id} />
                            <button type="submit"
                                    className="font-barlow text-[11px] text-emerald-400/70 hover:text-emerald-400 transition-colors px-2 py-1">
                              Activar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center font-barlow text-[13px] text-white/30">
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal suspender */}
        {suspendId && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#161920] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md">
              <h3 className="font-fraunces font-semibold text-[20px] text-white mb-1">Suspender negocio</h3>
              <p className="font-barlow text-[13px] text-white/40 mb-5">
                El negocio quedará inactivo y no podrá recibir pedidos ni reservas.
              </p>
              <form action={onSuspender} onSubmit={() => setSuspendId(null)}>
                <input type="hidden" name="id" value={suspendId} />
                <label className="block font-barlow text-[12px] text-white/50 mb-1.5">
                  Motivo de suspensión *
                </label>
                <textarea
                  name="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5
                             font-barlow text-[13px] text-white placeholder-white/20
                             focus:outline-none focus:border-primary transition-colors resize-none mb-4"
                  placeholder="Ej: Documentación pendiente, incumplimiento de términos..."
                />
                <div className="flex gap-3">
                  <button type="submit"
                          className="flex-1 font-barlow font-bold text-[13px] text-white bg-red-500 rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity">
                    Suspender
                  </button>
                  <button type="button" onClick={() => setSuspendId(null)}
                          className="font-barlow text-[13px] text-white/40 hover:text-white/70 transition-colors px-4 py-2.5">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
