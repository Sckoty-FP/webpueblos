export type UnidadInventario = 'unidad' | 'kg' | 'l' | 'caja' | 'docena' | 'otro';
export type TipoMovimientoInventario = 'entrada' | 'salida' | 'ajuste' | 'merma' | 'auto';

export interface InventarioItemDB {
  id: string;
  prestador_id: string;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  unidad: UnidadInventario;
  stock_actual: number;
  stock_minimo: number;
  precio_compra: number | null;
  precio_venta: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventarioMovimientoDB {
  id: string;
  item_id: string;
  prestador_id: string;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string | null;
  hecho_por: string;
  created_at: string;
  hecho_por_usuario?: { nombre: string } | null;
}
