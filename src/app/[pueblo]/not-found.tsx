import Link from "next/link";

export default function PuebloNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center py-20">
        <p
          className="font-barlow font-bold text-primary leading-none mb-4"
          style={{ fontSize: "clamp(64px, 8vw, 80px)" }}
        >
          404
        </p>
        <h1 className="font-fraunces text-2xl font-semibold text-text-body mb-3">
          Página no encontrada
        </h1>
        <p className="font-barlow text-base text-text-muted mb-8 max-w-sm mx-auto leading-relaxed">
          Esta dirección no existe en este pueblo o ha sido eliminada.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-barlow font-medium px-6 py-3 rounded-pill no-underline transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
