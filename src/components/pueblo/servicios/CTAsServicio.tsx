import Link from "next/link";
import { Calendar, FileText, Phone, MessageSquare } from "lucide-react";
import type { PrestadorDB } from "@/types";

interface Props {
  prestador: PrestadorDB;
  puebloSlug: string;
}

export default function CTAsServicio({ prestador, puebloSlug }: Props) {
  const cats = new Set(prestador.servicios?.map(s => s.categoria) ?? []);
  const esProfesional = cats.has("servicios_pro");
  const esReservable = prestador.servicios?.some(s => s.reservable) ?? false;

  return (
    <div className="sticky top-14 z-30 bg-white border-b border-divisor shadow-sm">
      <div className="container-app py-3 flex flex-wrap gap-2 md:gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {prestador.telefono && (
            <a
              href={`tel:${prestador.telefono}`}
              className="inline-flex items-center gap-2 bg-fog hover:bg-divisor text-text-body font-barlow text-sm px-4 py-2 rounded-pill transition-colors"
            >
              <Phone size={14} strokeWidth={1.5} /> Llamar
            </a>
          )}
          {prestador.whatsapp && (
            <a
              href={`https://wa.me/${prestador.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-fog hover:bg-divisor text-text-body font-barlow text-sm px-4 py-2 rounded-pill transition-colors"
            >
              <MessageSquare size={14} strokeWidth={1.5} /> WhatsApp
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {esProfesional && (
            <Link
              href={`/${puebloSlug}/profesionales/${prestador.slug}/presupuesto`}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-barlow font-medium text-sm px-5 py-2 rounded-pill transition-colors"
            >
              <FileText size={14} strokeWidth={1.5} /> Solicitar presupuesto
            </Link>
          )}
          {esReservable && !esProfesional && (
            <Link
              href={`/${puebloSlug}/servicios/${prestador.slug}/reservar`}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-barlow font-medium text-sm px-5 py-2 rounded-pill transition-colors"
            >
              <Calendar size={14} strokeWidth={1.5} /> Reservar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
