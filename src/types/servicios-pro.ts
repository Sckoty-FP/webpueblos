export type PresupuestoEstado = 'borrador' | 'enviado' | 'aceptado' | 'rechazado' | 'expirado';

export interface LineaPresupuesto {
  descripcion: string;
  importe:     number;
}

export interface PresupuestoDB {
  id:                   string;
  numero:               string;
  prestador_id:         string;
  reserva_id:           string | null;

  cliente_nombre:       string;
  cliente_email:        string | null;
  cliente_telefono:     string | null;
  cliente_direccion:    string | null;

  descripcion:          string;
  lineas:               LineaPresupuesto[];
  importe_base:         number;
  iva_porcentaje:       number;
  importe_total:        number;

  estado:               PresupuestoEstado;
  valido_hasta:         string | null;
  notas:                string | null;
  pdf_url:              string | null;

  token_aceptacion:     string | null;
  token_expira:         string | null;
  es_solicitud_publica: boolean;

  created_at:           string;
  updated_at:           string;
}

export type MetodoCobro = 'efectivo' | 'tarjeta' | 'transferencia' | 'bizum' | 'otro';

export interface ParteTrabajoDB {
  id:                 string;
  numero:             string;
  prestador_id:       string;
  presupuesto_id:     string | null;
  reserva_id:         string | null;

  fecha_trabajo:      string;
  duracion_horas:     number | null;
  trabajo_realizado:  string;
  materiales:         string | null;
  importe_final:      number;

  cliente_firma_url:  string | null;
  fotos_urls:         string[];

  cobrado:            boolean;
  metodo_cobro:       MetodoCobro | null;

  registrado_por:     string | null;

  created_at:         string;
  updated_at:         string;
}

/** Parte enriquecido con datos del presupuesto de origen */
export interface ParteConPresupuesto extends ParteTrabajoDB {
  presupuesto: Pick<PresupuestoDB, 'numero' | 'cliente_nombre' | 'cliente_telefono' | 'cliente_email'> | null;
}
