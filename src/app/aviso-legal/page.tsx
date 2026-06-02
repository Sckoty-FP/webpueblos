import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "Identificación legal del prestador del servicio PUEBLO conforme a LSSI-CE.",
  alternates: { canonical: "/aviso-legal" },
};

const TOC = [
  { id: "identidad", label: "1. Identidad del responsable" },
  { id: "objeto",    label: "2. Objeto" },
  { id: "propiedad", label: "3. Propiedad intelectual" },
  { id: "enlaces",   label: "4. Enlaces a terceros" },
  { id: "exclusion", label: "5. Exclusión de garantías" },
  { id: "ley",       label: "6. Ley aplicable" },
];

export default function AvisoLegalPage() {
  return (
    <LegalLayout title="Aviso legal" ultimaRevision="2026-05-27" toc={TOC}>
      <h2 id="identidad">1. Identidad del responsable</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la
        Información y Comercio Electrónico (LSSI-CE), se informa de los siguientes datos:
      </p>
      <ul>
        <li>
          <strong>Denominación social:</strong> [RAZÓN SOCIAL] — PLACEHOLDER.
        </li>
        <li>
          <strong>NIF / CIF:</strong> [NIF] — PLACEHOLDER.
        </li>
        <li>
          <strong>Domicilio social:</strong> [DIRECCIÓN] — PLACEHOLDER.
        </li>
        <li>
          <strong>Datos registrales:</strong> [REGISTRO MERCANTIL TOMO/FOLIO/HOJA] — PLACEHOLDER.
        </li>
        <li>
          <strong>Email:</strong> <a href="mailto:hola@pueblo.app">hola@pueblo.app</a>
        </li>
        <li>
          <strong>Sitio web:</strong> <a href="https://pueblo.app">pueblo.app</a>
        </li>
      </ul>

      <h2 id="objeto">2. Objeto</h2>
      <p>
        Este sitio web tiene por objeto presentar la plataforma PUEBLO y facilitar el acceso a sus
        servicios: consulta de negocios locales, reservas, pedidos, free tours, muro social y
        publicaciones de pueblos turísticos.
      </p>

      <h2 id="propiedad">3. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del sitio (textos, imágenes, código, marca, logo) son propiedad de
        [RAZÓN SOCIAL] o de sus respectivos titulares, y están protegidos por la normativa española
        e internacional sobre propiedad intelectual e industrial.
      </p>
      <p>No está permitida la reproducción total o parcial sin autorización expresa por escrito.</p>

      <h2 id="enlaces">4. Enlaces a sitios de terceros</h2>
      <p>
        La plataforma puede contener enlaces a sitios de terceros (negocios, redes sociales, mapas
        externos). No nos hacemos responsables del contenido ni de las políticas de privacidad de
        esos sitios.
      </p>

      <h2 id="exclusion">5. Exclusión de garantías</h2>
      <p>
        Aunque nos esforzamos por mantener la información actualizada, no podemos garantizar la
        ausencia total de errores, omisiones o interrupciones. Tampoco que el servidor esté libre
        de virus u otros elementos dañinos.
      </p>

      <h2 id="ley">6. Ley aplicable</h2>
      <p>
        El presente aviso legal se rige por la legislación española. Para la resolución de
        controversias serán competentes los Juzgados y Tribunales del domicilio del consumidor o,
        en su defecto, los del domicilio de la Empresa.
      </p>
    </LegalLayout>
  );
}
