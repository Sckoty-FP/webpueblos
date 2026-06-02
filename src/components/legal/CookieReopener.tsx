"use client";

export default function CookieReopener({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("pueblo:cookies:open"))}
      className={
        className ??
        "font-barlow text-sm text-white/65 hover:text-white transition-colors"
      }
    >
      {children ?? "Configurar cookies"}
    </button>
  );
}
