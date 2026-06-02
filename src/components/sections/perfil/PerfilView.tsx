"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TabReservas from "./TabReservas";
import TabPedidos from "./TabPedidos";
import TabInscripciones from "./TabInscripciones";
import TabMisPosts from "./TabMisPosts";
import TabDirecciones from "./TabDirecciones";
import ActivarNotificaciones from "@/components/push/ActivarNotificaciones";
import type { ReservaUsuarioDB } from "@/types";
import type { PedidoUsuario } from "@/lib/supabase/queries/delivery-publico";
import type { InscripcionFreeTour, PostMuroPropio, DireccionGuardada } from "@/lib/supabase/queries/cuenta-usuario";

type Tab = "reservas" | "pedidos" | "free-tour" | "muro" | "direcciones";
const VALID_TABS: Tab[] = ["reservas", "pedidos", "free-tour", "muro", "direcciones"];

export default function PerfilView({
  nombre: initialNombre,
  email,
  tipo,
  avatarUrl,
  reservas,
  pedidos,
  inscripciones,
  postsMuro,
  direcciones,
}: {
  userId: string;
  email: string;
  nombre: string;
  tipo: string;
  avatarUrl: string | null;
  reservas: ReservaUsuarioDB[];
  pedidos: PedidoUsuario[];
  inscripciones: InscripcionFreeTour[];
  postsMuro: PostMuroPropio[];
  direcciones: DireccionGuardada[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab") as Tab | null;

  const [tab, setTab] = useState<Tab>(
    tabFromQuery && VALID_TABS.includes(tabFromQuery) ? tabFromQuery : "reservas"
  );
  const [editMode, setEditMode] = useState(false);
  const [nombre, setNombre] = useState(initialNombre);
  const [editName, setEditName] = useState(initialNombre);
  const [saving, setSaving] = useState(false);
  const isPrestador = tipo === "prestador";

  const initials = nombre.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const TABS: Array<{ id: Tab; label: string; count: number }> = [
    { id: "reservas",    label: "Reservas",   count: reservas.length },
    { id: "pedidos",     label: "Pedidos",    count: pedidos.length },
    { id: "free-tour",   label: "Free Tours", count: inscripciones.length },
    { id: "muro",        label: "Muro 24h",   count: postsMuro.length },
    { id: "direcciones", label: "Direcciones", count: direcciones.length },
  ];

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { nombre: editName } });
    setNombre(editName);
    setEditMode(false);
    setSaving(false);
  }

  async function handleLogout() {
    router.push("/auth/signout");
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <div className="rounded-card-lg overflow-hidden mb-6" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 4px 20px" }}>
        <div className="h-24 relative" style={{ background: "linear-gradient(135deg, #0a2540 0%, #0070cc 100%)" }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%,#fff 0%,transparent 60%)" }} />
        </div>
        <div className="bg-white px-5 pb-5">
          <div className="flex items-end justify-between -mt-6 mb-3">
            {avatarUrl ? (
              <div className="relative w-16 h-16 rounded-full border-4 border-white overflow-hidden flex-shrink-0">
                <Image src={avatarUrl} alt={nombre} fill sizes="64px" className="object-cover" />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center font-barlow font-bold text-white text-[20px]"
                style={{ background: "linear-gradient(135deg,#0070cc,#0ea5e9)", flexShrink: 0 }}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              disabled={saving}
              className="font-barlow font-semibold text-[13px] px-4 py-1.5 rounded-pill border-2 border-primary text-primary cursor-pointer bg-white hover:bg-fog transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : editMode ? "Guardar" : "Editar"}
            </button>
          </div>

          {editMode ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="font-barlow font-semibold text-[18px] text-text-body border-b-2 border-primary outline-none bg-transparent mb-1 w-full"
              autoFocus
            />
          ) : (
            <h2 className="font-barlow font-semibold text-[18px] text-text-body mb-0.5">{nombre}</h2>
          )}
          <p className="font-barlow text-[13px] text-text-muted mb-3">{email}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-barlow font-medium text-[11px] px-2.5 py-1 rounded-pill bg-fog text-text-muted capitalize">
              {isPrestador ? "Prestador" : "Usuario"}
            </span>
          </div>
          {isPrestador && (
            <div className="mt-4 pt-4 border-t border-divisor">
              <Link href="/panel" className="inline-flex items-center gap-2 font-barlow font-semibold text-[13px] text-primary no-underline hover:underline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                Ir al panel de prestador
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-white rounded-card border border-divisor p-1 mb-5 overflow-x-auto no-scrollbar">
        {TABS.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 font-barlow font-medium text-[13px] px-4 py-2 rounded-[14px] cursor-pointer border-none transition-all duration-150"
            style={{
              background: tab === id ? "var(--color-primary, #0070cc)" : "transparent",
              color: tab === id ? "#fff" : "var(--color-text-muted, #6b6b6b)",
            }}
          >
            {label}
            <span
              className="font-barlow text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
              style={{
                background: tab === id ? "rgba(255,255,255,0.25)" : "#f3f3f3",
                color: tab === id ? "#fff" : "#6b6b6b",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      {tab === "reservas"    && <TabReservas    reservas={reservas} />}
      {tab === "pedidos"     && <TabPedidos     pedidos={pedidos} />}
      {tab === "free-tour"   && <TabInscripciones inscripciones={inscripciones} />}
      {tab === "muro"        && <TabMisPosts    posts={postsMuro} />}
      {tab === "direcciones" && <TabDirecciones direcciones={direcciones} />}

      {/* ── Cuenta ───────────────────────────────────────────────────────── */}
      <div className="mt-10 pt-6 border-t border-divisor">
        <p className="font-barlow text-[12px] font-semibold text-text-muted uppercase tracking-widest mb-3">Cuenta</p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 font-barlow text-[14px] text-text-muted bg-white rounded-card border border-divisor px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="flex-1">Notificaciones</span>
            <ActivarNotificaciones compact />
          </div>
          <div className="flex items-center gap-3 font-barlow text-[14px] text-text-muted bg-white rounded-card border border-divisor px-4 py-3 opacity-60 cursor-not-allowed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span className="flex-1">Idioma · Español</span>
            <span className="font-barlow text-[11px] text-text-muted/70">Más idiomas próximamente</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 font-barlow text-[14px] text-red-500 bg-white rounded-card border border-divisor px-4 py-3 cursor-pointer hover:bg-red-50 transition-colors text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
