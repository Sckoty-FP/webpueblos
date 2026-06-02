export interface ProfesionalDB {
  id:            string;
  prestador_id:  string;
  nombre:        string;
  apellidos:     string;
  foto_url:      string | null;
  especialidad:  string | null;
  bio:           string | null;
  color:         string;
  activo:        boolean;
  orden:         number;
  usuario_id:    string | null;
  created_at:    string;
}

export interface ServicioProfesionalDB {
  servicio_id:    string;
  profesional_id: string;
}

/** Profesional con sus servicios asignados (para el panel). */
export interface ProfesionalConServiciosDB extends ProfesionalDB {
  servicio_profesionales: Array<{
    servicios: { id: string; nombre: string; duracion_minutos: number; precio_desde: number | null };
  }>;
}

/** Profesional con stats de reservas del día (para vista calendario). */
export interface ProfesionalConCitasDB extends ProfesionalDB {
  citas_hoy: number;
}
