import Link from "next/link";
import Image from "next/image";
import type { PostMuroPropio } from "@/lib/supabase/queries/cuenta-usuario";

function horasRestantes(expiresAt: string): number {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 3_600_000));
}

export default function TabMisPosts({ posts }: { posts: PostMuroPropio[] }) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-card-lg border border-divisor px-6 py-10 text-center">
        <p className="font-fraunces text-[18px] font-semibold text-text-body mb-2">Sin posts vivos</p>
        <p className="font-barlow text-[14px] text-text-muted">
          Los posts del muro duran 24h. Postea desde la página del muro de tu pueblo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {posts.map(p => {
        const horas = horasRestantes(p.expires_at);
        return (
          <Link
            key={p.id}
            href={`/${p.pueblo_slug}/muro#post-${p.id}`}
            className="group relative aspect-square rounded-card overflow-hidden bg-black no-underline"
          >
            {p.imagenes_urls?.[0] ? (
              <Image
                src={p.imagenes_urls[0]}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-surface-dark to-black/80">
                <p className="font-fraunces text-sm text-white line-clamp-5 leading-snug">
                  {p.contenido}
                </p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 to-transparent">
              <div className="flex items-center justify-between text-white/90 text-[11px] font-barlow">
                <span>{horas}h</span>
                <span className="flex items-center gap-2">
                  <span>♥ {p.total_likes}</span>
                  <span>💬 {p.total_comentarios}</span>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
