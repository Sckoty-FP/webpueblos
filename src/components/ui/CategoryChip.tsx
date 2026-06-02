// web/src/components/ui/CategoryChip.tsx
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  icon?: LucideIcon;
  active?: boolean;
  variant?: "filled" | "outline" | "ghost";
  size?: "sm" | "md";
  onClick?: () => void;
  href?: string;
}

export default function CategoryChip({
  label,
  icon: Icon,
  active,
  variant = "outline",
  size = "md",
  onClick,
  href,
}: Props) {
  const sizeClasses =
    size === "sm" ? "text-xs px-2.5 py-1 gap-1" : "text-sm px-3.5 py-1.5 gap-1.5";

  const variantClasses = active
    ? "bg-primary text-white border-primary"
    : variant === "filled"
      ? "bg-fog text-text-body border-fog hover:bg-divisor"
      : variant === "ghost"
        ? "bg-transparent text-text-muted border-transparent hover:bg-fog"
        : "bg-white text-text-body border-divisor hover:border-text-body";

  const base = `inline-flex items-center font-barlow font-medium rounded-pill border transition-colors cursor-pointer no-underline whitespace-nowrap ${sizeClasses} ${variantClasses}`;

  const content = (
    <>
      {Icon && <Icon size={size === "sm" ? 11 : 13} strokeWidth={1.5} />}
      {label}
    </>
  );

  if (href) {
    return (
      <a href={href} className={base}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base}>
      {content}
    </button>
  );
}
