import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Nav variant="landing" />
      <main className="pt-14 min-h-screen bg-fog flex items-center justify-center px-4">
        <div className="text-center py-24">
          <p
            className="font-barlow font-bold text-primary leading-none mb-4"
            style={{ fontSize: "clamp(72px, 10vw, 96px)" }}
          >
            404
          </p>
          <h1 className="font-fraunces text-2xl md:text-3xl font-semibold text-text-body mb-3">
            Página no encontrada
          </h1>
          <p className="font-barlow text-base text-text-muted mb-8 max-w-sm mx-auto leading-relaxed">
            La dirección que buscas no existe o ha sido eliminada.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-barlow font-medium px-6 py-3 rounded-pill no-underline transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
