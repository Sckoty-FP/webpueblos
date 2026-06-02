// web/src/components/ui/SectionHeader.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  variant?: "dark" | "light";
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  cta,
  variant = "light",
  align = "left",
  className = "mb-8 md:mb-10",
}: Props) {
  const isDark = variant === "dark";
  const isCenter = align === "center";

  return (
    <div
      className={`flex flex-col md:flex-row md:items-end ${isCenter ? "md:justify-center text-center" : "md:justify-between"} gap-4 ${className}`}
    >
      <div className={isCenter ? "max-w-2xl mx-auto" : "max-w-2xl"}>
        {eyebrow && (
          <p
            className={`font-fraunces text-xs font-medium uppercase tracking-[0.18em] mb-2 ${
              isDark ? "text-accent-warm" : "text-primary"
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`display-module leading-tight mb-2 ${
            isDark ? "text-white" : "text-text-body"
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`font-barlow text-base md:text-lg leading-relaxed ${
              isDark ? "text-white/70" : "text-text-muted"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {cta && (
        <Link
          href={cta.href}
          className={`inline-flex items-center gap-1.5 font-barlow font-medium text-sm whitespace-nowrap no-underline group transition-colors ${
            isDark
              ? "text-white hover:text-accent-warm"
              : "text-primary hover:text-primary-hover"
          }`}
        >
          {cta.label}
          <ArrowRight
            size={14}
            strokeWidth={2}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
