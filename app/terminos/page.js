import Link from 'next/link';
import { notFound } from 'next/navigation';
import { legalMetadata } from '@/components/legal/LegalDocument';
import LegalDraftLayout from '@/components/legal/LegalDraftLayout';
import PendingLegal from '@/components/legal/PendingLegal';
import {
  BRAND, CANONICAL_ORIGIN, CONTACT_EMAIL,
  LEGAL_PAGES_REACHABLE, legalIdentityRows,
} from '@/lib/site';
import { LEGAL_DOCS } from '@/lib/legalDocs';
import { COMMERCIAL, DEPOSIT_PAYMENT_HOURS } from '@/lib/providerTerms';

export const metadata = legalMetadata({
  title: 'Términos y condiciones',
  description: `Términos y condiciones de uso de ${BRAND}: cómo se solicita, acepta, reserva y paga cada servicio para eventos.`,
  path: '/terminos',
});

// ─── TÉRMINOS Y CONDICIONES GENERALES ────────────────────────────────────────
//
// Documento marco para clientes y proveedores. El detalle de cancelaciones y
// reembolsos vive en /terminos/cancelaciones y el de proveedores en
// /terminos/proveedores: acá solo se resume y se remite, para que cada regla
// esté escrita en un único lugar.
//
// Los números (seña, saldo, plazos) salen de lib/providerTerms.js.
// Las cláusulas abiertas van en <PendingLegal>: su texto propuesto se publica
// rotulado «En revisión legal»; la nota de qué falta decidir solo se ve en dev.

const SECTIONS = [
  { id: 'titular',          title: 'Titular de la plataforma' },
  { id: 'que-es',           title: `Qué es ${BRAND}` },
  { id: 'definiciones',     title: 'Definiciones' },
  { id: 'cuentas',          title: 'Cuentas' },
  { id: 'oferta',           title: 'Publicación de la oferta' },
  { id: 'contratacion',     title: 'Cómo se contrata' },
  { id: 'presupuestos',     title: 'Presupuestos personalizados' },
  { id: 'precios',          title: 'Precios, seña y saldo' },
  { id: 'pagos',            title: 'Medios de pago y cobro' },
  { id: 'cancelaciones',    title: 'Cancelaciones y reembolsos' },
  { id: 'cliente',          title: 'Obligaciones del cliente' },
  { id: 'proveedor',        title: 'Obligaciones del proveedor' },
  { id: 'responsabilidad',  title: 'Responsabilidad' },
  { id: 'conducta',         title: 'Reseñas y conducta' },
  { id: 'propiedad',        title: 'Propiedad intelectual' },
  { id: 'suspension',       title: 'Suspensión de cuentas' },
  { id: 'cambios',          title: 'Cambios y versiones' },
  { id: 'ley',              title: 'Ley aplicable y jurisdicción' },
  { id: 'contacto',         title: 'Contacto' },
];

const INTERNAL_NOTES = [
  'RUT y domicilio del titular (LEGAL_ENTITY en lib/site.js).',
  'Revisión de un abogado uruguayo de todo el documento.',
  'Validar el traslado al cliente del costo de procesamiento online y cómo se informa.',
  'Encuadre de Eventonow frente al consumidor (intermediario o parte de la cadena, Ley 17.250).',
  'Mecanismo de aceptación con registro de versión (no existe todavía).',
];

