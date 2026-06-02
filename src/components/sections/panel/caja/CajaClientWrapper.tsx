"use client";

import { useRouter } from "next/navigation";
import type { MovimientoCajaDB, ResumenCajaMes } from "@/types/caja";
import CajaView from "./CajaView";

interface Props {
  movimientos: MovimientoCajaDB[];
  resumen: ResumenCajaMes;
  year: number;
  month: number;
  onCrearMovimiento: (data: FormData) => Promise<void>;
}

export default function CajaClientWrapper({ movimientos, resumen, year, month, onCrearMovimiento }: Props) {
  const router = useRouter();

  function handleChangeMonth(y: number, m: number) {
    router.push(`/panel/caja?anyo=${y}&mes=${m}`);
  }

  return (
    <CajaView
      movimientos={movimientos}
      resumen={resumen}
      year={year}
      month={month}
      onCrearMovimiento={onCrearMovimiento}
      onChangeMonth={handleChangeMonth}
    />
  );
}
