import Link from 'next/link';
import { notFound } from 'next/navigation';
import { legalMetadata } from '@/components/legal/LegalDocument';
import LegalDraftLayout from '@/components/legal/LegalDraftLayout';
import PendingLegal from '@/components/legal/PendingLegal';
import {
  BRAND, CANONICAL_ORIGIN, CONTACT_EMAIL,
  LEGAL_PAGES_REACHABLE, legalIdentityRows,
} from '@/lib/site';
import { LEGAL_DOCS, docHref } from '@/lib/legalDocs';
import { COMMERCIAL, PAYMENT_HOURS } from '@/lib/providerTerms';

export const metadata = legalMetadata({
  title: 'Términos y condiciones',
  description: `Términos y condiciones de uso de ${BRAND}: cómo se solicita, acepta, reserva y paga cada servicio para eventos.`,
  path: '/terminos',
});

// ─── TÉRMINOS Y CONDICIONES GENERALES ────────────────────────────────────────
//
// Documento para CLIENTES. El detalle de cancelaciones y reembolsos vive en
// /terminos/cancelaciones: acá solo se resume y se remite. Los proveedores
// tienen su propio documento en el portal de proveedores (/provider/legal) y
// NO se enlaza desde acá: las áreas no se cruzan.
//
// Los números (plazo de pago y escalas) salen de lib/providerTerms.js.
// Las cláusulas abiertas van en <PendingLegal>: su texto propuesto se publica
// rotulado «En revisión legal»; la nota de qué falta decidir solo se ve en dev.

const SECTIONS = [
  { id: 'titular',          title: 'Titular de la plataforma' },
  { id: 'que-es',           title: `Qué es ${BRAND}` },
  { id: 'definiciones',     title: 'Definiciones' },
  { id: 'cuentas',          title: 'Cuentas' },
  { id: 'oferta',           title: 'Publicación de la oferta' },
  { id: 'contratacion',     title: 'Cómo funciona y cómo se contrata' },
  { id: 'presupuestos',     title: 'Presupuestos personalizados' },
  { id: 'precios',          title: 'Precios y forma de pago' },
  { id: 'pagos',            title: 'Medios de pago y cobro' },
  { id: 'cancelaciones',    title: 'Cancelaciones y reembolsos' },
  { id: 'cliente',          title: 'Obligaciones del cliente' },
  { id: 'proveedor',        title: 'Qué podés esperar del proveedor' },
  { id: 'responsabilidad',  title: 'Responsabilidad' },
  { id: 'conducta',         title: 'Reseñas y conducta' },
  { id: 'propiedad',        title: 'Propiedad intelectual' },
  { id: 'suspension',       title: 'Suspensión de cuentas' },
  { id: 'cambios',          title: 'Cambios y versiones' },
  { id: 'ley',              title: 'Ley aplicable y jurisdicción' },
  { id: 'contacto',         title: 'Contacto' },
];

