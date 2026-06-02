export type MovimientoTipo = 'ingreso' | 'egreso';
export type MovimientoMetodo = 'efectivo' | 'tarjeta' | 'transferencia' | 'bizum' | 'otro';
export type CategoriaIngreso = 'venta' | 'reserva' | 'delivery' | 'free_tour' | 'otro';
export type CategoriaEgreso = 'compra' | 'sueldo' | 'alquiler' | 'suministros' | 'impuestos' | 'comision_pueblo' | 'otro';

export interface MovimientoCajaDB {
  id: string;
  prestador_id: string;
  tipo: MovimientoTipo;
  categoria: string;
  concepto: string;
  importe: number;
  metodo: MovimientoMetodo;
  pedido_delivery_id: string | null;
  reserva_id: string | null;
  free_tour_inscripcion_id: string | null;
  es_automatico: boolean;
  fecha: string;
  notas: string | null;
  registrado_por: string;
  created_at: string;
  updated_at: string;
}

export interface ResumenCajaMes {
  year: number;
  month: number;
  total_ingresos: number;
  total_egresos: number;
  balance: number;
  total_movimientos: number;
  por_categoria: Record<string, number>;
}
