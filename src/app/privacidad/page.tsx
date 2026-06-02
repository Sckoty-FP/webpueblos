import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo PUEBLO trata tus datos personales — derechos RGPD, finalidades, conservación, transferencias.",
  alternates: { canonical: "/privacidad" },
};

const TOC = [
  { id: "responsable",   label: "1. Responsable" },
  { id: "datos",         label: "2. Datos que recogemos" },
  { id: "finalidades",   label: "3. Finalidades" },
  { id: "base-legal",    label: "4. Base legal" },
  { id: "destinatarios", label: "5. Destinatarios" },
  { id: "conservacion",  label: "6. Conservación" },
  { id: "derechos",      label: "7. Tus derechos" },
  { id: "decisiones",    label: "8. Decisiones automatizadas" },
  { id: "seguridad",     label: "9. Seguridad" },
  { id: "contacto",      label: "10. Contacto" },
];

export default function PrivacidadPage() {
  return (
    <LegalLayout title="Política de Privacidad" ultimaRevision="2026-05-27" toc={TOC}>
      <p>
        En PUEBLO nos tomamos muy en serio la privacidad de las personas que usan la plataforma.
        Este documento explica{" "}
        <strong>qué datos recogemos, para qué los usamos, con quién los compartimos</strong> y
        cómo puedes ejercer tus derechos sobre ellos.
      </p>
      <p>
        Esta política aplica a la web <strong>pueblo.app</strong>, sus subdominios y los servicios
        asociados.
      </p>

      <h2 id="responsable">1. Responsable del tratamiento</h2>
      <ul>
        <li>
          <strong>Denominación:</strong> [RAZÓN SOCIAL] — PLACEHOLDER, completar antes de
          producción.
        </li>
        <li>
          <strong>NIF / CIF:</strong> [NIF] — PLACEHOLDER.
        </li>
        <li>
          <strong>Domicilio:</strong> [DIRECCIÓN POSTAL] — PLACEHOLDER.
        </li>
        <li>
          <strong>Email de contacto:</strong>{" "}
          <a href="mailto:privacidad@pueblo.app">privacidad@pueblo.app</a>
        </li>
        <li>
          <strong>Delegado de Protección de Datos (DPD):</strong> [si aplica] — PLACEHOLDER.
        </li>
      </ul>

      <h2 id="datos">2. Datos personales que recogemos</h2>
      <p>
        Recogemos los siguientes datos, siempre que tú los facilitas o se generan al usar la
        plataforma:
      </p>
      <ul>
        <li>
          <strong>Datos de cuenta:</strong> email, nombre, contraseña cifrada, tipo de cuenta
          (usuario / prestador / repartidor).
        </li>
        <li>
          <strong>Datos de contacto:</strong> teléfono (opcional), dirección postal cuando haces
          un pedido de delivery.
        </li>
        <li>
          <strong>Datos de uso:</strong> reservas hechas, pedidos realizados, posts en el muro,
          inscripciones a free tours.
        </li>
        <li>
          <strong>Datos técnicos:</strong> dirección IP truncada, tipo de dispositivo, navegador,
          idioma, página visitada.
        </li>
        <li>
          <strong>Comunicaciones:</strong> mensajes que nos envías a través del formulario de
          contacto.
        </li>
        <li>
          <strong>Datos de pago:</strong> NO almacenamos datos de tarjeta. Las pasarelas (Stripe)
          los procesan directamente.
        </li>
      </ul>

      <h2 id="finalidades">3. Finalidades del tratamiento</h2>
      <p>Usamos tus datos para:</p>
      <ol>
        <li>Crear y gestionar tu cuenta.</li>
        <li>Procesar reservas, pedidos e inscripciones que solicitas.</li>
        <li>Mostrarte contenido relevante del pueblo que elegiste.</li>
        <li>Atender consultas que nos haces vía formulario.</li>
        <li>Cumplir con obligaciones legales (facturación, fiscales).</li>
        <li>
          Mejorar la plataforma con métricas agregadas (si nos das consentimiento de analíticas).
        </li>
        <li>Enviarte comunicaciones comerciales (solo si las aceptas expresamente).</li>
      </ol>

      <h2 id="base-legal">4. Base legal</h2>
      <ul>
        <li>
          <strong>Ejecución de contrato</strong> (Art. 6.1.b RGPD): para gestionar tu cuenta,
          reservas, pedidos.
        </li>
        <li>
          <strong>Consentimiento</strong> (Art. 6.1.a RGPD): para analíticas, marketing y
          comunicaciones comerciales.
        </li>
        <li>
          <strong>Obligación legal</strong> (Art. 6.1.c RGPD): para conservar facturas y datos
          fiscales.
        </li>
        <li>
          <strong>Interés legítimo</strong> (Art. 6.1.f RGPD): para prevenir fraude y mejorar la
          seguridad.
        </li>
      </ul>

      <h2 id="destinatarios">5. Destinatarios — con quién compartimos</h2>
      <p>Tus datos pueden ser compartidos con:</p>
      <ul>
        <li>
          <strong>Los negocios donde reservas o pides</strong> — solo los datos imprescindibles
          para cumplir el pedido (nombre, contacto, dirección si aplica).
        </li>
        <li>
          <strong>Proveedores tecnológicos</strong> que actúan como encargados de tratamiento:
          <ul>
            <li>Supabase (Irlanda, UE) — base de datos, autenticación, almacenamiento.</li>
            <li>Vercel (UE) — hosting.</li>
            <li>
              SendGrid (Estados Unidos) — emails transaccionales. Acogido al EU-US Data Privacy
              Framework.
            </li>
            <li>Stripe (Irlanda) — procesamiento de pagos.</li>
            <li>Cloudinary — CDN de imágenes.</li>
          </ul>
        </li>
        <li>
          <strong>Autoridades</strong>: cuando exista obligación legal.
        </li>
      </ul>
      <p>No vendemos datos a terceros. Nunca.</p>

      <h2 id="conservacion">6. Conservación</h2>
      <p>Mantenemos tus datos durante el tiempo necesario para cumplir las finalidades:</p>
      <ul>
        <li>
          <strong>Cuenta activa</strong>: mientras la mantengas abierta.
        </li>
        <li>
          <strong>Pedidos y facturas</strong>: 6 años (Ley de Sociedades, Código de Comercio).
        </li>
        <li>
          <strong>Comunicaciones de contacto</strong>: hasta 2 años desde la última interacción.
        </li>
        <li>
          <strong>Posts del muro</strong>: 24 horas (ciclo de vida del módulo).
        </li>
        <li>
          <strong>Logs técnicos</strong>: 90 días.
        </li>
      </ul>

      <h2 id="derechos">7. Tus derechos</h2>
      <p>Puedes ejercer en cualquier momento los siguientes derechos:</p>
      <ul>
        <li>
          <strong>Acceso:</strong> saber qué datos tenemos sobre ti.
        </li>
        <li>
          <strong>Rectificación:</strong> corregir datos inexactos.
        </li>
        <li>
          <strong>Supresión</strong> (&quot;derecho al olvido&quot;): borrar tus datos.
        </li>
        <li>
          <strong>Limitación:</strong> restringir el tratamiento en ciertos casos.
        </li>
        <li>
          <strong>Portabilidad:</strong> recibir tus datos en formato estructurado.
        </li>
        <li>
          <strong>Oposición:</strong> al tratamiento basado en interés legítimo.
        </li>
        <li>
          <strong>Retirar el consentimiento</strong> dado para analíticas o marketing — sin
          afectar la legalidad del tratamiento previo.
        </li>
      </ul>
      <p>
        Para ejercerlos, escríbenos a{" "}
        <a href="mailto:privacidad@pueblo.app">privacidad@pueblo.app</a> con copia de tu DNI o
        documento equivalente. También puedes presentar una reclamación ante la{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          Agencia Española de Protección de Datos
        </a>
        .
      </p>

      <h2 id="decisiones">8. Decisiones automatizadas</h2>
      <p>
        No tomamos decisiones automatizadas con efectos legales sobre ti. El orden de prestadores
        en los listados se calcula mediante un algoritmo de rotación pesada (peso por antigüedad y
        valoración), pero no afecta a tus derechos.
      </p>

      <h2 id="seguridad">9. Medidas de seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas apropiadas: cifrado en tránsito (TLS) y en
        reposo, control de acceso, políticas de mínimos privilegios, copias de seguridad cifradas,
        autenticación fuerte para personal interno.
      </p>

      <h2 id="contacto">10. Contacto</h2>
      <p>
        Para cualquier duda sobre privacidad, escríbenos a{" "}
        <a href="mailto:privacidad@pueblo.app">privacidad@pueblo.app</a>.
      </p>
    </LegalLayout>
  );
}
