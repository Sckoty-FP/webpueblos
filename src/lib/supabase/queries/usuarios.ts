import { createClient } from '@/lib/supabase/server';

export interface DireccionDefault {
  direccion: string;
  lat:       number;
  lon:       number;
}

export async function getDireccionDefault(
  userId: string,
): Promise<DireccionDefault | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('usuarios')
    .select('direccion_default, lat_default, lon_default')
    .eq('id', userId)
    .single();

  if (error || !data?.lat_default || !data?.lon_default || !data?.direccion_default) {
    return null;
  }

  return {
    direccion: data.direccion_default,
    lat:       data.lat_default,
    lon:       data.lon_default,
  };
}

// Solo guarda si el usuario no tiene dirección guardada aún (primer pedido).
export async function guardarDireccionDefault(
  userId:    string,
  direccion: string,
  lat:       number,
  lon:       number,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('usuarios')
    .update({ direccion_default: direccion, lat_default: lat, lon_default: lon })
    .eq('id', userId)
    .is('lat_default', null);
}
