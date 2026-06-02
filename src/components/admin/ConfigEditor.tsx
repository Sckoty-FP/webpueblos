"use client";

import { useState, useTransition } from "react";
import { actualizarConfig } from "@/app/actions/admin/config-plataforma";
import type { ConfigPlataformaItem } from "@/types/config-plataforma";

function formatValor(v: unknown, tipo: string): string {
  if (tipo === "json") return JSON.stringify(v, null, 2);
  if (tipo === "string") return typeof v === "string" ? v : String(v);
  if (tipo === "boolean") return v === true ? "true" : "false";
  return String(v ?? "");
}

export default function ConfigEditor({ items }: { items: ConfigPlataformaItem[] }) {
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(items.map(i => [i.clave, formatValor(i.valor, i.tipo)]))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved]   = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function save(item: ConfigPlataformaItem) {
    setErrors(e => ({ ...e, [item.clave]: "" }));
    startTransition(async () => {
      try {
        await actualizarConfig(item.clave, drafts[item.clave], item.tipo);
        setSaved(s => ({ ...s, [item.clave]: true }));
        setTimeout(() => setSaved(s => ({ ...s, [item.clave]: false })), 2000);
      } catch (err: unknown) {
        setErrors(e => ({ ...e, [item.clave]: err instanceof Error ? err.message : "Error" }));
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <div key={item.clave} className="bg-white/[0.05] border border-white/[0.08] rounded-lg p-4">
          <div className="flex items-center justify-between gap-3 mb-1">
            <code className="font-barlow text-sm font-semibold text-white/90">{item.clave}</code>
            <span className="font-barlow text-[11px] font-medium text-white/40 bg-white/[0.06] px-2 py-0.5 rounded-full uppercase">
              {item.tipo}
            </span>
          </div>
          {item.descripcion && (
            <p className="font-barlow text-[13px] text-white/50 mb-3">{item.descripcion}</p>
          )}
          <div className="flex items-center gap-2">
            {item.tipo === "boolean" ? (
              <select
                value={drafts[item.clave]}
                onChange={(e) => setDrafts(d => ({ ...d, [item.clave]: e.target.value }))}
                className="flex-1 px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded text-white font-barlow text-sm"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <input
                value={drafts[item.clave]}
                onChange={(e) => setDrafts(d => ({ ...d, [item.clave]: e.target.value }))}
                type={item.tipo === "number" ? "number" : "text"}
                className="flex-1 px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded text-white font-barlow text-sm focus:outline-none focus:border-primary"
              />
            )}
            <button
              onClick={() => save(item)}
              disabled={isPending}
              className="bg-primary hover:opacity-90 text-white font-barlow font-medium text-sm px-5 py-2 rounded-full disabled:opacity-50 cursor-pointer"
            >
              {saved[item.clave] ? "✓ Guardado" : "Guardar"}
            </button>
          </div>
          {errors[item.clave] && (
            <p className="font-barlow text-[12px] text-red-400 mt-2">{errors[item.clave]}</p>
          )}
          <p className="font-barlow text-[11px] text-white/30 mt-2">
            Última actualización: {new Date(item.actualizada_en).toLocaleString("es-ES")}
          </p>
        </div>
      ))}
    </div>
  );
}
