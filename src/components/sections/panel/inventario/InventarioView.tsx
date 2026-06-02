"use client";

import { useState, useTransition } from "react";
import type { InventarioItemDB } from "@/types/inventario";
import { formatCurrency } from "@/lib/format/currency";

// ─── Stock bar ────────────────────────────────────────────────────────────────

function StockBar({ actual, minimo, maximo = 100 }: { actual: number; minimo: number; maximo?: number }) {
  const pct = Math.min(100, Math.max(0, (actual / Math.max(maximo, actual + 1)) * 100));
  const minPct = Math.min(100, (minimo / Math.max(maximo, actual + 1)) * 100);
  const color = actual === 0 ? "#c81b3a" : actual <= minimo ? "#d97706" : "#059669";

  return (
    <div className="relative h-2 bg-[#f0f0f0] rounded-full overflow-visible">
      <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      {minimo > 0 && (
        <div
          className="absolute top-[-3px] w-[1px] h-[14px] bg-[#888]"
          style={{ left: `${minPct}%` }}
          title={`Mínimo: ${minimo}`}
        />
      )}
    </div>
  );
}

// ─── Estado pill ─────────────────────────────────────────────────────────────

function PillEstado({ item }: { item: InventarioItemDB }) {
  if (Number(item.stock_actual) === 0)
    return <span className="text-[10px] font-barlow font-700 px-2 py-0.5 rounded-full bg-[#fde8ec] text-[#c81b3a]">SIN STOCK</span>;
  if (Number(item.stock_actual) <= Number(item.stock_minimo))
    return <span className="text-[10px] font-barlow font-700 px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#d97706]">BAJO</span>;
  return <span className="text-[10px] font-barlow font-700 px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#059669]">OK</span>;
}

// ─── Modal ajuste de stock ────────────────────────────────────────────────────

interface AjusteModalProps {
  item: InventarioItemDB;
  onClose: () => void;
  onAjuste: (data: { tipo: "entrada" | "salida" | "ajuste" | "merma"; cantidad: number; motivo: string }) => Promise<void>;
}

