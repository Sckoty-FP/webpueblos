import Link from "next/link";
import { Footprints, ArrowRight } from "lucide-react";

interface Props {
  puebloSlug: string;
  totalRutas: number;
}

export default function RutasBanner({ puebloSlug, totalRutas }: Props) {
  return (
    <Link
      href={`/${puebloSlug}/rutas`}
      className="group block bg-surface-dark text-white rounded-card-lg p-6 md:p-8 mt-12 hover:bg-black transition-colors duration-300"
    >
      <div className="flex items-center gap-5">
        <div className="shrink-0 w-14 h-14 rounded-pill bg-accent-warm/20 text-accent-warm flex items-center justify-center">
          <Footprints size={26} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-fraunces text-xl font-semibold text-white mb-1">
            ¿Querés explorar por tu cuenta?
          </h3>
          <p className="font-barlow text-sm text-white/65">
            {totalRutas} ruta{totalRutas > 1 ? "s" : ""} de senderismo y ciclismo te esperan.
          </p>
        </div>
        <ArrowRight
          size={20}
          strokeWidth={2}
          className="text-white transition-transform duration-300 group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}
