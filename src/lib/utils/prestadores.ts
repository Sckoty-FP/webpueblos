import type { ServicioDB, HorarioDB } from "@/types";

const CAT_MAP: Record<string, { label: string; id: string }> = {
  restaurante:           { label: "Restaurantes", id: "restaurantes"  },
  bar:                   { label: "Bares",        id: "bares"         },
  cafeteria:             { label: "Restaurantes", id: "restaurantes"  },
  heladeria:             { label: "Restaurantes", id: "restaurantes"  },
  hotel:                 { label: "Hospedaje",    id: "hospedaje"     },
  apartamento_turistico: { label: "Hospedaje",    id: "hospedaje"     },
  camping:               { label: "Hospedaje",    id: "hospedaje"     },
  hostal:                { label: "Hospedaje",    id: "hospedaje"     },
  supermercado:          { label: "Comercios",    id: "comercios"     },
  panaderia:             { label: "Comercios",    id: "comercios"     },
  farmacia:              { label: "Comercios",    id: "comercios"     },
  tienda_ropa:           { label: "Comercios",    id: "comercios"     },
  comercio_general:      { label: "Comercios",    id: "comercios"     },
  peluqueria:            { label: "Servicios",    id: "servicios"     },
  estetica:              { label: "Servicios",    id: "servicios"     },
  spa:                   { label: "Servicios",    id: "servicios"     },
  gimnasio:              { label: "Servicios",    id: "servicios"     },
  fontaneria:            { label: "Profesionales",id: "profesionales" },
  electricidad:          { label: "Profesionales",id: "profesionales" },
  taller_mecanico:       { label: "Profesionales",id: "profesionales" },
  limpieza:              { label: "Profesionales",id: "profesionales" },
  jardineria:            { label: "Profesionales",id: "profesionales" },
  clinica:               { label: "Salud",        id: "salud"         },
  fisioterapia:          { label: "Salud",        id: "salud"         },
  veterinario:           { label: "Salud",        id: "salud"         },
  alquiler_bicis:        { label: "Actividades",  id: "actividades"   },
  alquiler_barcos:       { label: "Actividades",  id: "actividades"   },
  escuela_nautica:       { label: "Actividades",  id: "actividades"   },
  actividades_aventura:  { label: "Actividades",  id: "actividades"   },
  tour_guiado:           { label: "Actividades",  id: "actividades"   },
  otro:                  { label: "Otros",        id: "otros"         },
};

export function getCatFromServicios(servicios: ServicioDB[]): { label: string; id: string } {
  const first = servicios.find((s) => s.activo) ?? servicios[0];
  if (!first) return { label: "Servicios", id: "servicios" };
  return CAT_MAP[first.categoria] ?? { label: "Servicios", id: "servicios" };
}

export function isOpenNow(horarios: HorarioDB[]): boolean {
  const now = new Date();
  const day = now.getDay();
  const time = now.toTimeString().slice(0, 5);
  const h = horarios.find((h) => h.dia_semana === day);
  if (!h || h.cerrado || !h.hora_apertura || !h.hora_cierre) return false;
  return time >= h.hora_apertura && time <= h.hora_cierre;
}

export function getPrecioDisplay(servicios: ServicioDB[]): string {
  const activos = servicios.filter((s) => s.activo && s.precio_desde != null);
  if (!activos.length) return "Consultar";
  const min = Math.min(...activos.map((s) => s.precio_desde!));
  return `Desde ${min.toFixed(0)}€`;
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function horariosToDisplay(horarios: HorarioDB[]): Record<string, string> {
  const sorted = [...horarios].sort((a, b) => a.dia_semana - b.dia_semana);
  const result: Record<string, string> = {};
  for (const h of sorted) {
    result[DIAS[h.dia_semana]] = h.cerrado
      ? "Cerrado"
      : h.hora_apertura && h.hora_cierre
        ? `${h.hora_apertura} – ${h.hora_cierre}`
        : "Horario no disponible";
  }
  return result;
}
