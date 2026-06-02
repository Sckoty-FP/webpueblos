export interface PedidoItemDB {
  id: string;
  pedido_id: string;
  plato_id: string | null;
  nombre_snapshot: string;
  precio_snapshot: number;
  cantidad: number;
  subtotal: number;
}

export interface PedidoEstadoDB {
  id: string;
  pedido_id: string;
  estado: string;
  nota: string | null;
  created_at: string;
}

export interface PlatoDB {
  id: string;
  prestador_id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  precio: number;
  precio_oferta: number | null;
  imagen_url: string | null;
  alergenos: string[];
  vegetariano: boolean;
  vegano: boolean;
  sin_gluten: boolean;
  picante: number | null;
  disponible_local: boolean;
  disponible_delivery: boolean;
  tiempo_preparacion_min: number;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}
