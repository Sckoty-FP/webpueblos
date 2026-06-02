"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { HorarioDB } from "@/types";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ORDERED = [1, 2, 3, 4, 5, 6, 0]; // Lunes → Domingo

type HorarioLocal = HorarioDB & { id?: string };

function buildDefault(prestadorId: string): HorarioLocal[] {
  return ORDERED.map((dia) => ({
    dia_semana: dia,
    hora_apertura: "09:00",
    hora_cierre: "21:00",
    cerrado: dia === 0,
    notas: null,
  }));
}

export default function HorariosEditor({
  prestadorId,
  horarios,
}: {
  prestadorId: string;
  horarios: HorarioDB[];
}) {
  const initialHorarios: HorarioLocal[] = ORDERED.map((dia) => {
    const existing = horarios.find((h) => h.dia_semana === dia);
    return existing ?? { dia_semana: dia, hora_apertura: "09:00", hora_cierre: "21:00", cerrado: dia === 0, notas: null };
  });

  const [rows, setRows]     = useState<HorarioLocal[]>(initialHorarios);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  function update(dia: number, field: keyof HorarioLocal, value: string | boolean | null) {
    setRows((prev) => prev.map((r) => r.dia_semana === dia ? { ...r, [field]: value } : r));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const supabase = createClient();

    for (const row of rows) {
      const payload = {
        prestador_id: prestadorId,
        dia_semana: row.dia_semana,
        hora_apertura: row.cerrado ? null : row.hora_apertura,
        hora_cierre: row.cerrado ? null : row.hora_cierre,
        cerrado: row.cerrado,
        notas: row.notas ?? null,
      };
      const { error: err } = await supabase
        .from("horarios")
        .upsert(payload, { onConflict: "prestador_id,dia_semana" });

      if (err) { setError("Error al guardar. Intentá de nuevo."); setSaving(false); return; }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-card border border-divisor overflow-hidden mb-6" style={{ boxShadow: "rgba(0,0,0,0.04) 0px 2px 8px" }}>
        {rows.map((row, idx) => (
          <div
            key={row.dia_semana}
            className="flex items-center gap-4 px-6 py-4 max-sm:flex-wrap max-sm:gap-3"
            style={{ borderTop: idx > 0 ? "1px solid #f0f0ef" : "none" }}
          >
            {/* Day name */}
            <div className="w-28 shrink-0">
              <span className="font-barlow font-semibold text-[14px] text-text-body">{DIAS[row.dia_semana]}</span>
            </div>

            {/* Toggle abierto/cerrado */}
            <button
              type="button"
              onClick={() => update(row.dia_semana, "cerrado", !row.cerrado)}
              className="shrink-0 flex items-center gap-2 cursor-pointer border-none bg-transparent p-0"
            >
              <div
                className="w-10 h-5.5 rounded-full relative transition-colors duration-200"
                style={{ background: row.cerrado ? "#e5e7eb" : "var(--color-primary)", height: "22px" }}
              >
                <div
                  className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ width: "18px", height: "18px", top: "2px", left: row.cerrado ? "2px" : "calc(100% - 20px)", boxShadow: "rgba(0,0,0,0.2) 0px 1px 3px" }}
                />
              </div>
              <span className="font-barlow text-[13px] text-text-muted w-12">{row.cerrado ? "Cerrado" : "Abierto"}</span>
            </button>

            {/* Hours */}
            {!row.cerrado && (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={row.hora_apertura ?? "09:00"}
                  onChange={(e) => update(row.dia_semana, "hora_apertura", e.target.value)}
                  className="font-barlow text-[14px] text-text-body border border-[#e5e7eb] rounded-card px-3 py-1.5 outline-none focus:border-primary transition-colors"
                />
                <span className="font-barlow text-[13px] text-text-muted">—</span>
                <input
                  type="time"
                  value={row.hora_cierre ?? "21:00"}
                  onChange={(e) => update(row.dia_semana, "hora_cierre", e.target.value)}
                  className="font-barlow text-[14px] text-text-body border border-[#e5e7eb] rounded-card px-3 py-1.5 outline-none focus:border-primary transition-colors"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="font-barlow font-bold text-[15px] text-white bg-primary rounded-pill px-7 py-2.5 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
          {saving ? "Guardando..." : "Guardar horarios"}
        </button>
        {saved && <p className="font-barlow text-[14px] text-green-600 flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Guardado</p>}
        {error && <p className="font-barlow text-[13px] text-red-600">{error}</p>}
      </div>
    </div>
  );
}
