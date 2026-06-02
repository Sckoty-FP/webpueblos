"use client";

import { useState, useTransition } from "react";
import type { StaffConUsuario } from "@/lib/supabase/queries/equipo";

interface Props {
  staffList: StaffConUsuario[];
  prestadorId: string;
  onInvitar: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  onDarDeBaja: (staffId: string) => Promise<{ ok: boolean; error?: string }>;
}

// ─── Componente StaffCard ─────────────────────────────────────────────────────

function StaffCard({
  staff,
  onDarDeBaja,
}: {
  staff: StaffConUsuario;
  onDarDeBaja: (id: string) => void;
}) {
  const nombre = staff.usuario?.nombre ?? staff.nombre_invitado ?? staff.email_invitado ?? "—";
  const email  = staff.usuario?.email  ?? staff.email_invitado  ?? "—";
  const iniciales = nombre.slice(0, 2).toUpperCase();

  const isPendiente = !staff.activo && !staff.fecha_baja;
  const isInactivo  = !!staff.fecha_baja;

  function pillStyle() {
    if (isPendiente) return { bg: "rgba(217,119,6,0.12)", color: "#d97706" };
    if (isInactivo)  return { bg: "rgba(107,107,107,0.12)", color: "#6b6b6b" };
    return { bg: "rgba(5,150,105,0.12)", color: "#059669" };
  }

  const pill = pillStyle();

  return (
    <div
      className="bg-white rounded-[14px] border p-5 flex items-start gap-4"
      style={{
        borderColor: isPendiente ? "rgba(217,119,6,0.3)" : "#f3f3f3",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        opacity: isInactivo ? 0.6 : 1,
      }}
    >
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold"
        style={{
          background: isPendiente ? "rgba(217,119,6,0.08)" : "rgba(0,112,204,0.08)",
          color:      isPendiente ? "#d97706" : "#0070cc",
          border:     isPendiente ? "2px dashed #d97706" : "2px solid transparent",
        }}
      >
        {isPendiente ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        ) : (
          <span className="font-barlow font-bold text-[13px]">{iniciales}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="font-barlow font-semibold text-[15px] text-text-body">{nombre}</p>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.5px] px-2 py-0.5 rounded-full"
            style={{ background: pill.bg, color: pill.color }}
          >
            {isPendiente ? "INVITADO" : isInactivo ? "INACTIVO" : "ENCARGADO"}
          </span>
        </div>
        <p className="font-barlow text-[13px] text-text-muted font-mono truncate">{email}</p>
        {isPendiente && staff.expira_en && (
          <p className="font-barlow text-[11px] text-text-subtle mt-1">
            Expira: {new Date(staff.expira_en).toLocaleDateString("es-ES")}
          </p>
        )}
        {staff.activo && (
          <p className="font-barlow text-[11px] text-text-muted mt-1">
            Desde {new Date(staff.fecha_alta).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Acciones */}
      {staff.activo && (
        <button
          onClick={() => onDarDeBaja(staff.id)}
          className="text-[12px] font-barlow font-semibold text-error border border-error/30 rounded-[8px] px-3 py-1.5 hover:bg-error/5 transition-colors shrink-0"
        >
          Dar de baja
        </button>
      )}
    </div>
  );
}

// ─── Modal Invitar ────────────────────────────────────────────────────────────

function InvitarModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await onSubmit(formData);
      if (!result.ok) {
        setError(result.error ?? "Error al enviar la invitación");
      } else {
        setSuccess(true);
        setTimeout(onClose, 1800);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[560px] bg-white rounded-[18px] p-6 sm:p-8"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.4)", maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}
      >
        {/* Header */}
        <p className="font-barlow text-[10px] font-bold uppercase tracking-[1.5px] text-text-muted mb-1">NUEVO MIEMBRO</p>
        <h2 className="font-fraunces font-semibold text-[22px] text-text-body mb-1">Invitar encargado</h2>
        <p className="font-barlow text-[13px] text-text-muted mb-6">
          Recibirá un email para crear su cuenta y aceptar la invitación.
        </p>

        {success ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="font-barlow font-semibold text-[16px] text-text-body">Invitación enviada</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block font-barlow text-[10px] font-bold uppercase tracking-[1.5px] text-text-muted mb-1.5">
                Email del encargado
              </label>
              <div className="relative">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.75" className="absolute left-3 top-1/2 -translate-y-1/2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="encargado@ejemplo.com"
                  className="w-full pl-9 pr-4 py-3 rounded-[10px] bg-[#f5f7fa] border border-transparent font-barlow text-[14px] text-text-body placeholder:text-text-subtle focus:outline-none focus:border-primary"
                  style={{ transition: "border-color 0.15s" }}
                />
              </div>
            </div>

            {/* Nombre (opcional) */}
            <div>
              <label className="block font-barlow text-[10px] font-bold uppercase tracking-[1.5px] text-text-muted mb-1.5">
                Nombre <span className="normal-case font-normal">(opcional)</span>
              </label>
              <input
                name="nombre"
                type="text"
                placeholder="Nombre del encargado"
                className="w-full px-4 py-3 rounded-[10px] bg-[#f5f7fa] border border-transparent font-barlow text-[14px] text-text-body placeholder:text-text-subtle focus:outline-none focus:border-primary"
                style={{ transition: "border-color 0.15s" }}
              />
            </div>

            {/* Permisos */}
            <div className="rounded-[12px] p-4" style={{ background: "rgba(0,112,204,0.06)", border: "1px solid rgba(0,112,204,0.2)" }}>
              <p className="font-barlow text-[10px] font-bold uppercase tracking-[1.5px] text-primary mb-3">PERMISOS DE ENCARGADO</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { ok: true,  texto: "Gestionar reservas y pedidos" },
                  { ok: true,  texto: "Crear notas internas" },
                  { ok: false, texto: "Ver caja y movimientos" },
                  { ok: false, texto: "Editar inventario" },
                  { ok: false, texto: "Cambiar carta u horarios" },
                  { ok: false, texto: "Invitar más miembros" },
                ].map((item) => (
                  <div key={item.texto} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{ background: item.ok ? "rgba(5,150,105,0.12)" : "rgba(107,107,107,0.08)" }}
                    >
                      {item.ok ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                    </div>
                    <span
                      className="font-barlow text-[12px]"
                      style={{ color: item.ok ? "#3a3a3a" : "#6b6b6b", textDecoration: item.ok ? "none" : "line-through" }}
                    >
                      {item.texto}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso legal */}
            <div className="rounded-[10px] p-3 border border-dashed border-[#e6e6e6]" style={{ background: "#f5f7fa" }}>
              <p className="font-barlow text-[11px] text-text-muted leading-relaxed">
                El encargado es empleado del negocio, no de PUEBLO. La plataforma solo provee el acceso técnico. La relación laboral es responsabilidad del propietario.
              </p>
            </div>

            {error && (
              <p className="font-barlow text-[13px] text-error">{error}</p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <p className="font-barlow text-[11px] text-text-muted">Invitación expira en 7 días</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="font-barlow font-semibold text-[13px] text-text-muted px-4 py-2.5 rounded-[10px] hover:bg-[#f5f7fa] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 font-barlow font-bold text-[13px] text-white bg-[#000] rounded-[10px] px-5 py-2.5 hover:bg-[#1c1c1c] transition-colors disabled:opacity-60"
                >
                  {isPending ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  )}
                  Enviar invitación
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EquipoView({ staffList, prestadorId, onInvitar, onDarDeBaja }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [lista, setLista]         = useState(staffList);
  const [, startTransition]       = useTransition();

  const activos    = lista.filter((s) => s.activo);
  const pendientes = lista.filter((s) => !s.activo && !s.fecha_baja);
  const inactivos  = lista.filter((s) => !!s.fecha_baja);

  function handleDarDeBaja(staffId: string) {
    if (!confirm("¿Dar de baja a este encargado?")) return;
    startTransition(async () => {
      const result = await onDarDeBaja(staffId);
      if (result.ok) {
        setLista((prev) =>
          prev.map((s) => s.id === staffId ? { ...s, activo: false, fecha_baja: new Date().toISOString() } : s)
        );
      }
    });
  }

  async function handleInvitar(formData: FormData) {
    const result = await onInvitar(formData);
    if (result.ok) {
      // Optimistic: recargar la página tras un momento
      setTimeout(() => window.location.reload(), 2000);
    }
    return result;
  }

  return (
    <main className="flex-1 p-8 max-md:p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-fraunces font-semibold text-[32px] text-text-body leading-tight">Tu equipo</h1>
          <p className="font-barlow text-[14px] text-text-muted mt-1">
            {activos.length} encargado{activos.length !== 1 ? "s" : ""} activo{activos.length !== 1 ? "s" : ""}
            {pendientes.length > 0 && ` · ${pendientes.length} invitación${pendientes.length !== 1 ? "es" : ""} pendiente${pendientes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 font-barlow font-bold text-[13px] text-white bg-[#000] rounded-[10px] px-4 py-2.5 hover:bg-[#1c1c1c] transition-colors shrink-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Invitar encargado
        </button>
      </div>

      {/* Estado vacío */}
      {lista.length === 0 && (
        <div className="bg-white rounded-[14px] border border-[#f3f3f3] p-12 text-center" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="w-14 h-14 rounded-full bg-[#f5f7fa] flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.75">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <p className="font-barlow font-semibold text-[15px] text-text-body mb-1">Todavía no tenés encargados</p>
          <p className="font-barlow text-[13px] text-text-muted">Invitá a tu primer encargado para que te ayude a gestionar el negocio.</p>
        </div>
      )}

      {/* Encargados activos */}
      {activos.length > 0 && (
        <section className="mb-8">
          <p className="font-barlow text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3">
            Encargados activos · {activos.length}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {activos.map((s) => (
              <StaffCard key={s.id} staff={s} onDarDeBaja={handleDarDeBaja} />
            ))}
          </div>
        </section>
      )}

      {/* Invitaciones pendientes */}
      {pendientes.length > 0 && (
        <section className="mb-8">
          <p className="font-barlow text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3">
            Invitaciones pendientes · {pendientes.length}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pendientes.map((s) => (
              <StaffCard key={s.id} staff={s} onDarDeBaja={handleDarDeBaja} />
            ))}
          </div>
        </section>
      )}

      {/* Histórico */}
      {inactivos.length > 0 && (
        <section>
          <p className="font-barlow text-[11px] font-semibold uppercase tracking-[1.5px] text-text-muted mb-3">
            Histórico · {inactivos.length}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {inactivos.map((s) => (
              <StaffCard key={s.id} staff={s} onDarDeBaja={handleDarDeBaja} />
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {showModal && (
        <InvitarModal
          onClose={() => setShowModal(false)}
          onSubmit={handleInvitar}
        />
      )}
    </main>
  );
}
