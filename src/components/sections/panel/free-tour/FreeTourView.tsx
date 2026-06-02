"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  FreeTourDB,
  FreeTourInscripcionDB,
  ComisionAcumuladaDB,
  EstadoInscripcionFreeTour,
} from "@/types/free-tour";
import type { SesionConTour, InscripcionConSesion } from "@/lib/supabase/queries/free-tour";
import { formatCurrency } from "@/lib/format/currency";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Badge pills ─────────────────────────────────────────────────────────────

const ESTADO_COLOR: Record<EstadoInscripcionFreeTour, { bg: string; text: string }> = {
  confirmada:        { bg: "#dcfce7", text: "#15803d" },
  cancelada_cliente: { bg: "#fee2e2", text: "#b91c1c" },
  cancelada_guia:    { bg: "#fee2e2", text: "#b91c1c" },
  no_show:           { bg: "#fef9c3", text: "#854d0e" },
  asistio:           { bg: "#dbeafe", text: "#1d4ed8" },
};
const ESTADO_LABEL: Record<EstadoInscripcionFreeTour, string> = {
  confirmada:        "Confirmada",
  cancelada_cliente: "Cancelada",
  cancelada_guia:    "Cancelada (guía)",
  no_show:           "No-show",
  asistio:           "Asistió",
};

function EstadoBadge({ estado }: { estado: EstadoInscripcionFreeTour }) {
  const c = ESTADO_COLOR[estado];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: c.bg, color: c.text,
      borderRadius: 999, padding: "2px 10px",
      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
    }}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}

// ─── Modal base ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16,
        width: "100%", maxWidth: 600,
        maxHeight: "90vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #f3f3f3",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1f1f1f" }}>{title}</span>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#f5f7fa", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "#6b6b6b",
          }}>×</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b6b6b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #cccccc", fontSize: 14, color: "#1f1f1f",
  background: "#fff", outline: "none", boxSizing: "border-box",
};

// ─── Tour Modal ───────────────────────────────────────────────────────────────

