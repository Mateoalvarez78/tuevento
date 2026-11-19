import Link from 'next/link';
import { notFound } from 'next/navigation';
import LegalDraftLayout from '@/components/legal/LegalDraftLayout';
import PendingLegal from '@/components/legal/PendingLegal';
import { BRAND, CONTACT_EMAIL } from '@/lib/site';
import { LEGAL_DOCS } from '@/lib/legalDocs';
import {
  PROVIDER_TERMS_DOC,
  PROVIDER_TERMS_REACHABLE,
  COMMERCIAL,
  PENALTY_SCALE,
  RECIDIVISM_STEPS,
  DEPOSIT_PAYMENT_HOURS,
} from '@/lib/providerTerms';

// ─── CONDICIONES PARA PROVEEDORES ────────────────────────────────────────────
//
// Condiciones que rigen la relación entre Eventonow y cada proveedor. Reúne
// las decisiones comerciales de noviembre de 2026; lo que depende de una
// decisión abierta va en <PendingLegal> (texto propuesto rotulado «En revisión
// legal»; la nota de qué falta solo se ve en dev).
//
// Publicación: versión PRELIMINAR (LEGAL_PREVIEW_PUBLISHED, 19/11/2026), con
// aviso visible, noindex y fuera del sitemap. No se acepta en ningún flujo.
// La versión definitiva tiene su propia compuerta (PROVIDER_TERMS_PUBLISHED).
//
// Los números salen de lib/providerTerms.js, que no importa nada transaccional.

export const metadata = {
  title: 'Condiciones para proveedores',
  description: `Condiciones para proveedores de ${BRAND}: comisión, cobros, seña y saldo, cancelaciones, penalidades y procedimiento de revisión.`,
  alternates: { canonical: '/terminos/proveedores' },
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: 'registro',               title: 'Registro y verificación' },
  { id: 'relacion',               title: 'Relación con Eventonow' },
  { id: 'obligaciones',           title: 'Obligaciones en reservas aceptadas' },
  { id: 'comision',               title: 'Comisión comercial' },
  { id: 'cobros',                 title: 'Cobros y procesador de pagos' },
  { id: 'sena-saldo',             title: 'Seña, saldo y vencimientos' },
  { id: 'cancelaciones',          title: 'Si necesitás cancelar' },
  { id: 'revision-cancelaciones', title: 'Cancelación justificada o injustificada' },
  { id: 'penalizaciones',         title: 'Penalizaciones (propuesta)' },
  { id: 'pago-multas',            title: 'Plazo de pago y mora' },
  { id: 'suspensiones',           title: 'Suspensiones' },
  { id: 'reincidencias',          title: 'Reincidencias' },
  { id: 'rehabilitacion',         title: 'Rehabilitación y baja definitiva' },
  { id: 'devoluciones',           title: 'Devoluciones, contracargos y créditos' },
  { id: 'descargos',              title: 'Descargos y revisión' },
  { id: 'reclamos',               title: 'Reclamos y contacto' },
];

const INTERNAL_NOTES = [
  'Aprobación definitiva de la escala de penalizaciones y del régimen de reincidencias.',
  'Revisión de un abogado uruguayo (cláusula penal, intereses, cobro de deudas y compatibilidad con la normativa de consumo).',
  'Validación del traslado al cliente del costo de procesamiento online.',
  'Datos legales del titular (RUT y domicilio) y un canal formal de reclamos.',
  'Mecanismo de aceptación con registro de versión (todavía no existe).',
];

const pct = (n) => `${n} %`;