const INTERNAL_NOTES = [
  'Razón social y RUT del titular (LEGAL_ENTITY en lib/site.js).',
  'Presupuesto personalizado: el pedido de presupuesto dentro de la plataforma todavía no existe (quoteRequestEnabled en false en el backend). Hoy el proceso es por correo y la reserva por el importe cotizado la tiene que poder registrar el equipo: confirmar que eso es operable antes de recibir el primer pedido.',
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

  return (
    <LegalDraftLayout
      doc={LEGAL_DOCS.terminos}
      space="cliente"
      sections={SECTIONS}
      internalNotes={INTERNAL_NOTES}
      intro={`Estos términos regulan el uso de ${BRAND} por parte de los clientes y la contratación de servicios para eventos a través de la plataforma. Explican qué hace ${BRAND}, cómo funciona una reserva de principio a fin y cuáles son tus derechos y obligaciones.`}
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
        <li><strong>Reserva:</strong> la contratación de un servicio que el proveedor aceptó. Queda confirmada cuando se paga.</li>
        <li><strong>Pago:</strong> el pago único del total del servicio, por la plataforma, que confirma la reserva. Con tarjeta de crédito puede hacerse en cuotas.</li>
        <li><strong>Presupuesto personalizado:</strong> la cotización que arma el proveedor para un servicio que no tiene precio cerrado.</li>
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
        con la plataforma se rige por condiciones propias.
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
      <h2 id="contratacion">6. Cómo funciona y cómo se contrata un servicio</h2>
      <p>
        Cada servicio se contrata por separado y con su propio proveedor. Si para tu
        evento necesitás catering, música y fotografía, son tres reservas
        independientes. El recorrido de cada una es siempre el mismo:
      </p>
      <ol>
        <li>
          <strong>Elegís el servicio.</strong> En la ficha de cada proveedor ves qué
          ofrece, qué incluye cada paquete, en qué zonas trabaja y el precio. Según el
          servicio, el precio puede ser por persona, por paquete, por unidad o por
          hora; la plataforma te calcula el total antes de enviar nada.
        </li>
        <li>
          <strong>Enviás una solicitud.</strong> Indicás fecha, lugar, cantidad de
          invitados y los detalles del evento. <strong>Enviar una solicitud no reserva
          la fecha ni genera ningún cargo.</strong>
        </li>
        <li>
          <strong>El proveedor acepta o rechaza.</strong> Revisa su disponibilidad y
          las condiciones del evento. Puede rechazar por agenda, zona, capacidad u otro
          motivo de su operación. Un rechazo no genera cargos ni compensaciones.
        </li>
        <li>
          <strong>Pagás el total.</strong> Si el proveedor acepta, tenés{' '}
          <strong>{PAYMENT_HOURS} horas</strong> para pagar el total de la reserva en
          un único pago dentro de {BRAND}. Con tarjeta de crédito podés elegir pagarlo
          en cuotas. Si no pagás en ese plazo, la solicitud vence sola, la fecha
          vuelve a quedar libre y no se te cobra nada.
        </li>
        <li>
          <strong>La reserva queda confirmada.</strong> Se confirma cuando el pago se
          acredita; antes de eso la fecha no está asegurada. Desde tu cuenta ves el
          estado de cada reserva y de su pago.
        </li>
        <li>
          <strong>El proveedor presta el servicio.</strong> El día del evento el
          proveedor presta el servicio en las condiciones publicadas y acordadas. Si
          algo no se cumple, nos escribís y gestionamos el reclamo (punto 13).
        </li>
      </ol>
      <p>
        Una vez confirmada, podés cancelar la reserva como máximo hasta{' '}
        <strong>{COMMERCIAL.clientCancellationMinDays} días antes del evento</strong>,
        con el reembolso que indica la política de cancelaciones (punto 10).
      </p>

      {/* 7 */}
      <h2 id="presupuestos">7. Servicios con presupuesto personalizado</h2>
      <p>
        Algunos servicios no tienen un precio cerrado porque dependen del evento
        concreto: cantidad de invitados, duración, ubicación, montaje o
        requerimientos especiales. En esos casos la ficha del servicio dice{' '}
        <strong>«Presupuesto personalizado»</strong> en lugar de un precio, y ese
        paquete no se puede reservar directamente. El proceso es este:
      </p>
      <ol>
        <li>
          Nos escribís a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> con el
          servicio que te interesa, la fecha, el lugar, la cantidad de invitados y lo
          que necesitás.
        </li>
        <li>
          Le pasamos el pedido al proveedor, que prepara un presupuesto por escrito con
          qué incluye, qué no incluye y el <strong>precio total en pesos
          uruguayos</strong>.
        </li>
        <li>
          Te enviamos el presupuesto. Es una propuesta: no te obliga a nada y no
          reserva la fecha.
        </li>
        <li>
          Si lo aceptás, la reserva se registra en {BRAND} por el importe del
          presupuesto y desde ahí sigue el mismo camino que cualquier otra:{' '}
          <strong>pago único del total dentro de la plataforma</strong> (en cuotas si
          lo elegís con tarjeta de crédito), confirmación al acreditarse el pago y las
          mismas reglas de cancelación y reembolso.
        </li>
      </ol>
      <p>
        Un presupuesto personalizado nunca se paga por fuera de {BRAND}. Si un
        proveedor te pide pagarle directamente, avisanos.
      </p>

      {/* 8 */}
      <h2 id="precios">8. Precios y forma de pago</h2>
      <ul>
        <li><strong>Los precios se expresan en pesos uruguayos.</strong></li>
        <li>
          <strong>Pago único:</strong> pagás el total de la reserva de una sola vez,
          dentro de las {PAYMENT_HOURS} horas desde que el proveedor la acepta. No hay
          pagos parciales ni importes que queden pendientes para más adelante.
        </li>
        <li>
          <strong>Cuotas:</strong> con tarjeta de crédito podés elegir pagar en cuotas
          al momento de pagar, según lo que ofrezcan tu tarjeta y el procesador de
          pagos. Con cuotas o sin ellas, la reserva queda paga por el total.
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
      <PendingLegal inForce={LEGAL_DOCS.terminos.status === 'published'} note="Validar legal y contractualmente el traslado al cliente del costo de procesamiento online antes de aplicarlo. Confirmar con el procesador qué cuotas ofrece en Uruguay y quién asume el recargo (SBX-11 del backend) antes de describirlas con más detalle.">
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
        <Link href={docHref('cancelaciones', 'cliente')}>{LEGAL_DOCS.cancelaciones.title}</Link>.
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
          <strong>Si cancelás vos:</strong> podés hacerlo como máximo hasta{' '}
          {COMMERCIAL.clientCancellationMinDays} días antes del evento, y el reembolso
          depende de la anticipación con la que canceles. Con menos anticipación la
          reserva ya no se puede cancelar.
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
        <li>Pagar la reserva en el plazo indicado, por la plataforma.</li>
        <li>Tratar al proveedor y a su personal con respeto.</li>
      </ul>

      {/* 12 */}
      <h2 id="proveedor">12. Qué podés esperar del proveedor</h2>
      <p>Cada proveedor se compromete con {BRAND} a:</p>
      <ul>
        <li>Mantener su oferta, precios y disponibilidad actualizados y veraces.</li>
        <li>Responder las solicitudes en un plazo razonable.</li>
        <li>Prestar el servicio en las condiciones publicadas y acordadas, y respetar la fecha reservada.</li>
        <li>Contar con las habilitaciones, seguros y requisitos legales de su actividad.</li>
        <li>No cobrar al cliente por fuera de la plataforma.</li>
      </ul>
      <p>
        Si un proveedor cancela una reserva confirmada, te devolvemos todo lo que
        pagaste y {BRAND} aplica sobre su cuenta las medidas que correspondan.
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
