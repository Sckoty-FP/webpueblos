import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPrestadorBySlug } from "@/lib/supabase/queries/prestadores";
import { getPuebloBySlug } from "@/lib/supabase/queries/pueblos";
import { getPlatosPublicos } from "@/lib/supabase/queries/carta";
import { getMesaById } from "@/lib/supabase/queries/mesas";
import type { PlatoDB } from "@/types/pedidos";
import { ALERGENOS_EU, CATEGORIAS_LABEL } from "@/types/carta";
import { formatCurrency } from "@/lib/format/currency";

interface Props {
  params: Promise<{ pueblo: string; slug: string }>;
  searchParams: Promise<{ mesa?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pueblo: slugParam, slug } = await params;
  const pueblo = await getPuebloBySlug(slugParam);
  const prestador = await getPrestadorBySlug(slug);
  if (!pueblo || !prestador) return { title: "Carta no encontrada" };
  return {
    title: `Carta — ${prestador.nombre} · ${pueblo.nombre}`,
    description: `Descubrí la carta de ${prestador.nombre} en ${pueblo.nombre}. Menú completo con precios, alérgenos y disponibilidad.`,
  };
}

// ─── Alérgeno icon ────────────────────────────────────────────────────────────

function AlergenoIcon({ code }: { code: string }) {
  const a = ALERGENOS_EU[code];
  if (!a) return null;
  return (
    <span
      title={a.label}
      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#fef3c7] text-[14px]"
    >
      {a.emoji}
    </span>
  );
}

// ─── Plato card ───────────────────────────────────────────────────────────────

function PlatoCard({ plato }: { plato: PlatoDB }) {
  return (
    <div className="flex gap-4 py-4 border-b border-[#f0f0f0] last:border-0">
      {/* Imagen */}
      {plato.imagen_url && (
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-barlow font-600 text-[15px] text-[#1f1f1f] leading-tight">{plato.nombre}</p>

            {/* Badges dietéticos */}
            <div className="flex gap-1 mt-0.5 flex-wrap">
              {plato.vegetariano && (
                <span className="text-[10px] font-barlow font-600 px-1.5 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46]">🌿 Vegetariano</span>
              )}
              {plato.vegano && (
                <span className="text-[10px] font-barlow font-600 px-1.5 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46]">🌱 Vegano</span>
              )}
              {plato.sin_gluten && (
                <span className="text-[10px] font-barlow font-600 px-1.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e]">🌾 Sin gluten</span>
              )}
              {(plato.picante ?? 0) > 0 && (
                <span className="text-[10px] font-barlow font-600 px-1.5 py-0.5 rounded-full bg-[#fee2e2] text-[#991b1b]">
                  {"🌶️".repeat(plato.picante ?? 0)}
                </span>
              )}
            </div>
          </div>

          {/* Precio */}
          <div className="text-right shrink-0">
            {plato.precio_oferta ? (
              <>
                <p className="font-barlow font-700 text-[15px] text-[#059669]">{formatCurrency(plato.precio_oferta)}</p>
                <p className="font-barlow text-[12px] text-[#888] line-through">{formatCurrency(plato.precio)}</p>
              </>
            ) : (
              <p className="font-barlow font-700 text-[15px] text-[#1f1f1f]">{formatCurrency(plato.precio)}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        {plato.descripcion && (
          <p className="font-barlow text-[13px] text-[#666] mt-1 leading-snug line-clamp-2">
            {plato.descripcion}
          </p>
        )}

        {/* Alérgenos */}
        {plato.alergenos.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {plato.alergenos.map((a) => <AlergenoIcon key={a} code={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CartaPublicaPage({ params, searchParams }: Props) {
  const { pueblo: slugParam, slug } = await params;
  const { mesa: mesaId } = await searchParams;

  const [pueblo, prestador] = await Promise.all([
    getPuebloBySlug(slugParam),
    getPrestadorBySlug(slug),
  ]);

  if (!pueblo || !prestador) notFound();

  const [platos, mesa] = await Promise.all([
    getPlatosPublicos(prestador.id),
    mesaId ? getMesaById(mesaId) : Promise.resolve(null),
  ]);

  // Agrupar por categoría
  const categorias = Array.from(new Set(platos.map((p) => p.categoria)));
  const platosPorCategoria: Record<string, PlatoDB[]> = {};
  categorias.forEach((cat) => {
    platosPorCategoria[cat] = platos.filter((p) => p.categoria === cat);
  });

  return (
    <div className="min-h-screen bg-[#fafaf8]">
        {/* Hero compacto */}
        <div style={{ background: "linear-gradient(180deg, #121314 0%, #000000 100%)" }} className="py-10">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-3">
              <a href={`/${slugParam}`} className="font-barlow text-sm text-white/40 no-underline hover:text-white/70 transition-colors">{pueblo.nombre}</a>
              <span className="text-white/25 text-sm">/</span>
              <a href={`/${slugParam}/servicios`} className="font-barlow text-sm text-white/40 no-underline hover:text-white/70 transition-colors">Restaurantes</a>
              <span className="text-white/25 text-sm">/</span>
              <span className="font-barlow text-sm text-white/70">{prestador.nombre}</span>
            </div>
            <h1 className="font-fraunces font-semibold text-white mb-1" style={{ fontSize: "clamp(24px, 5vw, 36px)" }}>
              {prestador.nombre}
            </h1>
            <p className="font-barlow text-white/50 text-[14px]">
              {platos.length} platos en carta
            </p>

            {/* Banner mesa */}
            {mesa && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                <span className="text-white/60 text-[13px] font-barlow">Mesa</span>
                <span className="font-fraunces font-semibold text-white text-[18px]">{mesa.numero}</span>
                {mesa.nombre && <span className="text-white/40 text-[12px] font-barlow">· {mesa.nombre}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Carta */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          {platos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🍽️</p>
              <p className="font-fraunces font-semibold text-[20px] text-[#1f1f1f] mb-2">Carta no disponible</p>
              <p className="font-barlow text-[14px] text-[#888]">Este restaurante todavía no ha publicado su carta.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {categorias.map((cat) => (
                <section key={cat}>
                  {/* Categoría header */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-fraunces font-semibold text-[20px] text-[#1f1f1f]">
                      {CATEGORIAS_LABEL[cat] ?? cat}
                    </h2>
                    <span className="font-barlow text-[12px] text-[#888] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
                      {platosPorCategoria[cat].length}
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl px-4 border border-[#f0f0f0]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    {platosPorCategoria[cat].map((plato) => (
                      <PlatoCard key={plato.id} plato={plato} />
                    ))}
                  </div>
                </section>
              ))}

              {/* Nota alérgenos */}
              <p className="font-barlow text-[11px] text-[#aaa] text-center pb-4">
                Informe de alérgenos disponible bajo petición. Los precios incluyen IVA.
              </p>
            </div>
          )}
        </div>
    </div>
  );
}