export default function CondicionesProveedoresPage() {
  if (!PROVIDER_TERMS_REACHABLE) notFound();

  const c = COMMERCIAL;
  const dueOptions = c.balanceDueOptionsDays.join(', ').replace(/, (\d+)$/, ' o $1');

  return (
    <LegalDraftLayout
      doc={PROVIDER_TERMS_DOC}
      sections={SECTIONS}
      internalNotes={INTERNAL_NOTES}
      intro={`Estas condiciones explican cómo trabajás con ${BRAND} como proveedor: qué te pedimos para publicar, cómo se cobra cada reserva, qué pasa si tenés que cancelar y cómo podés pedir que revisemos una decisión. Complementan los Términos y condiciones generales de la plataforma.`}
    >
      {/* ── Resumen ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="resumen" className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 id="resumen" className="!mt-0">En pocas palabras</h2>
        <ul>
          <li>{BRAND} cobra una comisión del <strong>{pct(c.commissionPercent)}</strong> del valor del servicio.</li>
          <li>El cliente paga una <strong>seña del {pct(c.depositPercent)}</strong> para confirmar y el <strong>saldo del {pct(c.balancePercent)}</strong> antes del evento, en el plazo que vos elijas.</li>
          <li>Podés publicar y recibir solicitudes sin conectar tu cuenta de cobro, pero <strong>no podés aceptar reservas</strong> hasta conectarla.</li>
          <li>Si tenés que cancelar una reserva aceptada, lo pedís y lo revisa nuestro equipo. Al cliente siempre se le devuelve lo que corresponda.</li>
          <li>Las penalizaciones por cancelaciones injustificadas son, por ahora, una <strong>propuesta pendiente de validación</strong>.</li>
        </ul>
      </section>

      {/* 1 ─────────────────────────────────────────────────────────────── */}
      <h2 id="registro">1. Registro y verificación</h2>
      <p>
        {BRAND} es un marketplace curado: <strong>el alta de cada proveedor la hace
        nuestro equipo</strong>, no hay registro automático. Para darte de alta te
        pedimos:
      </p>
      <ul>
        <li>Datos de la persona responsable: nombre, correo y teléfono.</li>
        <li>Datos del negocio: nombre comercial, razón social e identificación fiscal cuando corresponda, ciudad y zonas donde trabajás.</li>
        <li>La descripción de tus servicios, con precios, inclusiones y condiciones.</li>
        <li>Las habilitaciones, permisos o seguros que tu actividad exija.</li>
      </ul>
      <p>
        Revisamos esa información antes de publicar tu oferta. Podemos pedirte
        documentación adicional o rechazar un alta si la información no es veraz o
        el servicio no se ajusta a la plataforma. Te comprometés a mantener tus datos
        actualizados.
      </p>
      <PendingLegal note="Definir la lista cerrada de documentos exigibles por tipo de proveedor (persona física, empresa unipersonal, sociedad) y si la verificación de identidad del procesador de pagos sustituye alguno." />

      {/* 2 ─────────────────────────────────────────────────────────────── */}
      <h2 id="relacion">2. Relación con Eventonow</h2>
      <p>
        Sos un <strong>prestador independiente</strong>. {BRAND} no te contrata como
        empleado ni como agente, y no presta los servicios que publicás: el contrato
        de cada servicio se celebra entre vos y el cliente. {BRAND} opera la
        plataforma, gestiona las solicitudes y reservas, y coordina el cobro.
      </p>
      <p>
        Respondés por la ejecución del servicio, por tu personal y por el
        cumplimiento de tus obligaciones legales, laborales y tributarias. Además de
        estas condiciones, rigen para vos los{' '}
        <Link href={LEGAL_DOCS.terminos.href}>{LEGAL_DOCS.terminos.title}</Link>.
      </p>
      <PendingLegal note="El abogado debe confirmar el encuadre de Eventonow frente al cliente (intermediario o integrante de la cadena de proveedores bajo la Ley 17.250) y qué responsabilidad conserva aunque estas condiciones la asignen al proveedor." />

      {/* 3 ─────────────────────────────────────────────────────────────── */}
      <h2 id="obligaciones">3. Obligaciones en las reservas aceptadas</h2>
      <p>Cuando aceptás una solicitud, te comprometés a:</p>
      <ul>
        <li>Prestar el servicio en la fecha, el lugar y las condiciones publicadas y acordadas.</li>
        <li>Mantener esa fecha reservada: no podés comprometerla con otro cliente.</li>
        <li>Avisar de inmediato a {BRAND} cualquier hecho que ponga en riesgo la prestación.</li>
        <li>No cobrar al cliente por fuera de la plataforma ningún importe de la reserva.</li>
        <li>Tratar los datos del cliente solo para prestar el servicio.</li>
      </ul>
      <p>
        Las condiciones de cada reserva quedan fijadas al momento de aceptarla. Un
        cambio posterior en estas condiciones no modifica las reservas ya aceptadas.
      </p>

      {/* 4 ─────────────────────────────────────────────────────────────── */}
      <h2 id="comision">4. Comisión comercial</h2>
      <p>
        {BRAND} cobra una comisión del <strong>{pct(c.commissionPercent)} del valor del
        servicio</strong> de cada reserva cobrada. La comisión es la misma para todos los
        proveedores y se descuenta automáticamente de cada pago: recibís el importe
        neto.
      </p>
      <p>
        La comisión remunera el uso de la plataforma, la visibilidad de tu oferta, la
        gestión de reservas y la coordinación del cobro.
      </p>
      <PendingLegal note="Definir qué incluye «valor del servicio» (adicionales, horas extra, impuestos) y el tratamiento de la comisión cuando una reserva se devuelve total o parcialmente." />

      {/* 5 ─────────────────────────────────────────────────────────────── */}
      <h2 id="cobros">5. Cobros y procesador de pagos</h2>
      <p>
        Los pagos de los clientes se procesan a través del procesador de pagos de la
        plataforma, con un modelo de pago dividido: en cada cobro, el procesador
        separa la comisión de {BRAND} y acredita el resto en tu propia cuenta.
        {' '}<strong>{BRAND} no recibe tu parte ni la retiene.</strong>
      </p>
      <ul>
        <li>Para <strong>publicar servicios y recibir solicitudes</strong> no necesitás tener la cuenta conectada.</li>
        <li>Para <strong>aceptar reservas</strong> tenés que tener tu cuenta en el procesador aprobada y vinculada con {BRAND}.</li>
        <li>Recibís tus fondos según los plazos y liquidaciones normales del procesador, que no dependen de {BRAND}.</li>
        <li>Aceptás las condiciones del procesador para tu cuenta, incluida tu responsabilidad como vendedor frente a devoluciones y contracargos.</li>
      </ul>
      <PendingLegal note="Se pretende trasladar al cliente el costo del procesamiento online. Hoy los Términos generales dicen que la plataforma no agrega cargos al precio publicado: hay que decidir cómo se informa ese costo (precio final con todo incluido o cargo separado visible antes de pagar) y validarlo legal y contractualmente antes de aplicarlo." />

      {/* 6 ─────────────────────────────────────────────────────────────── */}
      <h2 id="sena-saldo">6. Seña, saldo y vencimientos</h2>
      <ol>
        <li>
          <strong>Seña del {pct(c.depositPercent)}.</strong> Cuando aceptás, el cliente
          tiene {DEPOSIT_PAYMENT_HOURS} horas para pagar la seña. La reserva queda
          confirmada cuando la seña se acredita; si no se paga, la solicitud vence y la
          fecha vuelve a quedar libre.
        </li>
        <li>
          <strong>Saldo del {pct(c.balancePercent)}.</strong> Se habilita cuando se
          confirma la seña y se paga también a través de la plataforma.
        </li>
        <li>
          <strong>Vencimiento del saldo.</strong> Elegís en tu configuración cuántos
          días antes del evento vence: <strong>{dueOptions} días</strong>. Si no elegís,
          se aplican <strong>{c.balanceDueDefaultDays} días</strong>.
        </li>
        <li>
          <strong>La configuración se congela en cada reserva.</strong> El plazo
          vigente al aceptar una reserva queda guardado en esa reserva. Si después lo
          cambiás, el cambio rige solo para las reservas nuevas.
        </li>
      </ol>
      <p>
        Si el saldo vence sin pagarse, la reserva <strong>no se cancela sola</strong>:
        queda en revisión de nuestro equipo, que se comunica con las partes.
      </p>
      <PendingLegal note="Definir: qué pasa si el evento está más cerca que el vencimiento elegido (ej. reserva aceptada 5 días antes con vencimiento a 7 días), y qué derechos tiene el proveedor cuando el cliente no paga el saldo." />

      {/* 7 ─────────────────────────────────────────────────────────────── */}
      <h2 id="cancelaciones">7. Si necesitás cancelar una reserva</h2>
      <p>
        Una reserva aceptada es un compromiso con el cliente. Si no podés cumplirla:
      </p>
      <ol>
        <li><strong>Avisá cuanto antes</strong> y presentá la cancelación a {BRAND} con el motivo y la documentación que la respalde.</li>
        <li>No canceles ni negocies la devolución directamente con el cliente: <strong>toda cancelación de un proveedor pasa por revisión administrativa</strong>.</li>
        <li>Mientras se revisa, seguí atendiendo las consultas del cliente sobre la reserva.</li>
      </ol>
      <p>
        Si la reserva no se presta por causa tuya, {BRAND} gestiona la devolución
        completa que corresponda al cliente. Como el pago se acredita en tu cuenta del
        procesador, la devolución se hace desde ahí y te corresponde afrontarla.
      </p>

      {/* 8 ─────────────────────────────────────────────────────────────── */}
      <h2 id="revision-cancelaciones">8. Cancelación justificada o injustificada</h2>
      <p>
        Nuestro equipo revisa cada cancelación y resuelve si es{' '}
        <strong>justificada</strong> o <strong>injustificada</strong>, con base en el
        motivo, la evidencia aportada y el historial de la reserva.
      </p>
      <ul>
        <li><strong>Justificada:</strong> no genera penalización ni cuenta como reincidencia. Al cliente se le devuelve lo que corresponda igual.</li>
        <li><strong>Injustificada:</strong> puede generar la penalización de la sección 9 y cuenta para las reincidencias de la sección 12.</li>
      </ul>
      <PendingLegal note="Falta la lista de causas que se consideran justificadas (por ejemplo: fuerza mayor, caso fortuito, enfermedad grave documentada, incumplimiento previo del cliente) y qué prueba se exige en cada caso. Debe ser objetiva y conocida de antemano." />

      {/* 9 ─────────────────────────────────────────────────────────────── */}
      <h2 id="penalizaciones">9. Penalizaciones contractuales (propuesta)</h2>
      <PendingLegal note="Escala comercial propuesta, todavía pendiente de aprobación definitiva y revisión jurídica. No se aplica a ninguna reserva mientras este documento sea un borrador.">
        <p className="mb-2">
          Una cancelación declarada injustificada podría generar una penalización sobre
          el valor del servicio de la reserva cancelada, según la anticipación con la que
          se presentó:
        </p>
      </PendingLegal>
      <div className="overflow-x-auto mb-4">
        <table>
          <caption className="text-left text-xs text-gray-500 mb-2">
            Anticipación = días corridos entre la fecha en que presentás la cancelación y la
            fecha del evento, contando fechas de Uruguay.
          </caption>
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th scope="col" className="py-2 pr-4 font-semibold text-gray-900">Anticipación</th>
              <th scope="col" className="py-2 font-semibold text-gray-900 text-right">Penalización</th>
            </tr>
          </thead>
          <tbody>
            {PENALTY_SCALE.map((t) => (
              <tr key={t.label} className="border-b border-gray-100">
                <td className="py-2 pr-4">{t.label}</td>
                <td className="py-2 text-right tabular-nums font-medium text-gray-900">{pct(t.percent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Cómo se cuentan los días</h3>
      <ul>
        <li>Se cuentan <strong>días corridos completos</strong>, no horas.</li>
        <li>Se toma la fecha en que <strong>presentás</strong> la cancelación, no la fecha en que la resolvemos: la demora de la revisión no te perjudica.</li>
        <li>Ejemplo: evento el 20 de marzo y cancelación presentada el 5 de marzo → 15 días → tramo de 15 a 30 días.</li>
      </ul>
      <PendingLegal note="Definir la base de cálculo (total de la reserva, con o sin adicionales e impuestos), el tratamiento de la no presentación el día del evento y si la penalización tiene un tope. El abogado debe evaluar la cláusula como cláusula penal (Código Civil, arts. 1363 y siguientes) y su proporcionalidad." />

      {/* 10 ────────────────────────────────────────────────────────────── */}
      <h2 id="pago-multas">10. Plazo de pago y consecuencias de la mora</h2>
      <p>
        Una penalización solo es exigible después de que la confirmamos y te la
        notificamos por escrito, con el detalle del cálculo. Desde la notificación
        tenés <strong>{c.finePaymentDays} días corridos</strong> para pagarla o
        presentar un descargo (sección 15).
      </p>
      <ul>
        <li>Si queda impaga y no hay una revisión pendiente, <strong>se suspende la recepción de nuevas reservas</strong> hasta que la regularices.</li>
        <li>Las reservas que ya tenías aceptadas se siguen gestionando normalmente.</li>
        <li>Cerrar tu cuenta no extingue una deuda exigible.</li>
        <li>{BRAND} puede evaluar, caso por caso, gestiones de cobro extrajudiciales o judiciales. <strong>Ningún reclamo judicial se inicia de forma automática.</strong></li>
      </ul>
      <PendingLegal note="Intereses moratorios: solo cuando correspondan legalmente. El abogado debe definir si se pactan, a qué tasa y con qué límites (Código Civil y Ley 18.212). Definir también el medio de pago de las penalizaciones, porque el procesador acredita los fondos directamente al proveedor y Eventonow no puede descontarlas de sus cobros." />

      {/* 11 ────────────────────────────────────────────────────────────── */}
      <h2 id="suspensiones">11. Suspensiones por incumplimiento</h2>
      <p>
        Durante una suspensión tu oferta deja de recibir reservas nuevas. Seguís
        teniendo acceso a tu cuenta y debés cumplir las reservas ya aceptadas, que se
        gestionan con normalidad.
      </p>
      <p>Una suspensión puede deberse a:</p>
      <ul>
        <li>Una penalización impaga sin revisión pendiente (sección 10).</li>
        <li>El régimen de reincidencias (sección 12).</li>
        <li>Incumplimientos graves de estas condiciones o de los Términos generales.</li>
      </ul>

      {/* 12 ────────────────────────────────────────────────────────────── */}
      <h2 id="reincidencias">12. Reincidencias</h2>
      <p>
        Se cuentan las cancelaciones declaradas injustificadas en los últimos{' '}
        <strong>{c.recidivismWindowMonths} meses</strong>, en ventana móvil:
      </p>
      <PendingLegal note="Régimen propuesto, pendiente de aprobación definitiva.">
        <ol className="list-decimal pl-5 space-y-1">
          {RECIDIVISM_STEPS.map((s) => (
            <li key={s.ordinal}><strong>{s.ordinal}:</strong> {s.consequence}</li>
          ))}
        </ol>
      </PendingLegal>

      {/* 13 ────────────────────────────────────────────────────────────── */}
      <h2 id="rehabilitacion">13. Rehabilitación y baja definitiva</h2>
      <p>
        Cumplido el plazo de una suspensión, la cuenta <strong>no se rehabilita
        sola</strong>: requiere aprobación de nuestro equipo, que verifica que no queden
        deudas exigibles ni revisiones abiertas.
      </p>
      <p>
        La baja definitiva se reserva para la cuarta reincidencia o para
        incumplimientos graves. Antes de resolverla te damos la oportunidad de
        presentar tu descargo. Una baja no afecta las reservas ya aceptadas: acordamos
        con vos y con cada cliente cómo se resuelven.
      </p>
      <PendingLegal note="Definir qué se considera incumplimiento grave y el procedimiento para resolver las reservas pendientes de un proveedor dado de baja." />

      {/* 14 ────────────────────────────────────────────────────────────── */}
      <h2 id="devoluciones">14. Devoluciones, contracargos y créditos</h2>
      <h3>Devoluciones</h3>
      <p>
        Por ahora, <strong>toda devolución requiere autorización de nuestro
        equipo</strong>, que decide con base en evidencia, el historial de la reserva y
        una resolución escrita. Esa revisión nunca puede impedir ni demorar los derechos
        que la ley reconoce al cliente, incluido el derecho de arrepentimiento en las
        contrataciones a distancia.
      </p>
      <h3>Contracargos</h3>
      <p>
        {BRAND} coordina y supervisa los contracargos: te avisamos, te pedimos la
        evidencia de la prestación y presentamos la respuesta. Respondés económicamente
        cuando corresponda legal y contractualmente.
      </p>
      <h3>Créditos compensatorios al cliente</h3>
      <p>
        Cuando un proveedor cancela, {BRAND} puede decidir ofrecer al cliente un crédito
        para contratar otro proveedor. Ese crédito:
      </p>
      <ul>
        <li>Lo <strong>financia íntegramente {BRAND}</strong>. No se descuenta de tu cobro.</li>
        <li>Si lo usan para contratarte a vos como reemplazo, <strong>cobrás tu precio completo</strong>.</li>
        <li>No es automático ni depende de que la penalización del proveedor que canceló esté cobrada.</li>
      </ul>
      <p>
        Las condiciones del crédito para el cliente están en la{' '}
        <Link href={LEGAL_DOCS.cancelaciones.href}>{LEGAL_DOCS.cancelaciones.title}</Link>.
      </p>

      {/* 15 ────────────────────────────────────────────────────────────── */}
      <h2 id="descargos">15. Descargos y revisión</h2>
      <p>Antes de aplicar una penalización, una suspensión o una baja:</p>
      <ol>
        <li>Te notificamos por escrito el hecho, la medida propuesta y la evidencia considerada.</li>
        <li>Podés presentar tu descargo, con la documentación que quieras aportar.</li>
        <li>Resolvemos por escrito y con fundamento, y conservamos el expediente.</li>
        <li>Mientras el descargo esté en revisión, la penalización no se considera impaga.</li>
      </ol>
      <PendingLegal note="Definir los plazos del procedimiento (presentación del descargo y respuesta de Eventonow), quién resuelve en segunda instancia y por qué canal formal se notifica." />

      {/* 16 ────────────────────────────────────────────────────────────── */}
      <h2 id="reclamos">16. Reclamos y contacto</h2>
      <p>
        Para consultas, reclamos o descargos escribinos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> indicando el número de
        reserva. Te confirmamos la recepción y te respondemos por escrito.
      </p>
      <PendingLegal note="Falta definir un canal formal específico para proveedores, la ley aplicable y la jurisdicción, y los datos del titular (RUT y domicilio)." />

      <h2 id="versiones">Versiones</h2>
      <p>
        Cada versión publicada tendrá número y fecha de vigencia. Te avisaremos antes de
        que entre en vigencia una versión nueva y te pediremos aceptarla. Las reservas
        aceptadas antes se rigen por la versión vigente al aceptarlas.
      </p>
    </LegalDraftLayout>
  );
}
