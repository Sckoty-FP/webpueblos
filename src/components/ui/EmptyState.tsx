// web/src/components/ui/EmptyState.tsx
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    variant?: "primary" | "secondary";
  };
  bordered?: boolean;
  variant?: "light" | "dark";
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bordered = true,
  variant = "light",
}: Props) {
  const isDark = variant === "dark";
  const wrapperClass = bordered
    ? isDark
      ? "bg-surface-dark/50 border border-white/10 rounded-card-lg"
      : "bg-white border border-divisor rounded-card-lg"
    : "";

  return (
    <div className={`${wrapperClass} px-6 py-12 text-center`}>
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isDark ? "bg-white/10" : "bg-fog"
        }`}
      >
        <Icon
          size={24}
          strokeWidth={1.5}
          className={isDark ? "text-white/70" : "text-text-muted"}
        />
      </div>
      <p
        className={`font-fraunces font-semibold text-xl mb-2 ${
          isDark ? "text-white" : "text-text-body"
        }`}
      >
        {title}
      </p>
      {description && (
        <p
          className={`font-barlow text-sm max-w-md mx-auto ${
            isDark ? "text-white/65" : "text-text-muted"
          }`}
        >
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className={`inline-flex items-center gap-1.5 mt-5 font-barlow font-medium text-sm px-5 py-2.5 rounded-pill no-underline transition-colors ${
            action.variant === "secondary"
              ? "bg-white text-primary border border-divisor hover:bg-fog"
              : "bg-primary text-white hover:bg-primary-hover"
          }`}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
