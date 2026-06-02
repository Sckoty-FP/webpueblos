"use client";

import { useTransition } from "react";
import { eliminarDireccion } from "@/app/actions/cuenta-usuario";
import type { DireccionGuardada } from "@/lib/supabase/queries/cuenta-usuario";

export default function TabDirecciones({ direcciones }: { direcciones: DireccionGuardada[] }) {
  const [isPending, startTransition] = useTransition();

  if (direcciones.length === 0) {
    return (
      <div className="bg-white rounded-card-lg border border-divisor px-6 py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-fog flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <p className="font-barlow font-semibold text-[16px] text-text-body mb-2">Sin direcciones guardadas</p>
        <p className="font-barlow text-[14px] text-text-muted">
          Cuando hagas tu primer pedido de delivery, podrás guardar tu dirección.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {direcciones.map(d => (
        <div key={d.id} className="bg-white rounded-card-lg border border-divisor p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-fog flex-shrink-0 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-barlow font-semibold text-[14px] text-text-body">{d.etiqueta}</p>
              {d.es_default && (
                <span className="font-barlow text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-primary/10 text-primary">
                  Predeterminada
                </span>
              )}
            </div>
            <p className="font-barlow text-[13px] text-text-muted">{d.direccion}</p>
            {(d.piso || d.codigo_postal) && (
              <p className="font-barlow text-[12px] text-text-muted">
                {[d.piso, d.codigo_postal].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="font-barlow text-[11px] text-text-muted mt-1">{d.pueblo_nombre}</p>
          </div>
          <button
            onClick={() => {
              if (!confirm("¿Eliminar esta dirección?")) return;
              startTransition(async () => { await eliminarDireccion(d.id); });
            }}
            disabled={isPending}
            aria-label="Eliminar dirección"
            className="text-text-muted hover:text-red-500 transition-colors p-1 flex-shrink-0 disabled:opacity-50 bg-transparent border-none cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
