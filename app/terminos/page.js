import Link from 'next/link';
import { notFound } from 'next/navigation';
import LegalDocument, { legalMetadata } from '@/components/legal/LegalDocument';
import {
  BRAND, CANONICAL_ORIGIN, CONTACT_EMAIL,
  LEGAL_PAGES_REACHABLE, legalIdentityRows,
} from '@/lib/site';

export const metadata = legalMetadata({
  title: 'Términos y condiciones',
  description: `Términos y condiciones de uso de ${BRAND}: cómo se solicita, acepta, contrata y paga cada servicio para eventos.`,
  path: '/terminos',
});

// ─── QUÉ FALTA EN ESTE DOCUMENTO (y por qué no está escrito) ─────────────────
// Las siguientes secciones NO figuran abajo porque dependen de decisiones
// comerciales que todavía no se tomaron. No se escriben con un valor de relleno:
// un plazo o una penalidad inventados en un documento contractual son peores que
// su ausencia, porque serían exigibles.
//
//   · Cancelaciones — si hay política de plataforma o queda a criterio de cada
//     proveedor; plazos y penalidades.
//   · Reembolsos — en qué casos, plazo y medio. Además el mecanismo real bajo
//     Split Payments tiene incógnitas abiertas con el procesador (ver el
//     encabezado de la migración 024 del backend): no conviene prometer un
//     procedimiento que todavía no se sabe si la API permite.
//   · Derecho de retracto — plazo y excepciones aplicables a servicios con fecha
//     determinada bajo la normativa uruguaya de relaciones de consumo.
//   · Reprogramaciones — no existe funcionalidad hoy; no se promete.
//   · Contracargos y disputas — reparto de responsabilidad con el proveedor.
//   · Plazo para pagar después de que el proveedor acepta.
//   · Identificación fiscal y domicilio del titular — pendientes de confirmar.
//
// Todo el documento requiere además revisión de un abogado uruguayo antes de
// publicarse como vigente (ver LEGAL_DOCS_REVIEWED en lib/site.js).
export default function TerminosPage() {
  // FAIL-CLOSED. `noindex` nunca fue control de acceso: impedía que un buscador
  // indexara la página, pero cualquiera con la URL —y un revisor llega siguiendo
  // el footer— abría el borrador. En producción, con la compuerta cerrada, esta
  // ruta responde 404 y no existe ningún camino público al documento.
  // En desarrollo y en los tests sí se renderiza, con su aviso de borrador.
  if (!LEGAL_PAGES_REACHABLE) notFound();

  const identityRows = legalIdentityRows();

  return (
    <LegalDocument
      title="Términos y condiciones"
      updatedNote={`Versión de trabajo · ${BRAND}`}
      intro={`Estos términos regulan el uso de ${BRAND} y la contratación de servicios para eventos a través de la plataforma. Al crear una cuenta o enviar una solicitud de disponibilidad, aceptás lo que se describe acá.`}
    >
      <h2>1. Quién es el titular de la plataforma</h2>
      <p>
        {BRAND} es operado por las personas identificadas a continuación, con
        domicilio en Uruguay:
      </p>
      <ul>
        {identityRows.map((row) => (
          <li key={row.label}>
            <strong>{row.label}:</strong> {row.value}
          </li>
        ))}
      </ul>
      <p>
        El sitio oficial es <a href={CANONICAL_ORIGIN}>{CANONICAL_ORIGIN}</a> y el
        canal de contacto es <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. Qué es {BRAND} y qué no es</h2>
      <p>
        {BRAND} es un <strong>marketplace</strong>: un espacio donde proveedores
        independientes de servicios para eventos publican su oferta y donde los
        clientes pueden encontrarlos, consultarles disponibilidad y contratarlos.
      </p>
      <p>
        {BRAND} <strong>no presta los servicios</strong> que se publican. No hace
        catering, no toca música, no saca fotos ni decora salones. Cada servicio
        lo presta el proveedor que lo publicó, bajo su propia responsabilidad,
        con sus propios medios y su propio personal.
      </p>
      <p>
        En consecuencia, el contrato de prestación del servicio se celebra{' '}
        <strong>entre el cliente y el proveedor</strong>. {BRAND} actúa como
        intermediario que facilita el contacto, la gestión de la reserva y el
        cobro.
      </p>

      <h2>3. Roles</h2>
      <ul>
        <li>
          <strong>Cliente:</strong> quien busca y contrata un servicio para su
          evento.
        </li>
        <li>
          <strong>Proveedor:</strong> la persona o empresa independiente que
          ofrece y presta el servicio.
        </li>
        <li>
          <strong>{BRAND}:</strong> quien opera la plataforma, da de alta a los
          proveedores, publica la oferta y gestiona el proceso de reserva y cobro.
        </li>
      </ul>

      <h2>4. Cuentas de usuario</h2>
      <p>
        Para enviar una solicitud hace falta una cuenta. Al registrarte te
        comprometés a dar datos veraces y a mantenerlos actualizados, y sos
        responsable de la actividad que ocurra en tu cuenta y de resguardar tu
        contraseña.
      </p>
      <p>
        Los proveedores <strong>no se registran por sí solos</strong>: {BRAND} es
        un marketplace curado y el alta de cada proveedor la realiza y evalúa
        nuestro equipo. Si querés ofrecer tus servicios, escribinos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>5. Publicación de la oferta</h2>
      <p>
        Cada proveedor es responsable de la exactitud de lo que publica: la
        descripción del servicio, sus paquetes, lo que incluye y lo que no, las
        zonas donde trabaja, su capacidad y sus precios. {BRAND} revisa la oferta
        antes de publicarla, pero esa revisión no convierte a {BRAND} en garante
        de cada dato ni sustituye la responsabilidad del proveedor sobre su propia
        información.
      </p>
      <p>
        Si encontrás información que no se corresponde con la realidad,
        escribinos por el{' '}
        <Link href="/contacto">formulario de contacto</Link>.
      </p>

      <h2>6. Cómo se contrata un servicio</h2>
      <p>El proceso tiene siempre los mismos cuatro pasos, en este orden:</p>
      <ol>
        <li>
          <strong>Solicitud de disponibilidad.</strong> El cliente elige un
          servicio, indica la fecha, el lugar y los detalles de su evento, y envía
          la solicitud. Enviar una solicitud <strong>no reserva nada</strong> y no
          genera ningún cargo.
        </li>
        <li>
          <strong>Respuesta del proveedor.</strong> El proveedor confirma o
          rechaza la disponibilidad para esa fecha. Puede rechazarla por estar
          ocupado, por quedar fuera de su zona de cobertura, por capacidad o por
          cualquier otro motivo propio de su operación. Un rechazo no genera
          ningún cargo ni derecho a compensación.
        </li>
        <li>
          <strong>Reserva pendiente de pago.</strong> Si el proveedor confirma la
          disponibilidad, la reserva queda pendiente de pago y el cliente puede
          abonarla desde su panel.
        </li>
        <li>
          <strong>Confirmación.</strong> La reserva queda{' '}
          <strong>definitivamente confirmada cuando el pago se acredita</strong>.
          Hasta ese momento la disponibilidad no está asegurada: una fecha
          confirmada por el proveedor pero no pagada puede dejar de estar
          disponible.
        </li>
      </ol>

      <h2>7. Servicios con presupuesto personalizado</h2>
      <p>
        Algunos servicios no se publican con un precio cerrado porque su costo
        depende del evento concreto: cantidad de invitados, duración, ubicación,
        requerimientos particulares. En esos casos la plataforma muestra que el
        precio es <strong>a consultar</strong> y no es posible reservar en línea
        de forma automática.
      </p>
      <p>
        Para esos servicios, el proveedor elabora una cotización para tu evento.
        Una cotización es una propuesta: no es una reserva y no compromete
        disponibilidad hasta que se convierta en una reserva por el proceso del
        punto 6 y se abone.
      </p>

      <h2>8. Precios y forma de pago</h2>
      <ul>
        <li>
          <strong>Los precios se expresan en pesos uruguayos.</strong>
        </li>
        <li>
          <strong>El precio que ve el cliente es el total del servicio.</strong>{' '}
          {BRAND} no agrega cargos por sobre el importe que figura en la reserva.
        </li>
        <li>
          <strong>Se paga una reserva por proveedor.</strong> Si contratás varios
          servicios para un mismo evento, cada uno es una reserva independiente,
          con su propio proveedor y su propio pago.
        </li>
        <li>
          <strong>Se abona el total del servicio</strong>, no una parte. No se
          coordinan pagos por fuera de la plataforma.
        </li>
        <li>
          <strong>La comisión de {BRAND} la asume el proveedor</strong>, se
          descuenta del importe que él percibe y no se le cobra al cliente ni se
          suma al precio publicado.
        </li>
      </ul>
      <p>
        El pago se realiza a través del medio de pago habilitado en la plataforma
        en el momento de la contratación. Los datos de la tarjeta se ingresan
        directamente en el procesador de pagos:{' '}
        <strong>{BRAND} no recibe ni almacena datos de tarjetas</strong>.
      </p>

      <h2>9. Obligaciones del cliente</h2>
      <ul>
        <li>Dar información veraz sobre el evento: fecha, lugar, cantidad de personas y requerimientos.</li>
        <li>Garantizar las condiciones necesarias para que el proveedor pueda prestar el servicio: acceso al lugar, espacio, instalaciones y permisos que correspondan.</li>
        <li>Abonar el servicio contratado por los medios habilitados en la plataforma.</li>
        <li>Tratar al proveedor y a su personal con respeto.</li>
      </ul>

      <h2>10. Obligaciones del proveedor</h2>
      <ul>
        <li>Mantener su oferta, precios y disponibilidad actualizados y veraces.</li>
        <li>Responder las solicitudes de disponibilidad en un plazo razonable.</li>
        <li>Prestar el servicio contratado en las condiciones publicadas y acordadas.</li>
        <li>Contar con las habilitaciones, seguros y requisitos legales que su actividad exija.</li>
        <li>Responder por la calidad, la seguridad y la ejecución material del servicio.</li>
      </ul>

      <h2>11. Responsabilidad por la ejecución del evento</h2>
      <p>
        La ejecución material del servicio es responsabilidad exclusiva del
        proveedor. {BRAND} no responde por la calidad del servicio prestado, por
        el incumplimiento del proveedor, ni por daños o perjuicios derivados de la
        prestación.
      </p>
      <p>
        Esto no limita los derechos que la normativa uruguaya de defensa del
        consumidor te reconozca frente a quien corresponda, ni la responsabilidad
        de {BRAND} por el funcionamiento de la propia plataforma y por la gestión
        del cobro.
      </p>
      <p>
        Si un proveedor no cumple, escribinos: intervenimos para mediar y tomamos
        medidas sobre su cuenta en la plataforma cuando corresponde.
      </p>

      <h2>12. Contenido y conducta</h2>
      <p>
        Las reseñas y los mensajes que publiques deben referirse a tu experiencia
        real. No se admiten contenidos falsos, ofensivos, discriminatorios, ni que
        infrinjan derechos de terceros. {BRAND} puede moderar o dar de baja
        contenido que incumpla esto.
      </p>

      <h2>13. Propiedad intelectual</h2>
      <p>
        La marca {BRAND}, el sitio, su diseño y su código son propiedad del
        titular indicado en el punto 1. Las imágenes, textos y materiales que cada
        proveedor sube siguen siendo suyos: al publicarlos, autoriza a {BRAND} a
        mostrarlos en la plataforma y a usarlos para promocionar su propia oferta
        dentro del sitio.
      </p>

      <h2>14. Suspensión de cuentas</h2>
      <p>
        {BRAND} puede suspender o dar de baja una cuenta que incumpla estos
        términos, use la plataforma de forma fraudulenta, publique información
        falsa o afecte a otros usuarios. Una suspensión no afecta las obligaciones
        ya asumidas sobre reservas pagadas.
      </p>

      <h2>15. Legislación y jurisdicción</h2>
      <p>
        Estos términos se rigen por la <strong>legislación de la República
        Oriental del Uruguay</strong>. Cualquier controversia se somete a los
        tribunales competentes de Montevideo, Uruguay, sin perjuicio de los
        derechos que la normativa de relaciones de consumo reconozca al
        consumidor.
      </p>

      <h2>16. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos términos escribinos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o usá el{' '}
        <Link href="/contacto">formulario de contacto</Link>.
      </p>

      <h2>17. Cambios y versiones</h2>
      <p>
        Podemos actualizar estos términos. Cuando lo hagamos, publicaremos la
        versión nueva en esta misma página indicando su fecha de vigencia. Los
        cambios rigen para las contrataciones posteriores a su publicación: una
        reserva ya confirmada se rige por los términos vigentes al momento de
        confirmarse.
      </p>
    </LegalDocument>
  );
}
