export type RolPanel = 'propietario' | 'encargado';

export interface PrestadorStaffDB {
  id: string;
  prestador_id: string;
  usuario_id: string | null;
  email_invitado: string | null;
  nombre_invitado: string | null;
  token: string | null;
  expira_en: string | null;
  rol: 'encargado';
  activo: boolean;
  invitado_por: string | null;
  fecha_alta: string;
  fecha_baja: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  usuario?: { nombre: string; email: string } | null;
}
