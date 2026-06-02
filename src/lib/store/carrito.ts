"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CarritoItem {
  platoId:   string;
  nombre:    string;
  precio:    number;
  cantidad:  number;
  imagenUrl: string | null;
}

interface CarritoCtx {
  prestadorId:     string;
  prestadorSlug:   string;
  prestadorNombre: string;
  puebloSlug:      string;
}

interface CarritoState {
  prestadorId:     string | null;
  prestadorSlug:   string | null;
  prestadorNombre: string | null;
  puebloSlug:      string | null;
  items:           CarritoItem[];
  addItem:         (ctx: CarritoCtx, item: Omit<CarritoItem, 'cantidad'>) => void;
  removeItem:      (platoId: string) => void;
  updateCantidad:  (platoId: string, cantidad: number) => void;
  clearCarrito:    () => void;
  loadFromPedido:  (ctx: CarritoCtx, items: CarritoItem[]) => void;
}

const EMPTY = {
  prestadorId:     null as string | null,
  prestadorSlug:   null as string | null,
  prestadorNombre: null as string | null,
  puebloSlug:      null as string | null,
  items:           [] as CarritoItem[],
};

export const useCarrito = create<CarritoState>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      addItem(ctx, item) {
        const s = get();
        // Nuevo negocio: reemplazar carrito silenciosamente
        if (s.prestadorId && s.prestadorId !== ctx.prestadorId && s.items.length > 0) {
          set({ ...ctx, items: [{ ...item, cantidad: 1 }] });
          return;
        }
        const existing = s.items.find(i => i.platoId === item.platoId);
        if (existing) {
          set({ items: s.items.map(i => i.platoId === item.platoId ? { ...i, cantidad: i.cantidad + 1 } : i) });
        } else {
          set({ ...ctx, items: [...s.items, { ...item, cantidad: 1 }] });
        }
      },

      removeItem: (platoId) =>
        set(s => ({ items: s.items.filter(i => i.platoId !== platoId) })),

      updateCantidad: (platoId, cantidad) => {
        if (cantidad <= 0) {
          set(s => ({ items: s.items.filter(i => i.platoId !== platoId) }));
          return;
        }
        set(s => ({ items: s.items.map(i => i.platoId === platoId ? { ...i, cantidad } : i) }));
      },

      clearCarrito: () => set(EMPTY),

      loadFromPedido(ctx, items) {
        set({ ...ctx, items });
      },
    }),
    {
      name:       'carrito-delivery',
      storage:    createJSONStorage(() => localStorage),
      partialize: (s) => ({
        prestadorId:     s.prestadorId,
        prestadorSlug:   s.prestadorSlug,
        prestadorNombre: s.prestadorNombre,
        puebloSlug:      s.puebloSlug,
        items:           s.items,
      }),
    },
  ),
);

export const selectTotalItems  = (s: CarritoState) => s.items.reduce((acc, i) => acc + i.cantidad, 0);
export const selectTotalPrecio = (s: CarritoState) => s.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
