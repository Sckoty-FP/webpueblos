// web/src/components/ui/RotatingShowcase.tsx
// Wrapper visual para grids con rotación pesada. La rotación ocurre en server (queries).
// Usa grid variants HARDCODED para compatibilidad con Tailwind JIT/purge.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeader from "./SectionHeader";

const GRID_VARIANTS = {
  "2-3-4": "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5",
  "1-2-3": "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5",
  "2-2-3": "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5",
} as const;

type GridVariant = keyof typeof GRID_VARIANTS;

interface Props<T extends { id: string }> {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  variant?: "light" | "dark";
  gridVariant?: GridVariant;
  emptyState?: React.ReactNode;
}

export default function RotatingShowcase<T extends { id: string }>({
  eyebrow,
  title,
  subtitle,
  items,
  renderItem,
  viewAllHref,
  viewAllLabel = "Ver todos",
  variant = "light",
  gridVariant = "2-3-4",
  emptyState,
}: Props<T>) {
  const bgClass = variant === "dark" ? "bg-surface-dark" : "bg-fog";
  const gridClass = GRID_VARIANTS[gridVariant];

  return (
    <section className={`${bgClass} py-16 md:py-20`}>
      <div className="container-app">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          cta={viewAllHref ? { label: viewAllLabel, href: viewAllHref } : undefined}
          variant={variant}
        />
        {items.length === 0 ? (
          emptyState ?? null
        ) : (
          <>
            <div className={gridClass}>
              {items.map((item, i) => (
                <div key={item.id}>{renderItem(item, i)}</div>
              ))}
            </div>
            {viewAllHref && (
              <div className="flex justify-center mt-10 md:hidden">
                <Link
                  href={viewAllHref}
                  className={`inline-flex items-center gap-2 font-barlow font-medium text-sm px-5 py-2.5 rounded-pill no-underline transition-colors ${
                    variant === "dark"
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-white text-primary border border-divisor hover:bg-fog"
                  }`}
                >
                  {viewAllLabel}
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
