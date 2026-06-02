import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Mountain } from "lucide-react";
import type { RutaDB } from "@/types";

interface Props {
  puebloSlug: string;
  rutas: RutaDB[];
}

const DIFICULTAD_COLOR: Record<string, string> = {
  facil: "bg-green-100 text-green-700",
  moderada: "bg-yellow-100 text-yellow-700",
  dificil: "bg-orange-100 text-orange-700",
  muy_dificil: "bg-red-100 text-red-700",
};

const DIFICULTAD_LABEL: Record<string, string> = {
  facil: "Fácil",
  moderada: "Moderada",
  dificil: "Difícil",
  muy_dificil: "Muy difícil",
};

function formatDuracion(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export default function RutasListado({ puebloSlug, rutas }: Props) {
  if (rutas.length === 0) {
    return (
      <p className="font-barlow text-base text-text-muted py-8">
        Aún no hay rutas publicadas. Volvé pronto.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {rutas.map(r => (
        <Link
          key={r.id}
          href={`/${puebloSlug}/rutas/${r.slug}`}
          className="group bg-white rounded-card-lg overflow-hidden border border-divisor hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          <div className="relative aspect-[16/10] bg-fog overflow-hidden">
            {r.imagen_principal_url ? (
              <Image
                src={r.imagen_principal_url}
                alt={r.nombre}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 photo-ruta1" />
            )}
            <span
              className={`absolute top-2 left-2 text-[10px] font-barlow font-medium px-2 py-0.5 rounded-pill ${DIFICULTAD_COLOR[r.dificultad] ?? "bg-gray-100 text-gray-600"}`}
            >
              {DIFICULTAD_LABEL[r.dificultad] ?? r.dificultad}
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-fraunces text-base font-semibold text-text-body line-clamp-1 mb-1">
              {r.nombre}
            </h3>
            {r.descripcion_corta && (
              <p className="font-barlow text-sm text-text-muted line-clamp-2 mb-3">
                {r.descripcion_corta}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs font-barlow text-text-muted">
              <span className="flex items-center gap-1">
                <Mountain size={12} strokeWidth={1.5} /> {r.distancia_km} km
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} strokeWidth={1.5} /> {formatDuracion(r.duracion_estimada_minutos)}
              </span>
              {r.apto_ninos && <span>👶</span>}
              {r.apto_perros && <span>🐕</span>}
            </div>
          </div>
          <div className="px-4 pb-4">
            <span className="inline-flex items-center gap-1 font-barlow text-sm font-medium text-primary group-hover:gap-2 transition-all duration-200">
              Ver ruta <ArrowRight size={13} strokeWidth={2} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
