import Link from "next/link";
import Image from "next/image";
import { Heart, Clock } from "lucide-react";
import type { MuroPostDB } from "@/types";

interface Props {
  puebloSlug: string;
  posts: MuroPostDB[];
}

function horasRestantes(created_at: string): number {
  const elapsed = (Date.now() - new Date(created_at).getTime()) / 3_600_000;
  return Math.max(0, Math.min(24, 24 - elapsed));
}

function minutosDesde(created_at: string): number {
  return Math.floor((Date.now() - new Date(created_at).getTime()) / 60_000);
}

export default function PreviewMuro({ puebloSlug, posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section id="muro" className="bg-fog py-16 md:py-20">
      <div className="container-app">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <p className="font-fraunces text-xs uppercase tracking-[0.18em] text-accent-warm">
                Muro comunitario · EN VIVO
              </p>
            </div>
            <h2 className="display-section text-text-body">
              Qué está pasando ahora.
            </h2>
          </div>
          <Link
            href={`/${puebloSlug}/muro`}
            className="font-barlow text-sm text-primary hover:underline no-underline whitespace-nowrap"
          >
            Ver muro completo →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {posts.slice(0, 4).map(post => {
            const horas = horasRestantes(post.created_at);
            const pct = (horas / 24) * 100;
            const barColor =
              horas <= 4 ? "#ef4444" : horas <= 8 ? "#f59e0b" : "#0070cc";
            const inicial =
              post.autor?.nombre?.[0]?.toUpperCase() ?? "?";
            const mins = minutosDesde(post.created_at);

            return (
              <Link
                key={post.id}
                href={`/${puebloSlug}/muro`}
                className="group block bg-white rounded-[14px] overflow-hidden border border-[#efefef] shadow-[0_2px_8px_rgba(0,0,0,0.04)] no-underline hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                <div className="relative aspect-square overflow-hidden">
                  {post.imagenes_urls?.[0] ? (
                    <Image
                      src={post.imagenes_urls[0]}
                      alt={post.contenido.slice(0, 50)}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 photo-hero" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/15">
                    <div
                      className="h-full transition-none"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                </div>

                <div className="px-3.5 pt-3 pb-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-[22px] h-[22px] rounded-full bg-fog flex items-center justify-center text-[10px] font-bold text-text-muted flex-shrink-0">
                        {inicial}
                      </div>
                      <span className="font-barlow text-[12px] font-semibold text-text-body truncate">
                        @{post.autor?.nombre ?? "anónimo"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted flex-shrink-0">
                      <Heart size={11} strokeWidth={2} />
                      <span className="font-barlow text-[12px] font-semibold">
                        {post.total_likes}
                      </span>
                    </div>
                  </div>

                  <p className="font-barlow text-[13px] text-text-muted leading-snug mb-1.5 line-clamp-2">
                    {post.contenido}
                  </p>

                  <div className="flex items-center justify-between">
                    <span
                      className="font-barlow text-[10px] font-semibold uppercase tracking-[0.3px]"
                      style={{ color: barColor }}
                    >
                      Expira en {Math.ceil(horas)}h
                    </span>
                    <span className="flex items-center gap-1 font-barlow text-[10px] text-[#bbb]">
                      <Clock size={10} strokeWidth={1.5} />
                      {mins}m
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
