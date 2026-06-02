import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import CookieReopener from "@/components/legal/CookieReopener";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Cookies y tecnologías similares utilizadas en PUEBLO. Cómo gestionarlas.",
  alternates: { canonical: "/cookies" },
};

const TOC = [
  { id: "que-son",    label: "1. Qué son las cookies" },
  { id: "que-usamos", label: "2. Qué cookies usamos" },
  { id: "gestion",    label: "3. Cómo gestionarlas" },
  { id: "browsers",   label: "4. Desde tu navegador" },
  { id: "cambios",    label: "5. Cambios" },
];

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de cookies" ultimaRevision="2026-05-27" toc={TOC}>
      <h2 id="que-son">1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos de texto que un sitio web guarda en tu dispositivo.
        Sirven para reconocerte en visitas sucesivas, recordar preferencias y medir cómo se usa el
        sitio. Algunas son necesarias para el funcionamiento básico; otras son opcionales y solo se
        activan si das consentimiento.
      </p>

      <h2 id="que-usamos">2. ¿Qué cookies usamos?</h2>

      <h3>2.1. Estrictamente necesarias (siempre activas)</h3>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Finalidad</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>sb-access-token</code>, <code>sb-refresh-token</code>
            </td>
            <td>Sesión autenticada (Supabase Auth)</td>
            <td>7 días / sesión</td>
          </tr>
          <tr>
            <td>
              <code>pueblo_cookies_consent_v1</code>
            </td>
            <td>Recordar tu decisión sobre cookies</td>
            <td>1 año</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2. Analíticas (requieren consentimiento)</h3>
      <p>
        Solo se activan si las aceptas. Recogen datos agregados de uso (páginas visitadas, tiempo,
        dispositivo). Actualmente no hay proveedores externos de analíticas en producción. Cuando
        los incorporemos, los listaremos aquí y verás un aviso renovado.
      </p>

      <h3>2.3. Marketing (requieren consentimiento)</h3>
      <p>
        Solo se activan si las aceptas. Permiten mostrarte publicidad relevante y medir su
        efectividad. Actualmente solo usamos banners propios sin tracking de terceros. Si en el
        futuro integramos redes publicitarias, las listaremos aquí.
      </p>

      <h2 id="gestion">3. Cómo gestionar tus preferencias</h2>
      <p>Puedes cambiar tu decisión en cualquier momento usando el botón siguiente:</p>
      <p>
        <CookieReopener className="inline-flex items-center gap-2 bg-primary text-white font-barlow font-medium text-sm rounded-full px-5 py-2.5 hover:bg-primary-hover transition-colors">
          Cambiar mis preferencias de cookies
        </CookieReopener>
      </p>

      <h2 id="browsers">4. Desde tu navegador</h2>
      <p>
        También puedes bloquear o eliminar cookies directamente desde la configuración de tu
        navegador:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/es/kb/Borrar%20cookies"
            target="_blank"
            rel="noopener noreferrer"
          >
            Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safari
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d"
            target="_blank"
            rel="noopener noreferrer"
          >
            Edge
          </a>
        </li>
      </ul>
      <p>
        Ten en cuenta que si bloqueas las cookies necesarias, partes del sitio podrían no funcionar
        (no podrás iniciar sesión).
      </p>

      <h2 id="cambios">5. Cambios en esta política</h2>
      <p>
        Si actualizamos las categorías de cookies o añadimos proveedores nuevos, te volveremos a
        pedir consentimiento (verás el banner otra vez).
      </p>
    </LegalLayout>
  );
}
