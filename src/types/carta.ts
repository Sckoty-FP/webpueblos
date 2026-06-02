export interface MesaDB {
  id: string;
  prestador_id: string;
  numero: number;
  nombre: string | null;
  capacidad: number;
  zona: string;
  activa: boolean;
  created_at: string;
}

export type ZonaMesa = "interior" | "terraza" | "barra" | "privado";
export type CategoriaCarta = "entrante" | "principal" | "postre" | "bebida" | "menu_dia" | "especial";

export const ZONAS_MESA: ZonaMesa[] = ["interior", "terraza", "barra", "privado"];
export const CATEGORIAS_CARTA: CategoriaCarta[] = ["entrante", "principal", "postre", "bebida", "menu_dia", "especial"];

export const CATEGORIAS_LABEL: Record<string, string> = {
  entrante:  "Entrantes",
  principal: "Principales",
  postre:    "Postres",
  bebida:    "Bebidas",
  menu_dia:  "Menú del día",
  especial:  "Especiales",
};

// Los 14 alérgenos de la UE
export const ALERGENOS_EU: Record<string, { label: string; emoji: string }> = {
  gluten:        { label: "Gluten",          emoji: "🌾" },
  lacteos:       { label: "Lácteos",         emoji: "🥛" },
  huevos:        { label: "Huevos",          emoji: "🥚" },
  pescado:       { label: "Pescado",         emoji: "🐟" },
  mariscos:      { label: "Mariscos",        emoji: "🦐" },
  cacahuetes:    { label: "Cacahuetes",      emoji: "🥜" },
  frutos_secos:  { label: "Frutos secos",   emoji: "🌰" },
  soja:          { label: "Soja",            emoji: "🫘" },
  apio:          { label: "Apio",            emoji: "🥬" },
  mostaza:       { label: "Mostaza",         emoji: "🟡" },
  sesamo:        { label: "Sésamo",          emoji: "🌱" },
  sulfitos:      { label: "Sulfitos",        emoji: "🍷" },
  altramuces:    { label: "Altramuces",      emoji: "🌻" },
  moluscos:      { label: "Moluscos",        emoji: "🦑" },
};
