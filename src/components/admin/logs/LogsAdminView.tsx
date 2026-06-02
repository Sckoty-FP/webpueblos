"use client";

import { useState } from "react";
import { formatAbsolute } from "@/lib/format/relative-date";

interface AuditEntry {
  id:           string;
  usuario_id:   string | null;
  accion:       string;
  tabla:        string;
  registro_id:  string | null;
  datos_antes:  Record<string, unknown> | null;
  datos_despues: Record<string, unknown> | null;
  created_at:   string;
  usuario?:     { email: string; nombre: string | null } | null;
}

interface Props {
  logs: AuditEntry[];
}

const ACCION_COLOR: Record<string, string> = {
  INSERT:             "text-emerald-400",
  UPDATE:             "text-blue-400",
  DELETE:             "text-red-400",
  suspender_negocio:  "text-orange-400",
};

export default function LogsAdminView({ logs }: Props) {
  const [filtroTabla,   setFiltroTabla]   = useState("");
  const [filtroAccion,  setFiltroAccion]  = useState("");
  const [expandedId,    setExpandedId]    = useState<string | null>(null);

  const tablas  = [...new Set(logs.map((l) => l.tabla))].sort();
  const acciones = [...new Set(logs.map((l) => l.accion))].sort();

  const filtrados = logs.filter((l) =>
    (!filtroTabla  || l.tabla  === filtroTabla)  &&
    (!filtroAccion || l.accion === filtroAccion)
  );

  return (
    <div className="min-h-screen bg-[#0f1117] text-white pt-14 md:pt-0">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <p className="font-barlow text-[12px] text-white/30 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="font-fraunces font-semibold text-[28px] text-white">Logs de auditoría</h1>
          <p className="font-barlow text-[13px] text-white/40 mt-1">
            Últimas {logs.length} entradas
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={filtroTabla}
            onChange={(e) => setFiltroTabla(e.target.value)}
            className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todas las tablas</option>
            {tablas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 font-barlow text-[13px] text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todas las acciones</option>
            {acciones.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          {(filtroTabla || filtroAccion) && (
            <button
              onClick={() => { setFiltroTabla(""); setFiltroAccion(""); }}
              className="font-barlow text-[12px] text-white/40 hover:text-white/70 px-3 py-2"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Tabla de logs */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Fecha", "Usuario", "Acción", "Tabla", "Registro", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-barlow text-[11px] text-white/30 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((entry) => (
                  <>
                    <tr
                      key={entry.id}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <td className="px-4 py-3 font-barlow text-[12px] text-white/50 whitespace-nowrap">
                        {formatAbsolute(entry.created_at)}
                      </td>
                      <td className="px-4 py-3 font-barlow text-[12px] text-white/70 max-w-[140px] truncate">
                        {entry.usuario?.email ?? entry.usuario_id?.slice(0, 8) ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-barlow text-[12px] font-medium ${ACCION_COLOR[entry.accion] ?? "text-white/60"}`}>
                          {entry.accion}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-barlow text-[12px] text-white/50">
                        {entry.tabla}
                      </td>
                      <td className="px-4 py-3 font-barlow text-[11px] text-white/30 font-mono">
                        {entry.registro_id?.slice(0, 8) ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {(entry.datos_antes || entry.datos_despues) && (
                          <span className="font-barlow text-[11px] text-white/20">
                            {expandedId === entry.id ? "▲" : "▼"}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedId === entry.id && (
                      <tr key={`${entry.id}-detail`} className="bg-white/[0.01]">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid md:grid-cols-2 gap-4">
                            {entry.datos_antes && (
                              <div>
                                <p className="font-barlow text-[10px] text-red-400/60 uppercase mb-1">Antes</p>
                                <pre className="font-mono text-[11px] text-white/40 bg-white/[0.03] rounded p-2 overflow-auto max-h-32">
                                  {JSON.stringify(entry.datos_antes, null, 2)}
                                </pre>
                              </div>
                            )}
                            {entry.datos_despues && (
                              <div>
                                <p className="font-barlow text-[10px] text-emerald-400/60 uppercase mb-1">Después</p>
                                <pre className="font-mono text-[11px] text-white/40 bg-white/[0.03] rounded p-2 overflow-auto max-h-32">
                                  {JSON.stringify(entry.datos_despues, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center font-barlow text-[13px] text-white/30">
                      Sin entradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
