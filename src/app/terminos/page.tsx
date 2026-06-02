import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso de la plataforma PUEBLO.",
  alternates: { canonical: "/terminos" },
};

const TOC = [
  { id: "objeto",          label: "1. Objeto" },
  { id: "aceptacion",      label: "2. Aceptación" },
  { id: "registro",        label: "3. Registro y cuenta" },
  { id: "uso",             label: "4. Uso aceptable" },
  { id: "contenido",       label: "5. Contenido publicado" },
  { id: "reservas",        label: "6. Reservas y pedidos" },
  { id: "premium",         label: "7. Suscripción Premium" },
  { id: "cancelacion",     label: "8. Cancelación" },
  { id: "responsabilidad", label: "9. Responsabilidad" },
  { id: "modificaciones",  label: "10. Modificaciones" },
  { id: "ley",             label: "11. Ley aplicable" },
];

export default function TerminosPage() {
  return (
    <LegalLayout title="Términos y condiciones" ultimaRevision="2026-05-27" toc={TOC}>
      <h2 id="objeto">1. Objeto</h2>
      <p>
        Estos términos regulan el uso de la plataforma PUEBLO, propiedad de{" "}
        <strong>[RAZÓN SOCIAL]</strong> (en adelante, <em>la Empresa</em>), accesible en{" "}
        <a href="https://pueblo.app">pueblo.app</a>.
      </p>
      <p>
        PUEBLO es una plataforma digital que conecta negocios de pueblos turísticos con turistas y
        vecinos. Ofrece carta digital, reservas online, delivery, free tours, muro social y
        servicios relacionados.
      </p>

      <h2 id="aceptacion">2. Aceptación</h2>
      <p>
        Al registrarte o usar la plataforma, declaras haber leído y aceptado estos términos. Si no
        estás de acuerdo, no uses el servicio.
      </p>

      <h2 id="registro">3. Registro y cuenta</h2>
      <ul>
        <li>Debes ser mayor de 14 años para crear una cuenta.</li>
        <li>Los datos que facilitas deben ser veraces y estar actualizados.</li>
        <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
        <li>Una cuenta es personal e intransferible.</li>
      </ul>

      <h2 id="uso">4. Uso aceptable</h2>
      <p>Al usar PUEBLO te comprometes a NO:</p>
      <ul>
        <li>Suplantar a otra persona o entidad.</li>
        <li>
          Publicar contenido ilegal, ofensivo, difamatorio, racista, discriminatorio o que vulnere
          derechos de terceros.
        </li>
        <li>
          Usar la plataforma para spam, scraping masivo, ingeniería inversa o ataques.
        </li>
        <li>Interferir con el funcionamiento de los servidores.</li>
        <li>Vender o transferir tu cuenta.</li>
      </ul>

      <h2 id="contenido">5. Contenido publicado por usuarios</h2>
      <p>
        Cuando publicas contenido (posts del muro, reseñas, fotos de pedidos), nos otorgas una
        licencia mundial, no exclusiva, gratuita y revocable para mostrarlo en la plataforma. Tú
        conservas la propiedad intelectual.
      </p>
      <p>
        Podemos retirar contenido que infrinja estos términos o la ley sin previo aviso.
      </p>

      <h2 id="reservas">6. Reservas y pedidos</h2>
      <p>
        Las reservas y pedidos se realizan directamente entre el cliente y el negocio. PUEBLO actúa
        como intermediario tecnológico y NO es parte del contrato de compraventa o servicio. Las
        reclamaciones por incumplimiento deben dirigirse al negocio.
      </p>
      <p>
        Para pedidos de delivery, el negocio es responsable de la calidad y entrega del producto.
        PUEBLO o el repartidor asociado garantizan únicamente el transporte en condiciones
        razonables.
      </p>

      <h2 id="premium">7. Suscripción Premium</h2>
      <p>
        Premium es una suscripción de pago opcional con beneficios extra. El precio vigente se
        publica en <a href="/premium">pueblo.app/premium</a>. La suscripción se renueva
        automáticamente cada mes hasta cancelación. Puedes cancelar en cualquier momento desde tu
        perfil — la cancelación es efectiva al final del período facturado.
      </p>

      <h2 id="cancelacion">8. Cancelación</h2>
      <p>
        Puedes cerrar tu cuenta cuando quieras desde el perfil. Conservaremos los datos necesarios
        por obligaciones legales (facturas) y los demás se eliminarán o anonimizarán.
      </p>

      <h2 id="responsabilidad">9. Limitación de responsabilidad</h2>
      <p>
        PUEBLO se ofrece &quot;tal cual&quot;. Hacemos esfuerzos razonables para mantener el
        servicio operativo y seguro, pero no garantizamos disponibilidad 100%, ausencia de errores
        o que satisfaga todas tus necesidades.
      </p>
      <p>
        En el máximo permitido por la ley, no nos responsabilizamos por daños indirectos, pérdida
        de oportunidad, lucro cesante o pérdida de datos. Nuestra responsabilidad máxima por
        reclamación se limita a las cuotas pagadas en los últimos 12 meses (si aplica) o a 50€.
      </p>

      <h2 id="modificaciones">10. Modificaciones</h2>
      <p>
        Podemos modificar estos términos. Te avisaremos por email o aviso en la plataforma con al
        menos 15 días de antelación. Si continúas usando el servicio tras los cambios, se entiende
        que los aceptas.
      </p>

      <h2 id="ley">11. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por la ley española. Cualquier controversia se someterá a los
        tribunales del domicilio del consumidor, o a los del domicilio de la Empresa si el usuario
        no tiene la consideración de consumidor.
      </p>
      <p>
        Para resolver disputas en línea, puedes acudir a la plataforma europea de Resolución de
        Litigios en Línea:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
        >
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>
    </LegalLayout>
  );
}