function TourModal({
  tour,
  onSave,
  onClose,
}: {
  tour?: FreeTourDB | null;
  onSave: (fd: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [titulo, setTitulo] = useState(tour?.titulo ?? "");
  const [pending, startT] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!tour) fd.set("slug", slugify(titulo));
    else fd.set("tour_id", tour.id);
    startT(async () => {
      await onSave(fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal title={tour ? "Editar tour" : "Nuevo tour"} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Título">
          <input name="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required style={inputStyle} placeholder="Tour casco antiguo Alcossebre" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Duración (min)">
            <input name="duracion_minutos" type="number" defaultValue={tour?.duracion_minutos ?? 90} required style={inputStyle} />
          </Field>
          <Field label="Cupo máximo">
            <input name="cupo_maximo" type="number" defaultValue={tour?.cupo_maximo ?? 20} required style={inputStyle} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Distancia (km)">
            <input name="distancia_km" type="number" step="0.1" defaultValue={tour?.distancia_km ?? ""} style={inputStyle} placeholder="2.5" />
          </Field>
          <Field label="Dificultad">
            <select name="dificultad" defaultValue={tour?.dificultad ?? "facil"} style={inputStyle}>
              <option value="facil">Fácil</option>
              <option value="media">Media</option>
              <option value="dificil">Difícil</option>
            </select>
          </Field>
        </div>
        <Field label="Punto de encuentro">
          <input name="punto_encuentro_nombre" defaultValue={tour?.punto_encuentro_nombre ?? ""} style={inputStyle} placeholder="Plaza de la Iglesia" />
        </Field>
        <Field label="Descripción corta">
          <input name="descripcion_corta" defaultValue={tour?.descripcion_corta ?? ""} style={inputStyle} placeholder="Un paseo por el centro histórico..." maxLength={200} />
        </Field>
        <Field label="Descripción completa">
          <textarea name="descripcion" defaultValue={tour?.descripcion ?? ""} required rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </Field>
        <Field label="Idiomas (separados por coma)">
          <input name="idiomas" defaultValue={(tour?.idiomas ?? ["es"]).join(",")} style={inputStyle} placeholder="es,en" />
        </Field>
        <Field label="Incluye (separado por coma)">
          <input name="incluye" defaultValue={(tour?.incluye ?? []).join(",")} style={inputStyle} placeholder="Guía local,Folleto" />
        </Field>
        <Field label="Qué llevar (separado por coma)">
          <input name="llevar" defaultValue={(tour?.llevar ?? []).join(",")} style={inputStyle} placeholder="Zapatillas cómodas,Crema solar" />
        </Field>
        <Field label="Observaciones">
          <textarea name="observaciones" defaultValue={tour?.observaciones ?? ""} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={{
            padding: "10px 20px", background: "#f5f7fa", border: "1px solid #f3f3f3",
            borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#3a3a3a", cursor: "pointer",
          }}>Cancelar</button>
          <button type="submit" disabled={pending} style={{
            padding: "10px 24px", background: "#000", color: "#fff", border: "none",
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: pending ? 0.7 : 1,
          }}>{pending ? "Guardando…" : "Guardar tour"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Sesión Modal ─────────────────────────────────────────────────────────────

function SesionModal({
  tourId,
  cupoDefault,
  onCrearUnica,
  onCrearRecurrentes,
  onClose,
}: {
  tourId: string;
  cupoDefault: number;
  onCrearUnica: (fd: FormData) => Promise<void>;
  onCrearRecurrentes: (fd: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [modo, setModo] = useState<"unica" | "semanal">("unica");
  const [diasSel, setDiasSel] = useState<number[]>([]);
  const [pending, startT] = useTransition();
  const router = useRouter();
  const hoy = new Date().toISOString().split("T")[0];

  const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  function toggleDia(d: number) {
    setDiasSel((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tour_id", tourId);
    if (modo === "semanal") fd.set("dias_semana", diasSel.join(","));
    startT(async () => {
      if (modo === "unica") await onCrearUnica(fd);
      else await onCrearRecurrentes(fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal title="Programar sesiones" onClose={onClose}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["unica", "semanal"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setModo(m)} style={{
            flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: modo === m ? "#000" : "#f5f7fa",
            color: modo === m ? "#fff" : "#6b6b6b",
            border: modo === m ? "none" : "1px solid #f3f3f3",
          }}>
            {m === "unica" ? "Sesión única" : "Recurrente (semanal)"}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        {modo === "unica" ? (
          <Field label="Fecha">
            <input name="fecha" type="date" min={hoy} required style={inputStyle} />
          </Field>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Desde">
                <input name="fecha_desde" type="date" min={hoy} required style={inputStyle} />
              </Field>
              <Field label="Hasta">
                <input name="fecha_hasta" type="date" min={hoy} required style={inputStyle} />
              </Field>
            </div>
            <Field label="Días de la semana">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DIAS.map((d, i) => (
                  <button key={i} type="button" onClick={() => toggleDia(i)} style={{
                    width: 40, height: 40, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: diasSel.includes(i) ? "#0070cc" : "#f5f7fa",
                    color: diasSel.includes(i) ? "#fff" : "#6b6b6b",
                    border: diasSel.includes(i) ? "none" : "1px solid #f3f3f3",
                  }}>{d}</button>
                ))}
              </div>
            </Field>
          </>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Hora">
            <input name="hora" type="time" required style={inputStyle} />
          </Field>
          <Field label="Cupo">
            <input name="cupo_sesion" type="number" defaultValue={cupoDefault} required style={inputStyle} />
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={{
            padding: "10px 20px", background: "#f5f7fa", border: "1px solid #f3f3f3",
            borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#3a3a3a", cursor: "pointer",
          }}>Cancelar</button>
          <button type="submit" disabled={pending || (modo === "semanal" && diasSel.length === 0)} style={{
            padding: "10px 24px", background: "#000", color: "#fff", border: "none",
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: pending ? 0.7 : 1,
          }}>{pending ? "Creando…" : "Crear sesiones"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Tab: Tours ───────────────────────────────────────────────────────────────

function TabTours({
  tours,
  onCrearTour,
  onActualizarTour,
  onToggleTour,
  onCrearSesionUnica,
  onCrearSesionesRecurrentes,
}: {
  tours: FreeTourDB[];
  onCrearTour: (fd: FormData) => Promise<void>;
  onActualizarTour: (fd: FormData) => Promise<void>;
  onToggleTour: (fd: FormData) => Promise<void>;
  onCrearSesionUnica: (fd: FormData) => Promise<void>;
  onCrearSesionesRecurrentes: (fd: FormData) => Promise<void>;
}) {
  const [modalNuevo, setModalNuevo] = useState(false);
  const [tourEditar, setTourEditar] = useState<FreeTourDB | null>(null);
  const [tourSesion, setTourSesion] = useState<FreeTourDB | null>(null);
  const [pending, startT] = useTransition();
  const router = useRouter();

  function toggle(tour: FreeTourDB) {
    const fd = new FormData();
    fd.set("tour_id", tour.id);
    fd.set("activo", String(!tour.activo));
    startT(async () => { await onToggleTour(fd); router.refresh(); });
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#6b6b6b" }}>{tours.length} {tours.length === 1 ? "tour" : "tours"} creados</div>
        <button onClick={() => setModalNuevo(true)} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 18px", background: "#000", color: "#fff", border: "none",
          borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Nuevo tour
        </button>
      </div>

      {tours.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "#f5f7fa", borderRadius: 14, border: "2px dashed #f3f3f3",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚶</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1f1f1f", marginBottom: 6 }}>Aún no tenés tours creados</div>
          <div style={{ fontSize: 13, color: "#6b6b6b", marginBottom: 20 }}>Creá tu primer Free Tour y empezá a recibir inscripciones.</div>
          <button onClick={() => setModalNuevo(true)} style={{
            padding: "10px 22px", background: "#0070cc", color: "#fff", border: "none",
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Crear primer tour</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tours.map((tour) => (
            <div key={tour.id} style={{
              background: "#fff", border: "1px solid #f3f3f3", borderRadius: 14, padding: "18px 22px",
              boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#1f1f1f" }}>{tour.titulo}</span>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      background: tour.activo ? "#dcfce7" : "#f3f3f3",
                      color: tour.activo ? "#15803d" : "#6b6b6b",
                      borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600,
                    }}>{tour.activo ? "Activo" : "Pausado"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b6b6b" }}>
                    <span>⏱ {tour.duracion_minutos} min</span>
                    <span>👥 {tour.cupo_maximo} pax máx</span>
                    {tour.distancia_km && <span>📍 {tour.distancia_km} km</span>}
                    {tour.idiomas?.length > 0 && <span>🌐 {tour.idiomas.join(" · ")}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setTourSesion(tour)} style={{
                    padding: "7px 14px", background: "#f5f7fa", border: "1px solid #f3f3f3",
                    borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#1f1f1f", cursor: "pointer",
                  }}>📅 Sesiones</button>
                  <button onClick={() => setTourEditar(tour)} style={{
                    padding: "7px 14px", background: "#f5f7fa", border: "1px solid #f3f3f3",
                    borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#1f1f1f", cursor: "pointer",
                  }}>Editar</button>
                  <button onClick={() => toggle(tour)} disabled={pending} style={{
                    padding: "7px 14px",
                    background: tour.activo ? "#fff" : "#f5f7fa",
                    border: tour.activo ? "1px solid #fca5a5" : "1px solid #f3f3f3",
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: tour.activo ? "#b91c1c" : "#15803d", cursor: "pointer",
                  }}>{tour.activo ? "Pausar" : "Activar"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNuevo && (
        <TourModal onSave={onCrearTour} onClose={() => setModalNuevo(false)} />
      )}
      {tourEditar && (
        <TourModal tour={tourEditar} onSave={onActualizarTour} onClose={() => setTourEditar(null)} />
      )}
      {tourSesion && (
        <SesionModal
          tourId={tourSesion.id}
          cupoDefault={tourSesion.cupo_maximo}
          onCrearUnica={onCrearSesionUnica}
          onCrearRecurrentes={onCrearSesionesRecurrentes}
          onClose={() => setTourSesion(null)}
        />
      )}
    </>
  );
}

// ─── Tab: Sesiones ────────────────────────────────────────────────────────────

function TabSesiones({
  sesiones,
  tours,
  onCancelarSesion,
  onCrearSesionUnica,
  onCrearSesionesRecurrentes,
}: {
  sesiones: SesionConTour[];
  tours: FreeTourDB[];
  onCancelarSesion: (fd: FormData) => Promise<void>;
  onCrearSesionUnica: (fd: FormData) => Promise<void>;
  onCrearSesionesRecurrentes: (fd: FormData) => Promise<void>;
}) {
  const [tourSesion, setTourSesion] = useState<FreeTourDB | null>(null);
  const [pending, startT] = useTransition();
  const router = useRouter();

  function cancelar(sesionId: string) {
    const motivo = prompt("Motivo de cancelación (opcional):");
    if (motivo === null) return;
    const fd = new FormData();
    fd.set("sesion_id", sesionId);
    if (motivo) fd.set("motivo", motivo);
    startT(async () => { await onCancelarSesion(fd); router.refresh(); });
  }

  // Agrupar por fecha
  const grupos: Record<string, SesionConTour[]> = {};
  for (const s of sesiones) {
    if (!grupos[s.fecha]) grupos[s.fecha] = [];
    grupos[s.fecha].push(s);
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#6b6b6b" }}>Próximas 30 días · {sesiones.length} sesiones</div>
        {tours.length > 0 && (
          <select
            onChange={(e) => {
              const tour = tours.find((t) => t.id === e.target.value);
              if (tour) setTourSesion(tour);
              e.target.value = "";
            }}
            defaultValue=""
            style={{ ...inputStyle, width: "auto", padding: "8px 14px", cursor: "pointer" }}
          >
            <option value="" disabled>+ Programar sesión</option>
            {tours.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
          </select>
        )}
      </div>

      {sesiones.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "#f5f7fa", borderRadius: 14, border: "2px dashed #f3f3f3",
        }}>
          <div style={{ fontSize: 13, color: "#6b6b6b" }}>No hay sesiones programadas en los próximos 30 días.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Object.entries(grupos).map(([fecha, items]) => (
            <div key={fecha}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6b6b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                {formatFecha(fecha)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((s) => {
                  const plazasLibres = s.cupo_sesion - s.inscritos_count;
                  const lleno = plazasLibres <= 0;
                  return (
                    <div key={s.id} style={{
                      background: "#fff", border: `1px solid ${lleno ? "#fca5a530" : "#f3f3f3"}`,
                      borderRadius: 12, padding: "14px 18px",
                      display: "flex", alignItems: "center", gap: 14,
                      opacity: s.cancelada ? 0.5 : 1,
                    }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                        background: lleno ? "#fef2f2" : "#f0f9ff",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: lleno ? "#b91c1c" : "#0070cc" }}>
                          {formatHora(s.hora)}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1f1f1f" }}>{s.tour?.titulo}</div>
                        <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 2 }}>
                          {s.inscritos_count}/{s.cupo_sesion} inscritos
                          {lleno && <span style={{ color: "#b91c1c", fontWeight: 600 }}> · ¡Completo!</span>}
                          {s.cancelada && <span style={{ color: "#b91c1c", fontWeight: 600 }}> · Cancelada</span>}
                        </div>
                      </div>
                      {/* Barra progreso */}
                      <div style={{ width: 80, flexShrink: 0 }}>
                        <div style={{ height: 6, background: "#f3f3f3", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 3,
                            width: `${Math.min(100, (s.inscritos_count / s.cupo_sesion) * 100)}%`,
                            background: lleno ? "#ef4444" : "#0070cc",
                            transition: "width 0.3s",
                          }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#6b6b6b", marginTop: 3, textAlign: "right" }}>
                          {plazasLibres > 0 ? `${plazasLibres} libres` : "Sin plazas"}
                        </div>
                      </div>
                      {!s.cancelada && (
                        <button onClick={() => cancelar(s.id)} disabled={pending} style={{
                          padding: "6px 12px", background: "#fff", border: "1px solid #fca5a5",
                          borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#b91c1c", cursor: "pointer",
                        }}>Cancelar</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tourSesion && (
        <SesionModal
          tourId={tourSesion.id}
          cupoDefault={tourSesion.cupo_maximo}
          onCrearUnica={onCrearSesionUnica}
          onCrearRecurrentes={onCrearSesionesRecurrentes}
          onClose={() => setTourSesion(null)}
        />
      )}
    </>
  );
}

// ─── Tab: Inscripciones ───────────────────────────────────────────────────────

function TabInscripciones({
  inscripciones,
  onActualizarInscripcion,
}: {
  inscripciones: InscripcionConSesion[];
  onActualizarInscripcion: (fd: FormData) => Promise<void>;
}) {
  const [pending, startT] = useTransition();
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const router = useRouter();

  function cambiarEstado(inscripcionId: string, estado: EstadoInscripcionFreeTour) {
    const fd = new FormData();
    fd.set("inscripcion_id", inscripcionId);
    fd.set("estado", estado);
    startT(async () => { await onActualizarInscripcion(fd); router.refresh(); });
  }

  const filtradas = filtroEstado
    ? inscripciones.filter((i) => i.estado === filtroEstado)
    : inscripciones;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#6b6b6b" }}>{filtradas.length} inscripciones</div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "8px 14px" }}>
          <option value="">Todos los estados</option>
          <option value="confirmada">Confirmadas</option>
          <option value="asistio">Asistieron</option>
          <option value="no_show">No-show</option>
          <option value="cancelada_cliente">Canceladas (cliente)</option>
          <option value="cancelada_guia">Canceladas (guía)</option>
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "#f5f7fa", borderRadius: 14, border: "2px dashed #f3f3f3" }}>
          <div style={{ fontSize: 13, color: "#6b6b6b" }}>No hay inscripciones con ese filtro.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtradas.map((ins) => (
            <div key={ins.id} style={{
              background: "#fff", border: "1px solid #f3f3f3", borderRadius: 12,
              padding: "16px 20px", boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: "#6b6b6b" }}>{ins.numero}</span>
                    <EstadoBadge estado={ins.estado} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1f1f1f" }}>{ins.nombre_cliente}</div>
                  <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 2 }}>
                    {ins.email_cliente}
                    {ins.telefono_cliente && <> · {ins.telefono_cliente}</>}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>
                    {ins.sesion?.tour?.titulo} · {ins.sesion?.fecha && formatFecha(ins.sesion.fecha)} {ins.sesion?.hora && formatHora(ins.sesion.hora)}
                    · <strong>{ins.num_personas} pax</strong>
                  </div>
                  {ins.notas && (
                    <div style={{ marginTop: 6, padding: "6px 10px", background: "#fef9c3", borderRadius: 6, fontSize: 12, color: "#854d0e" }}>
                      📝 {ins.notas}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1f1f1f", marginBottom: 8 }}>
                    {formatCurrency(ins.num_personas * ins.comision_aplicada)}
                  </div>
                  {ins.estado === "confirmada" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <button onClick={() => cambiarEstado(ins.id, "asistio")} disabled={pending} style={{
                        padding: "5px 12px", background: "#dcfce7", border: "none",
                        borderRadius: 7, fontSize: 11, fontWeight: 600, color: "#15803d", cursor: "pointer",
                      }}>✓ Asistió</button>
                      <button onClick={() => cambiarEstado(ins.id, "no_show")} disabled={pending} style={{
                        padding: "5px 12px", background: "#fef9c3", border: "none",
                        borderRadius: 7, fontSize: 11, fontWeight: 600, color: "#854d0e", cursor: "pointer",
                      }}>No-show</button>
                      <button onClick={() => cambiarEstado(ins.id, "cancelada_guia")} disabled={pending} style={{
                        padding: "5px 12px", background: "#fee2e2", border: "none",
                        borderRadius: 7, fontSize: 11, fontWeight: 600, color: "#b91c1c", cursor: "pointer",
                      }}>Cancelar</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Tab: Comisiones ──────────────────────────────────────────────────────────

function TabComisiones({
  comisiones,
  totalPendiente,
  totalFacturado,
}: {
  comisiones: ComisionAcumuladaDB[];
  totalPendiente: number;
  totalFacturado: number;
}) {
  return (
    <>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #f3f3f3", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontSize: 11, color: "#6b6b6b", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Pendiente de facturar</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#1f1f1f" }}>{formatCurrency(totalPendiente)}</div>
          <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>Se descuenta el día 1 del mes siguiente</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #f3f3f3", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontSize: 11, color: "#6b6b6b", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Facturado histórico</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#6b6b6b" }}>{formatCurrency(totalFacturado)}</div>
          <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>Total acumulado facturado</div>
        </div>
      </div>

      {/* Info box */}
      <div style={{
        marginBottom: 20, padding: "12px 16px",
        background: "#eff6ff", border: "1px solid #bfdbfe",
        borderRadius: 10, fontSize: 12, color: "#1d4ed8",
      }}>
        💡 <strong>Modelo:</strong> 2,00 € por persona inscrita y confirmada. Si el cliente cancela o no se presenta, no cobramos.
      </div>

      {comisiones.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", background: "#f5f7fa", borderRadius: 12, fontSize: 13, color: "#6b6b6b" }}>
          No hay comisiones pendientes este mes.
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #f3f3f3", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f3f3", fontSize: 11, fontWeight: 700, color: "#6b6b6b", letterSpacing: 1, textTransform: "uppercase" }}>
            Pendientes de facturar
          </div>
          {comisiones.map((c, i) => (
            <div key={c.id} style={{
              padding: "14px 20px",
              borderBottom: i < comisiones.length - 1 ? "1px solid #f3f3f3" : "none",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1f1f1f" }}>{c.concepto}</div>
                <div style={{ fontSize: 11, color: "#6b6b6b", marginTop: 2 }}>
                  {new Date(c.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1f1f1f" }}>{formatCurrency(c.importe)}</div>
            </div>
          ))}
          <div style={{
            padding: "14px 20px", background: "#f5f7fa",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1f1f1f" }}>Total pendiente</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1f1f1f" }}>{formatCurrency(totalPendiente)}</span>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Pantalla de activación ───────────────────────────────────────────────────

function ActivacionScreen({ onActivar }: { onActivar: (fd: FormData) => Promise<void> }) {
  const [pending, startT] = useTransition();
  const router = useRouter();

  function activar() {
    const fd = new FormData();
    fd.set("activo", "true");
    startT(async () => { await onActivar(fd); router.refresh(); });
  }

  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 32, minHeight: "60vh",
    }}>
      <div style={{
        maxWidth: 500, textAlign: "center",
        background: "#fff", borderRadius: 20, padding: "40px 48px",
        boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px",
        border: "1px solid #f3f3f3",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#eff6ff", margin: "0 auto 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32,
        }}>🚶</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "#1f1f1f", margin: "0 0 10px" }}>Activá el módulo Free Tour</h2>
        <p style={{ fontSize: 14, color: "#6b6b6b", lineHeight: 1.6, margin: "0 0 12px" }}>
          Gestioná tours guiados, programá sesiones y recibí inscripciones de viajeros.
        </p>
        <p style={{ fontSize: 13, color: "#6b6b6b", lineHeight: 1.6, margin: "0 0 28px" }}>
          La inscripción es <strong>gratuita para el cliente</strong>. La plataforma cobra <strong>2 € por persona</strong> confirmada, facturado mensualmente.
        </p>
        <button onClick={activar} disabled={pending} style={{
          width: "100%", padding: "14px", background: "#000", color: "#fff", border: "none",
          borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: pending ? 0.7 : 1,
        }}>
          {pending ? "Activando…" : "Activar Free Tour"}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = "tours" | "sesiones" | "inscripciones" | "comisiones";

interface Props {
  freeTourActivo: boolean;
  tours: FreeTourDB[];
  sesiones: SesionConTour[];
  inscripciones: InscripcionConSesion[];
  comisiones: ComisionAcumuladaDB[];
  totalPendiente: number;
  totalFacturado: number;
  onActivar: (fd: FormData) => Promise<void>;
  onCrearTour: (fd: FormData) => Promise<void>;
  onActualizarTour: (fd: FormData) => Promise<void>;
  onToggleTour: (fd: FormData) => Promise<void>;
  onCrearSesionUnica: (fd: FormData) => Promise<void>;
  onCrearSesionesRecurrentes: (fd: FormData) => Promise<void>;
  onCancelarSesion: (fd: FormData) => Promise<void>;
  onActualizarInscripcion: (fd: FormData) => Promise<void>;
}

export default function FreeTourView({
  freeTourActivo,
  tours,
  sesiones,
  inscripciones,
  comisiones,
  totalPendiente,
  totalFacturado,
  onActivar,
  onCrearTour,
  onActualizarTour,
  onToggleTour,
  onCrearSesionUnica,
  onCrearSesionesRecurrentes,
  onCancelarSesion,
  onActualizarInscripcion,
}: Props) {
  const [tab, setTab] = useState<Tab>("tours");

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "tours", label: "Tours", count: tours.length },
    { id: "sesiones", label: "Sesiones", count: sesiones.length },
    { id: "inscripciones", label: "Inscripciones", count: inscripciones.filter((i) => i.estado === "confirmada").length },
    { id: "comisiones", label: "Comisiones", count: comisiones.length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Header */}
      <header style={{
        height: 60, background: "#fff", borderBottom: "1px solid #f3f3f3",
        display: "flex", alignItems: "center", padding: "0 28px", gap: 18,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, color: "#6b6b6b", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>FREE TOUR</div>
        <div style={{ flex: 1 }} />
        {freeTourActivo && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, background: "#dcfce7" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
            <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>Módulo activo</span>
          </div>
        )}
      </header>

      {!freeTourActivo ? (
        <ActivacionScreen onActivar={onActivar} />
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid #f3f3f3" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 16px", background: "none", border: "none",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  color: tab === t.id ? "#1f1f1f" : "#6b6b6b",
                  borderBottom: tab === t.id ? "2px solid #0070cc" : "2px solid transparent",
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "inherit",
                  transition: "color 150ms",
                }}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span style={{
                    background: tab === t.id ? "#1f1f1f" : "#f3f3f3",
                    color: tab === t.id ? "#fff" : "#6b6b6b",
                    fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 7px",
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "tours" && (
            <TabTours
              tours={tours}
              onCrearTour={onCrearTour}
              onActualizarTour={onActualizarTour}
              onToggleTour={onToggleTour}
              onCrearSesionUnica={onCrearSesionUnica}
              onCrearSesionesRecurrentes={onCrearSesionesRecurrentes}
            />
          )}
          {tab === "sesiones" && (
            <TabSesiones
              sesiones={sesiones}
              tours={tours}
              onCancelarSesion={onCancelarSesion}
              onCrearSesionUnica={onCrearSesionUnica}
              onCrearSesionesRecurrentes={onCrearSesionesRecurrentes}
            />
          )}
          {tab === "inscripciones" && (
            <TabInscripciones
              inscripciones={inscripciones}
              onActualizarInscripcion={onActualizarInscripcion}
            />
          )}
          {tab === "comisiones" && (
            <TabComisiones
              comisiones={comisiones}
              totalPendiente={totalPendiente}
              totalFacturado={totalFacturado}
            />
          )}
        </div>
      )}
    </div>
  );
}
