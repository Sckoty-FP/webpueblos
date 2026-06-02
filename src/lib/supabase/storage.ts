"use client";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "prestadores";

export async function uploadPortada(prestadorId: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${prestadorId}/portada.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error || !data) { console.error("[uploadPortada]", error); return null; }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function uploadGaleria(prestadorId: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${prestadorId}/galeria/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error || !data) { console.error("[uploadGaleria]", error); return null; }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function uploadMuroImage(userId: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("muro")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error || !data) { console.error("[uploadMuroImage]", error); return null; }

  const { data: urlData } = supabase.storage.from("muro").getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function uploadPlatoImagen(prestadorId: string, file: File): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${prestadorId}/platos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error || !data) { console.error("[uploadPlatoImagen]", error); return null; }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function deleteStorageFile(url: string): Promise<void> {
  const supabase = createClient();
  // Extract path after bucket name
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}