export default function TerminosPage() {
  // Se sirve publicada, como versión preliminar (LEGAL_PREVIEW_PUBLISHED) o
  // como borrador en dev/test. Si nada de eso aplica, 404: `noindex` nunca fue
  // control de acceso.
  if (!LEGAL_PAGES_REACHABLE) notFound();

  const identityRows = legalIdentityRows();
  const c = COMMERCIAL;
  const dueOptions = c.balanceDueOptionsDays.join(', ').replace(/, (\d+)$/, ' o $1');

  return (
    <LegalDraftLayout
      doc={LEGAL_DOCS.terminos}
      sections={SECTIONS}
      internalNotes={INTERNAL_NOTES}
      intro={`Estos términos regulan el uso de ${BRAND} y la contratación de servicios para eventos a través de la plataforma. Explican qué hace ${BRAND}, cómo funciona una reserva de principio a fin y qué derechos y obligaciones tiene cada parte.`}
    >
      {/* 1 */}
      <h2 id="titular">1. Titular de la plataforma</h2>
      <p>{BRAND} es operado por:</p>
      <ul>
        {identityRows.map((row) => (
          <li key={row.label}>
            <strong>{row.label}:</strong> {row.value}
          </li>
        ))}
      </ul>
      <p>
        Sitio oficial: <a href={CANONICAL_ORIGIN}>{CANONICAL_ORIGIN}</a>. Contacto:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      {/* 2 */}
      <h2 id="que-es">2. Qué es {BRAND}</h2>
      <p>
        {BRAND} es un <strong>marketplace</strong> donde proveedores independientes
        de servicios para eventos publican su oferta y donde los clientes pueden
        encontrarlos, consultarles disponibilidad, reservarlos y pagarlos.
      </p>
      <p>
        {BRAND} <strong>no presta los servicios publicados</strong>. Cada servicio lo
        presta el proveedor que lo ofrece, con sus propios medios y su propio
        personal. El contrato de prestación del servicio se celebra{' '}
        <strong>entre el cliente y el proveedor</strong>; {BRAND} opera la
        plataforma, gestiona la reserva y coordina el cobro.
      </p>

      {/* 3 */}
      <h2 id="definiciones">3. Definiciones</h2>
      <ul>
        <li><strong>Cliente:</strong> quien busca y contrata un servicio para su evento.</li>
        <li><strong>Proveedor:</strong> la persona o empresa independiente que ofrece y presta el servicio.</li>
        <li><strong>Solicitud:</strong> el pedido de disponibilidad que el cliente envía al proveedor para una fecha y un evento concretos.</li>
        <li><strong>Reserva:</strong> la contratación de un servicio que el proveedor aceptó. Queda confirmada cuando se paga la seña.</li>
        <li><strong>Seña:</strong> el pago inicial del {c.depositPercent} % del valor del servicio, que confirma la reserva.</li>
        <li><strong>Saldo:</strong> el {c.balancePercent} % restante, que se paga antes del evento.</li>
      </ul>

      {/* 4 */}
      <h2 id="cuentas">4. Cuentas</h2>
      <p>
        Para enviar una solicitud necesitás una cuenta. Te comprometés a dar datos
        veraces y mantenerlos actualizados, y sos responsable de lo que ocurra en tu
        cuenta y de resguardar tu contraseña. {BRAND} está dirigido a mayores de 18
        años.
      </p>
      <p>
        {BRAND} es un <strong>marketplace curado</strong>: los proveedores no se
        registran solos. Nuestro equipo evalúa y da de alta a cada uno, y su relación
        con la plataforma se rige además por las{' '}
        <Link href={LEGAL_DOCS.proveedores.href}>{LEGAL_DOCS.proveedores.title}</Link>.
        Si querés ofrecer tus servicios, escribinos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      {/* 5 */}
      <h2 id="oferta">5. Publicación de la oferta</h2>
      <p>
        Cada proveedor es responsable de la exactitud de lo que publica: descripción,
        paquetes, qué incluye y qué no, zonas de trabajo, capacidad y precios.{' '}
        {BRAND} revisa la oferta antes de publicarla, pero esa revisión no lo
        convierte en garante de cada dato ni reemplaza la responsabilidad del
        proveedor sobre su propia información.
      </p>
      <p>
        Si encontrás información que no se corresponde con la realidad, avisanos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      {/* 6 */}
      <h2 id="contratacion">6. Cómo se contrata un servicio</h2>
      <ol>
        <li>
          <strong>Solicitud.</strong> Elegís un servicio, indicás fecha, lugar y
          detalles del evento, y enviás la solicitud. <strong>Enviar una solicitud no
          reserva nada ni genera cargos.</strong>
        </li>
        <li>
          <strong>Respuesta del proveedor.</strong> El proveedor acepta o rechaza la
          solicitud. Puede rechazarla por disponibilidad, zona, capacidad u otro motivo
          de su operación. Un rechazo no genera cargos ni compensaciones.
        </li>
        <li>
          <strong>Pago de la seña.</strong> Si el proveedor acepta, tenés{' '}
          <strong>{DEPOSIT_PAYMENT_HOURS} horas</strong> para pagar la seña del{' '}
          {c.depositPercent} %. Si no la pagás en ese plazo, la solicitud vence y la
          fecha vuelve a quedar libre.
        </li>
        <li>
          <strong>Reserva confirmada.</strong> La reserva queda{' '}
          <strong>confirmada cuando se acredita la seña</strong>. Antes de eso, la fecha
          no está asegurada.
        </li>
        <li>
          <strong>Pago del saldo.</strong> El {c.balancePercent} % restante se paga
          por la plataforma antes del vencimiento que se te informa al reservar.
        </li>
      </ol>

      {/* 7 */}
      <h2 id="presupuestos">7. Presupuestos personalizados</h2>
      <p>
        Algunos servicios no tienen un precio cerrado porque dependen del evento
        concreto (invitados, duración, ubicación, requerimientos). En esos casos la
        plataforma indica que el precio es <strong>a consultar</strong> y el proveedor
        te prepara una cotización. Una cotización es una propuesta: no reserva la fecha
        hasta que se convierte en una reserva por el proceso del punto 6.
      </p>

      {/* 8 */}
      <h2 id="precios">8. Precios, seña y saldo</h2>
      <ul>
        <li><strong>Los precios se expresan en pesos uruguayos.</strong></li>
        <li>
          <strong>Seña del {c.depositPercent} %</strong> para confirmar y{' '}
          <strong>saldo del {c.balancePercent} %</strong> antes del evento.
        </li>
        <li>
          <strong>Vencimiento del saldo:</strong> lo define cada proveedor entre{' '}
          {dueOptions} días antes del evento ({c.balanceDueDefaultDays} días si no
          define otro). Lo ves <strong>antes de reservar</strong> y queda fijo para tu
          reserva aunque el proveedor lo cambie después.
        </li>
        <li>
          <strong>Si el saldo vence sin pagarse</strong>, la reserva no se cancela
          automáticamente: queda en revisión y nos comunicamos con vos y con el
          proveedor.
        </li>
        <li>
          <strong>Una reserva por proveedor.</strong> Si contratás varios servicios
          para un mismo evento, cada uno es una reserva independiente con su propio
          pago.
        </li>
        <li>
          <strong>Todo se paga dentro de la plataforma.</strong> No se coordinan pagos
          por fuera.
        </li>
      </ul>
      <PendingLegal note="Validar legal y contractualmente el traslado al cliente del costo de procesamiento online antes de aplicarlo.">
        <p>
          El pago online puede tener un cargo por procesamiento. Si corresponde, lo vas
          a ver detallado <strong>antes de pagar</strong>, junto con el precio total de
          la reserva. No se cobra ningún importe que no se te haya mostrado antes.
        </p>
      </PendingLegal>

      {/* 9 */}
      <h2 id="pagos">9. Medios de pago y cobro</h2>
      <p>
        Los pagos se procesan a través del procesador de pagos habilitado en la
        plataforma. Los datos de tu tarjeta se ingresan directamente en el procesador:{' '}
        <strong>{BRAND} no recibe ni almacena datos de tarjetas</strong>.
      </p>
      <p>
        En cada pago, el procesador acredita al proveedor su parte y a {BRAND} su
        comisión. <strong>La comisión de {BRAND} la paga el proveedor</strong>: se
        descuenta de lo que él cobra y no se suma al precio del servicio.
      </p>

      {/* 10 */}
      <h2 id="cancelaciones">10. Cancelaciones, reembolsos y arrepentimiento</h2>
      <p>
        Las reglas completas están en la{' '}
        <Link href={LEGAL_DOCS.cancelaciones.href}>{LEGAL_DOCS.cancelaciones.title}</Link>.
        En resumen:
      </p>
      <ul>
        <li>
          <strong>Derecho de arrepentimiento:</strong> como contratás a distancia, la
          ley te permite arrepentirte dentro del plazo legal sin dar explicaciones. Ese
          derecho prevalece sobre cualquier otra regla de cancelación.
        </li>
        <li>
          <strong>Si cancela el proveedor:</strong> te devolvemos todo lo que pagaste y
          te ayudamos a encontrar otra opción.
        </li>
        <li>
          <strong>Si cancelás vos:</strong> el reembolso depende de la anticipación con
          la que canceles.
        </li>
        <li>
          Los reembolsos los gestiona {BRAND}, que revisa cada caso con la información
          de la reserva.
        </li>
      </ul>

      {/* 11 */}
      <h2 id="cliente">11. Obligaciones del cliente</h2>
      <ul>
        <li>Dar información veraz sobre el evento: fecha, lugar, cantidad de personas y requerimientos.</li>
        <li>Garantizar las condiciones para que el proveedor pueda prestar el servicio: acceso, espacio, instalaciones y permisos.</li>
        <li>Pagar la seña y el saldo en los plazos indicados, por la plataforma.</li>
        <li>Tratar al proveedor y a su personal con respeto.</li>
      </ul>

      {/* 12 */}
      <h2 id="proveedor">12. Obligaciones del proveedor</h2>
      <ul>
        <li>Mantener su oferta, precios y disponibilidad actualizados y veraces.</li>
        <li>Responder las solicitudes en un plazo razonable.</li>
        <li>Prestar el servicio en las condiciones publicadas y acordadas, y respetar la fecha reservada.</li>
        <li>Contar con las habilitaciones, seguros y requisitos legales de su actividad.</li>
        <li>No cobrar al cliente por fuera de la plataforma.</li>
      </ul>
      <p>
        El detalle está en las{' '}
        <Link href={LEGAL_DOCS.proveedores.href}>{LEGAL_DOCS.proveedores.title}</Link>,
        incluidas las consecuencias de cancelar una reserva confirmada.
      </p>

      {/* 13 */}
      <h2 id="responsabilidad">13. Responsabilidad</h2>
      <p>
        La ejecución del servicio es responsabilidad del proveedor que lo presta.{' '}
        {BRAND} responde por el funcionamiento de la plataforma y por la gestión del
        cobro y de los reembolsos que le corresponden.
      </p>
      <p>
        Nada de estos términos limita los derechos que la normativa uruguaya de
        relaciones de consumo te reconoce. Si un proveedor no cumple, escribinos:
        intervenimos, gestionamos la devolución que corresponda y tomamos medidas sobre
        su cuenta.
      </p>

      {/* 14 */}
      <h2 id="conducta">14. Reseñas y conducta</h2>
      <p>
        Las reseñas y mensajes deben referirse a experiencias reales. No se admiten
        contenidos falsos, ofensivos, discriminatorios ni que infrinjan derechos de
        terceros. {BRAND} puede moderar o retirar contenido que incumpla estas reglas.
      </p>

      {/* 15 */}
      <h2 id="propiedad">15. Propiedad intelectual</h2>
      <p>
        La marca {BRAND}, el sitio, su diseño y su código pertenecen al titular
        indicado en el punto 1. Las imágenes y textos que sube cada proveedor siguen
        siendo suyos; al publicarlos autoriza a {BRAND} a mostrarlos en la plataforma y
        a usarlos para promocionar su oferta dentro del sitio.
      </p>

      {/* 16 */}
      <h2 id="suspension">16. Suspensión de cuentas</h2>
      <p>
        {BRAND} puede suspender o dar de baja una cuenta que incumpla estos términos,
        use la plataforma de forma fraudulenta, publique información falsa o perjudique
        a otros usuarios. Antes de una baja te informamos el motivo y podés presentar tu
        descargo. Una suspensión no afecta las obligaciones de reservas ya confirmadas.
      </p>

      {/* 17 */}
      <h2 id="cambios">17. Cambios y versiones</h2>
      <ul>
        <li>Cada versión tiene número y fecha de vigencia, y se publica en esta página.</li>
        <li>Te avisamos <strong>antes</strong> de que una versión nueva entre en vigencia y te pedimos que la aceptes. No tomamos tu silencio como aceptación.</li>
        <li>Cada reserva se rige por la versión vigente al momento de confirmarse.</li>
      </ul>

      {/* 18 */}
      <h2 id="ley">18. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por las leyes de la <strong>República Oriental del
        Uruguay</strong>. Las controversias se someten a los tribunales competentes de
        Uruguay, sin perjuicio de los derechos que la normativa de relaciones de consumo
        reconoce al consumidor.
      </p>

      {/* 19 */}
      <h2 id="contacto">19. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos términos escribinos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalDraftLayout>
  );
}
