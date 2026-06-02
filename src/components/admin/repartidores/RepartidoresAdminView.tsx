"use client";

import { useState } from "react";

interface Repartidor {
  id:                  string;
  usuario_id:          string;
  pueblo_id:           number;
  vehiculo:            string | null;
  dni_nif:             string | null;
  iban_pago:           string | null;
  telefono_emergencia: string | null;
  activo:              boolean;
  en_turno:            boolean;
  temporada_actual:    string | null;
  pedidos_completados: number;
  rating_promedio:     number | null;
  usuarios:            { email: string; nombre: string | null } | null;
  pueblos:             { nombre: string } | null;
}

interface Props {
  repartidores: Repartidor[];
  pueblos:      { id: number; nombre: string }[];
  onToggle:     (fd: FormData) => Promise<void>;
  onCrear:      (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  onEditar:     (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  onVincular?:  (usuarioId: string, puebloId: number, vehiculo?: string) => Promise<{ ok: boolean; error?: string }>;
  onAdminAvanzarPedido?: (pedidoId: string, estado: string, repartidorId?: string) => Promise<{ ok: boolean; error?: string }>;
}

const VEHICULO_EMOJI: Record<string, string> = {
  moto:      "🛵",
  bici:      "🚲",
  coche:     "🚗",
  a_pie:     "🚶",
  patinete:  "🛴",
};

const VEHICULOS = [
  { value: "moto",     label: "🛵 Moto" },
  { value: "bici",     label: "🚲 Bicicleta" },
  { value: "coche",    label: "🚗 Coche" },
  { value: "a_pie",    label: "🚶 A pie" },
  { value: "patinete", label: "🛴 Patinete" },
];

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block font-barlow text-[12px] text-white/40 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 font-barlow text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-primary transition-colors";
const selectCls = "w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 font-barlow text-[13px] text-white focus:outline-none focus:border-primary transition-colors";

export default function RepartidoresAdminView({ repartidores, pueblos, onToggle, onCrear, onEditar }: Props) {
  const [showModal,  setShowModal]  = useState(false);
  const [editando,   setEditando]   = useState<Repartidor | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [licNombre,  setLicNombre]  = useState<string | null>(null);

  const activos   = repartidores.filter((r) => r.activo);
  const inactivos = repartidores.filter((r) => !r.activo);

  async function handleSubmitCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await onCrear(fd);
    setLoading(false);
    if (res.ok) { setShowModal(false); setLicNombre(null); }
    else setError(res.error ?? "Error desconocido");
  }

  async function handleSubmitEditar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await onEditar(fd);
    setLoading(false);
    if (res.ok) { setEditando(null); setLicNombre(null); }
    else setError(res.error ?? "Error desconocido");
  }