function AjusteModal({ item, onClose, onAjuste }: AjusteModalProps) {
  const [tipo, setTipo] = useState<"entrada" | "salida" | "ajuste" | "merma">("ajuste");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const motivos = ["Cuadre físico", "Caducidad", "Rotura", "Devolución", "Otro"];

  function handleSubmit() {
    const cant = parseFloat(cantidad);
    if (!cant || cant <= 0) { setError("La cantidad debe ser mayor que 0"); return; }
    if (!motivo) { setError("El motivo es obligatorio"); return; }
    setError("");
    startTransition(async () => {
      await onAjuste({ tipo, cantidad: cant, motivo });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-[18px] w-full max-w-md p-8" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.16)" }}>
        <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase mb-1">AJUSTE DE STOCK</p>
        <h2 className="font-fraunces font-semibold text-[20px] text-[#1f1f1f] mb-6">{item.nombre}</h2>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
              {(["entrada", "salida", "ajuste", "merma"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`py-2 rounded-lg text-[12px] font-barlow font-600 capitalize border transition-colors ${
                    tipo === t ? "bg-[#1f1f1f] text-white border-[#1f1f1f]" : "bg-white text-[#333] border-[#e5e5e5] hover:border-[#999]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">
              Cantidad ({item.unidad})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              placeholder="0"
              className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[15px] font-barlow focus:outline-none focus:border-[#0070cc]"
            />
          </div>

          <div>
            <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Motivo *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {motivos.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className={`text-[12px] font-barlow font-500 px-3 py-1.5 rounded-full border transition-colors ${
                    motivo === m ? "bg-[#1f1f1f] text-white border-[#1f1f1f]" : "border-[#e5e5e5] text-[#444] hover:border-[#999]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-[13px] text-[#c81b3a]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#e5e5e5] text-[14px] font-barlow font-600 text-[#444] hover:border-[#999] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="flex-1 py-3 rounded-xl bg-[#1f1f1f] text-white text-[14px] font-barlow font-600 disabled:opacity-50 hover:bg-[#333] transition-colors"
            >
              {pending ? "Guardando…" : "Aplicar ajuste"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal nuevo item ─────────────────────────────────────────────────────────

interface NuevoItemModalProps {
  onClose: () => void;
  onCreate: (data: FormData) => Promise<void>;
}

function NuevoItemModal({ onClose, onCreate }: NuevoItemModalProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError("");
    startTransition(async () => {
      try {
        await onCreate(fd);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  }

  const unidades = ["unidad", "kg", "l", "caja", "docena", "otro"];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-[18px] w-full max-w-lg p-8" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.16)" }}>
        <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase mb-1">NUEVO ITEM</p>
        <h2 className="font-fraunces font-semibold text-[20px] text-[#1f1f1f] mb-6">Añadir al inventario</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Nombre *</label>
              <input name="nombre" required className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" />
            </div>
            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">SKU</label>
              <input name="sku" className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" />
            </div>
            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Unidad</label>
              <select name="unidad" defaultValue="unidad" className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc] bg-white">
                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Stock inicial</label>
              <input name="stock_actual" type="number" step="0.01" min="0" defaultValue="0" className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" />
            </div>
            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Stock mínimo</label>
              <input name="stock_minimo" type="number" step="0.01" min="0" defaultValue="0" className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" />
            </div>
            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Precio compra (€)</label>
              <input name="precio_compra" type="number" step="0.01" min="0" className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" />
            </div>
            <div>
              <label className="text-[11px] font-barlow font-600 text-[#666] uppercase tracking-[0.06em] mb-1 block">Precio venta (€)</label>
              <input name="precio_venta" type="number" step="0.01" min="0" className="w-full border border-[#e5e5e5] rounded-xl px-4 py-3 text-[14px] font-barlow focus:outline-none focus:border-[#0070cc]" />
            </div>
          </div>

          {error && <p className="text-[13px] text-[#c81b3a]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#e5e5e5] text-[14px] font-barlow font-600 text-[#444] hover:border-[#999] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex-1 py-3 rounded-xl bg-[#1f1f1f] text-white text-[14px] font-barlow font-600 disabled:opacity-50 hover:bg-[#333] transition-colors">
              {pending ? "Creando…" : "Crear item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Panel detalle ────────────────────────────────────────────────────────────

interface DetallePanelProps {
  item: InventarioItemDB;
  onAjuste: (data: { tipo: "entrada" | "salida" | "ajuste" | "merma"; cantidad: number; motivo: string }) => Promise<void>;
  onQuickAdjust: (delta: number) => Promise<void>;
}

function DetallePanel({ item, onAjuste, onQuickAdjust }: DetallePanelProps) {
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [pending, startTransition] = useTransition();

  const stock = Number(item.stock_actual);
  const minimo = Number(item.stock_minimo);
  const stockColor = stock === 0 ? "#c81b3a" : stock <= minimo ? "#d97706" : "#059669";

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      {showAjusteModal && (
        <AjusteModal item={item} onClose={() => setShowAjusteModal(false)} onAjuste={onAjuste} />
      )}

      <div>
        <p className="text-[10px] font-barlow font-700 tracking-[0.08em] text-[#888] uppercase font-mono">
          {item.sku ?? "—"} · {item.nombre}
        </p>
        <h2 className="font-fraunces font-semibold text-[22px] text-[#1f1f1f] mt-1 leading-tight">{item.nombre}</h2>
        <div className="mt-2"><PillEstado item={item} /></div>
      </div>

      {/* Control stock */}
      <div className="bg-white border border-[#e5e5e5] rounded-[14px] p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            disabled={pending}
            onClick={() => startTransition(() => onQuickAdjust(-1))}
            className="w-[46px] h-[46px] rounded-xl border border-[#e5e5e5] flex items-center justify-center text-[20px] text-[#444] hover:border-[#999] disabled:opacity-40 transition-colors"
          >
            −
          </button>
          <div className="text-center">
            <span className="font-fraunces font-semibold text-[54px] leading-none" style={{ color: stockColor }}>
              {stock % 1 === 0 ? stock : stock.toFixed(2)}
            </span>
            <span className="text-[14px] font-barlow text-[#888] ml-1">{item.unidad}</span>
          </div>
          <button
            disabled={pending}
            onClick={() => startTransition(() => onQuickAdjust(1))}
            className="w-[46px] h-[46px] rounded-xl bg-[#1f1f1f] flex items-center justify-center text-[20px] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
          >
            +
          </button>
        </div>
        {minimo > 0 && (
          <div className="mb-3">
            <StockBar actual={stock} minimo={minimo} maximo={Math.max(stock * 2, minimo * 3, 10)} />
            <p className="text-[11px] text-[#888] font-barlow mt-1">Mínimo: {minimo} {item.unidad}</p>
          </div>
        )}
        <button
          onClick={() => setShowAjusteModal(true)}
          className="w-full py-2.5 rounded-xl border border-[#e5e5e5] text-[13px] font-barlow font-600 text-[#444] hover:border-[#999] transition-colors"
        >
          Ajuste manual con motivo
        </button>
      </div>

      {/* Datos del item */}
      <div className="bg-white border border-[#e5e5e5] rounded-[14px] p-5 space-y-3">
        <h3 className="text-[11px] font-barlow font-700 tracking-[0.06em] text-[#888] uppercase">Datos del item</h3>
        {[
          { label: "Unidad", value: item.unidad },
          { label: "Stock mínimo", value: `${item.stock_minimo} ${item.unidad}` },
          item.precio_compra != null ? { label: "Precio compra", value: formatCurrency(item.precio_compra) } : null,
          item.precio_venta  != null ? { label: "Precio venta",  value: formatCurrency(item.precio_venta)  } : null,
          { label: "SKU", value: item.sku ?? "—" },
        ].filter(Boolean).map(row => (
          <div key={row!.label} className="flex justify-between">
            <span className="text-[13px] font-barlow text-[#888]">{row!.label}</span>
            <span className="text-[13px] font-barlow font-600 text-[#1f1f1f] font-mono">{row!.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface Props {
  items: InventarioItemDB[];
  onCrearItem: (data: FormData) => Promise<void>;
  onAjustarStock: (itemId: string, tipo: "entrada" | "salida" | "ajuste" | "merma", cantidad: number, motivo?: string) => Promise<{ ok: boolean; nuevoStock?: number }>;
}

export default function InventarioView({ items, onCrearItem, onAjustarStock }: Props) {
  const [filtro, setFiltro] = useState<"todos" | "bajo" | "sin_stock" | "inactivos">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [selected, setSelected] = useState<InventarioItemDB | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [localItems, setLocalItems] = useState(items);

  const bajoMinimo = localItems.filter(i => i.activo && Number(i.stock_actual) <= Number(i.stock_minimo) && Number(i.stock_actual) > 0);
  const sinStock   = localItems.filter(i => i.activo && Number(i.stock_actual) === 0);
  const activos    = localItems.filter(i => i.activo).length;
  const valorStock = localItems.filter(i => i.activo && i.precio_compra).reduce((s, i) => s + Number(i.stock_actual) * Number(i.precio_compra!), 0);

  const filtered = localItems.filter(item => {
    if (filtro === "bajo")      return item.activo && Number(item.stock_actual) <= Number(item.stock_minimo);
    if (filtro === "sin_stock") return item.activo && Number(item.stock_actual) === 0;
    if (filtro === "inactivos") return !item.activo;
    return item.activo;
  }).filter(item =>
    busqueda === "" ||
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (item.sku ?? "").toLowerCase().includes(busqueda.toLowerCase())
  );

  async function handleAjuste(item: InventarioItemDB, tipo: "entrada" | "salida" | "ajuste" | "merma", cantidad: number, motivo?: string) {
    const result = await onAjustarStock(item.id, tipo, cantidad, motivo);
    if (result.ok && result.nuevoStock !== undefined) {
      setLocalItems(prev => prev.map(i => i.id === item.id ? { ...i, stock_actual: result.nuevoStock! } : i));
      setSelected(prev => prev?.id === item.id ? { ...prev, stock_actual: result.nuevoStock! } : prev);
    }
  }

  return (
    <div className="flex h-full bg-[#f7f7f5]">
      {showNuevo && (
        <NuevoItemModal
          onClose={() => setShowNuevo(false)}
          onCreate={async (fd) => {
            await onCrearItem(fd);
            setShowNuevo(false);
          }}
        />
      )}

      {/* Lista */}
      <div className="w-[760px] flex-shrink-0 flex flex-col h-full border-r border-[#e5e5e5]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#e5e5e5] bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-fraunces font-semibold text-[28px] text-[#1f1f1f]">Inventario</h1>
            <button
              onClick={() => setShowNuevo(true)}
              className="flex items-center gap-2 bg-[#1f1f1f] text-white text-[13px] font-barlow font-600 px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors"
            >
              <span className="text-[16px] leading-none">+</span>
              Nuevo item
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "Items activos", value: activos, color: "#1f1f1f" },
              { label: "Bajo mínimo", value: bajoMinimo.length, color: "#d97706", highlight: bajoMinimo.length > 0 },
              { label: "Sin stock", value: sinStock.length, color: "#c81b3a", highlight: sinStock.length > 0 },
              { label: "Valor stock", value: formatCurrency(valorStock), color: "#1f1f1f" },
            ].map(stat => (
              <div
                key={stat.label}
                className={`bg-white rounded-xl p-3 border ${stat.highlight ? "border-[#f0a800]" : "border-[#e5e5e5]"}`}
              >
                <p className="text-[10px] font-barlow text-[#888] uppercase tracking-[0.06em] mb-1">{stat.label}</p>
                <p className="font-fraunces font-semibold text-[20px]" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Búsqueda + filtros */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o SKU…"
                className="w-full pl-9 pr-4 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] font-barlow focus:outline-none focus:border-[#0070cc] bg-[#f7f7f5]"
              />
            </div>
            {(["todos", "bajo", "sin_stock", "inactivos"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`text-[12px] font-barlow font-600 px-3 py-2 rounded-xl border transition-colors ${
                  filtro === f ? "bg-[#1f1f1f] text-white border-[#1f1f1f]" : "border-[#e5e5e5] text-[#444] hover:border-[#999]"
                }`}
              >
                {f === "todos" ? "Todos" : f === "bajo" ? `Bajo mín. ${bajoMinimo.length > 0 ? `(${bajoMinimo.length})` : ""}` : f === "sin_stock" ? "Sin stock" : "Inactivos"}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla header */}
        <div className="grid gap-2 px-6 py-2.5 bg-[#f7f7f5] border-b border-[#e5e5e5] text-[10px] font-barlow font-700 text-[#888] uppercase tracking-[0.06em]"
          style={{ gridTemplateColumns: "1fr 110px 130px 80px" }}
        >
          <span>Item</span><span>SKU</span><span>Stock</span><span>Acciones</span>
        </div>

        {/* Filas */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[15px] font-barlow text-[#888]">No hay items que mostrar</p>
              <button onClick={() => setShowNuevo(true)} className="mt-4 text-[13px] font-barlow font-600 text-[#0070cc] underline">
                Añadir el primero
              </button>
            </div>
          )}
          {filtered.map(item => {
            const isSelected = selected?.id === item.id;
            const stock = Number(item.stock_actual);
            const bajo = stock <= Number(item.stock_minimo);
            const sinStock = stock === 0;

            return (
              <div
                key={item.id}
                onClick={() => setSelected(isSelected ? null : item)}
                className={`grid items-center gap-2 px-6 py-3.5 cursor-pointer border-b border-[#f0f0f0] transition-colors ${
                  isSelected ? "bg-[rgba(0,112,204,0.06)] border-l-[3px] border-l-[#0070cc]" : "hover:bg-[#f7f7f5]"
                } ${sinStock ? "bg-[rgba(200,27,58,0.03)]" : bajo ? "bg-[rgba(217,119,6,0.03)]" : ""}`}
                style={{ gridTemplateColumns: "1fr 110px 130px 80px" }}
              >
                <div>
                  <p className="text-[13px] font-barlow font-600 text-[#1f1f1f]">{item.nombre}</p>
                  {item.descripcion && <p className="text-[11px] font-barlow text-[#888] truncate">{item.descripcion}</p>}
                </div>
                <span className="text-[11px] font-mono text-[#888]">{item.sku ?? "—"}</span>
                <div className="flex items-center gap-2">
                  <span className="font-fraunces font-semibold text-[16px] text-[#1f1f1f]">
                    {stock % 1 === 0 ? stock : stock.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-barlow text-[#888]">{item.unidad}</span>
                  <PillEstado item={item} />
                </div>
                <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleAjuste(item, "salida", 1)}
                    className="w-[28px] h-[28px] rounded-[7px] border border-[#e5e5e5] flex items-center justify-center text-[16px] text-[#444] hover:border-[#999] transition-colors"
                  >−</button>
                  <button
                    onClick={() => handleAjuste(item, "entrada", 1)}
                    className="w-[28px] h-[28px] rounded-[7px] bg-[#1f1f1f] flex items-center justify-center text-[16px] text-white hover:bg-[#333] transition-colors"
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel detalle */}
      <div className="flex-1 bg-[#f7f7f5]">
        {selected ? (
          <DetallePanel
            item={selected}
            onAjuste={({ tipo, cantidad, motivo }) => handleAjuste(selected, tipo, cantidad, motivo)}
            onQuickAdjust={delta => handleAjuste(selected, delta > 0 ? "entrada" : "salida", Math.abs(delta))}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
                <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
            </div>
            <p className="text-[15px] font-barlow text-[#888]">Seleccioná un item para ver el detalle</p>
          </div>
        )}
      </div>
    </div>
  );
}
