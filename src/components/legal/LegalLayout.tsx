import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";

interface Props {
  children: React.ReactNode;
  title: string;
  ultimaRevision: string;
  toc?: Array<{ id: string; label: string }>;
}

export default function LegalLayout({ children, title, ultimaRevision, toc }: Props) {
  return (
    <>
      <Nav variant="landing" />
      <main className="pt-14 min-h-screen bg-fog">
        {/* Hero compacto */}
        <section className="bg-white border-b border-divisor py-10 md:py-14">
          <div className="container-app">
            <Link
              href="/"
              className="font-barlow text-sm text-text-muted hover:text-text-body transition-colors no-underline"
            >
              ← Volver a inicio
            </Link>
            <h1 className="display-section text-text-body mt-3 mb-2">{title}</h1>
            <p className="font-barlow text-sm text-text-muted">
              Última revisión:{" "}
              <time dateTime={ultimaRevision}>
                {new Date(ultimaRevision).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </p>
          </div>
        </section>

        {/* Body */}
        <section className="py-10 md:py-14">
          <div className="container-app grid lg:grid-cols-[240px_1fr] gap-10 max-w-5xl">
            {toc && toc.length > 0 && (
              <aside className="hidden lg:block">
                <nav aria-label="Tabla de contenidos" className="sticky top-20">
                  <p className="font-fraunces font-semibold text-sm text-text-body mb-3 uppercase tracking-wider">
                    Contenido
                  </p>
                  <ul className="flex flex-col gap-1.5 border-l border-divisor pl-4">
                    {toc.map(item => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="font-barlow text-sm text-text-muted hover:text-primary no-underline"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}

            <article className="legal-prose">{children}</article>
          </div>
        </section>
      </main>
      <Footer variant="institutional" />
    </>
  );
}
