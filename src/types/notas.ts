export interface NotaNegocioDB {
  id: string;
  prestador_id: string;
  autor_id: string;
  titulo: string;
  contenido: string;
  importante: boolean;
  recordatorio_fecha: string | null;
  recordatorio_completado: boolean;
  recordatorio_notificado_at: string | null;
  created_at: string;
  updated_at: string;
  autor?: { nombre: string } | null;
}