  function RepartidorCard({ r }: { r: Repartidor }) {
    return (
      <div className={`bg-white/[0.03] rounded-xl border p-5 transition-all
        ${r.activo ? "border-white/[0.08]" : "border-white/[0.03] opacity-60"}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-[18px]">{VEHICULO_EMOJI[r.vehiculo ?? ""] ?? "🛵"}</span>
            </div>
            <div>
              <p className="font-barlow font-medium text-[14px] text-white">
                {r.usuarios?.nombre ?? r.usuarios?.email ?? "Sin nombre"}
              </p>
              <p className="font-barlow text-[11px] text-white/30">
                {r.pueblos?.nombre ?? "—"} · {r.vehiculo ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {r.en_turno && (
              <span className="font-barlow text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                En turno
              </span>
            )}
            <span className={`font-barlow text-[10px] px-2 py-0.5 rounded-full
              ${r.activo ? "text-white/50 bg-white/[0.05]" : "text-red-400/60 bg-red-400/10"}`}>
              {r.activo ? (r.temporada_actual ?? "activo") : "inactivo"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <p className="font-fraunces font-semibold text-[20px] text-white">{r.pedidos_completados}</p>
            <p className="font-barlow text-[10px] text-white/30">entregas</p>
          </div>
          <div className="text-center">
            <p className="font-fraunces font-semibold text-[20px] text-white">
              {r.rating_promedio != null ? r.rating_promedio.toFixed(1) : "—"}
            </p>
            <p className="font-barlow text-[10px] text-white/30">rating</p>
          </div>
          <div className="text-center">
            <p className="font-barlow text-[11px] text-white/40 pt-2 truncate">
              {r.telefono_emergencia ?? "—"}
            </p>
            <p className="font-barlow text-[10px] text-white/30">tel. emergencia</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setEditando(r); setError(null); setLicNombre(null); }}
            className="flex-1 font-barlow font-medium text-[12px] py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Editar
          </button>
          <form action={onToggle} className="flex-1">
            <input type="hidden" name="id"     value={r.id} />
            <input type="hidden" name="activo" value={String(!r.activo)} />
            <button type="submit"
                    className={`w-full font-barlow font-medium text-[12px] py-2 rounded-lg transition-colors
                      ${r.activo
                        ? "text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                        : "text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-400/10"}`}>
              {r.activo ? "Dar de baja" : "Dar de alta"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-14 md:pt-0">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="font-barlow text-[12px] text-white/30 uppercase tracking-widest mb-1">Admin</p>
            <h1 className="font-fraunces font-semibold text-[28px] text-white">Repartidores</h1>
            <p className="font-barlow text-[13px] text-white/40 mt-1">
              {activos.length} activos · {inactivos.length} inactivos
            </p>
          </div>
          <button
            onClick={() => { setShowModal(true); setError(null); }}
            className="font-barlow font-bold text-[13px] text-white bg-primary rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
          >
            + Nuevo repartidor
          </button>
        </div>

        {/* Activos */}
        {activos.length > 0 && (
          <div className="mb-8">
            <h2 className="font-barlow text-[12px] text-white/40 uppercase tracking-wider mb-3">En temporada</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activos.map((r) => <RepartidorCard key={r.id} r={r} />)}
            </div>
          </div>
        )}

        {/* Inactivos */}
        {inactivos.length > 0 && (
          <div>
            <h2 className="font-barlow text-[12px] text-white/30 uppercase tracking-wider mb-3">Fuera de temporada</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactivos.map((r) => <RepartidorCard key={r.id} r={r} />)}
            </div>
          </div>
        )}

        {repartidores.length === 0 && (
          <div className="text-center py-20">
            <p className="font-barlow text-[13px] text-white/30">No hay repartidores registrados aún.</p>
          </div>
        )}
      </div>

      {/* Modal nuevo repartidor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#161920] border border-white/[0.1] rounded-2xl p-6 w-full max-w-xl my-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-fraunces font-semibold text-[22px] text-white">Nuevo repartidor</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitCrear} className="space-y-4">

              {/* Sección cuenta */}
              <p className="font-barlow text-[11px] text-white/30 uppercase tracking-widest">Cuenta de acceso</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre completo" required>
                  <input name="nombre" required placeholder="Carlos García" className={inputCls} />
                </Field>
                <Field label="Email" required>
                  <input name="email" type="email" required placeholder="carlos@email.com" className={inputCls} />
                </Field>
              </div>

              <Field label="Contraseña temporal" required>
                <input name="password" type="password" required minLength={8} placeholder="Mínimo 8 caracteres" className={inputCls} />
              </Field>

              {/* Sección asignación */}
              <p className="font-barlow text-[11px] text-white/30 uppercase tracking-widest pt-2">Asignación</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Pueblo" required>
                  <select name="pueblo_id" required className={selectCls}>
                    <option value="">Seleccionar...</option>
                    {pueblos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Vehículo">
                  <select name="vehiculo" className={selectCls}>
                    {VEHICULOS.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Sección datos personales */}
              <p className="font-barlow text-[11px] text-white/30 uppercase tracking-widest pt-2">Datos personales</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="DNI / NIE">
                  <input name="dni_nif" placeholder="12345678A" className={inputCls} />
                </Field>
                <Field label="Teléfono de emergencia">
                  <input name="telefono" type="tel" placeholder="+34 600 000 000" className={inputCls} />
                </Field>
              </div>

              <Field label="IBAN para liquidaciones">
                <input name="iban" placeholder="ES00 0000 0000 0000 0000 0000" className={inputCls} />
              </Field>

              {/* Licencia */}
              <p className="font-barlow text-[11px] text-white/30 uppercase tracking-widest pt-2">Documentación</p>

              <Field label="Licencia de conducir (opcional)">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`flex-1 px-3 py-2.5 rounded-lg border font-barlow text-[13px] transition-colors
                    ${licNombre ? "border-primary/40 text-white/70 bg-primary/5" : "border-white/10 text-white/20 bg-white/[0.05]"}`}>
                    {licNombre ?? "Seleccionar archivo..."}
                  </div>
                  <input
                    name="licencia"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setLicNombre(e.target.files?.[0]?.name ?? null)}
                  />
                  <span className="font-barlow text-[12px] text-white/40 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 whitespace-nowrap">
                    Subir
                  </span>
                </label>
                <p className="font-barlow text-[11px] text-white/20 mt-1">PDF, JPG o PNG · máx. 5 MB</p>
              </Field>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="font-barlow text-[13px] text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 font-barlow font-bold text-[13px] text-white bg-primary rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Creando cuenta..." : "Crear repartidor"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="font-barlow text-[13px] text-white/40 hover:text-white/70 px-4 py-2.5 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar repartidor */}
      {editando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#161920] border border-white/[0.1] rounded-2xl p-6 w-full max-w-xl my-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-fraunces font-semibold text-[22px] text-white">Editar repartidor</h3>
                <p className="font-barlow text-[12px] text-white/30 mt-0.5">{editando.usuarios?.email}</p>
              </div>
              <button
                onClick={() => setEditando(null)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitEditar} className="space-y-4">
              <input type="hidden" name="id"         value={editando.id} />
              <input type="hidden" name="usuario_id" value={editando.usuario_id} />

              <p className="font-barlow text-[11px] text-white/30 uppercase tracking-widest">Datos personales</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre completo" required>
                  <input name="nombre" required defaultValue={editando.usuarios?.nombre ?? ""} className={inputCls} />
                </Field>
                <Field label="DNI / NIE">
                  <input name="dni_nif" defaultValue={editando.dni_nif ?? ""} placeholder="12345678A" className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Teléfono de emergencia">
                  <input name="telefono" type="tel" defaultValue={editando.telefono_emergencia ?? ""} placeholder="+34 600 000 000" className={inputCls} />
                </Field>
                <Field label="IBAN para liquidaciones">
                  <input name="iban" defaultValue={editando.iban_pago ?? ""} placeholder="ES00 0000..." className={inputCls} />
                </Field>
              </div>

              <p className="font-barlow text-[11px] text-white/30 uppercase tracking-widest pt-2">Asignación</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Pueblo" required>
                  <select name="pueblo_id" required defaultValue={editando.pueblo_id} className={selectCls}>
                    {pueblos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Vehículo">
                  <select name="vehiculo" defaultValue={editando.vehiculo ?? "moto"} className={selectCls}>
                    {VEHICULOS.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Temporada actual">
                <input name="temporada" defaultValue={editando.temporada_actual ?? ""} placeholder="verano_2026" className={inputCls} />
              </Field>

              <p className="font-barlow text-[11px] text-white/30 uppercase tracking-widest pt-2">Documentación</p>

              <Field label="Reemplazar licencia (opcional)">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`flex-1 px-3 py-2.5 rounded-lg border font-barlow text-[13px] transition-colors
                    ${licNombre ? "border-primary/40 text-white/70 bg-primary/5" : "border-white/10 text-white/20 bg-white/[0.05]"}`}>
                    {licNombre ?? "Seleccionar archivo..."}
                  </div>
                  <input
                    name="licencia"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setLicNombre(e.target.files?.[0]?.name ?? null)}
                  />
                  <span className="font-barlow text-[12px] text-white/40 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 whitespace-nowrap">
                    Subir
                  </span>
                </label>
              </Field>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="font-barlow text-[13px] text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 font-barlow font-bold text-[13px] text-white bg-primary rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="font-barlow text-[13px] text-white/40 hover:text-white/70 px-4 py-2.5 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
