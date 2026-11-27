import { notFound } from 'next/navigation';
import { legalMetadata } from '@/components/legal/LegalDocument';
import LegalDraftLayout from '@/components/legal/LegalDraftLayout';
import PendingLegal from '@/components/legal/PendingLegal';
import { BRAND, CONTACT_EMAIL, LEGAL_PAGES_REACHABLE } from '@/lib/site';
import { LEGAL_DOCS } from '@/lib/legalDocs';
import { COMMERCIAL, CLIENT_CANCELLATION_SCALE } from '@/lib/providerTerms';

export const metadata = legalMetadata({
  title: 'Política de cancelaciones y reembolsos',
  description: `Qué pasa si cancelás una reserva en ${BRAND}, si cancela el proveedor o si ocurre algo fuera de control: devoluciones, créditos y derecho de arrepentimiento.`,
  path: '/terminos/cancelaciones',
});

// ─── POLÍTICA DE CANCELACIONES Y REEMBOLSOS (CLIENTES) ──────────────────────
//
// Documento nuevo. La escala de cancelación del cliente es una PROPUESTA de
// política única de plataforma (lib/providerTerms.js → CLIENT_CANCELLATION_SCALE)
// y se publica dentro de <PendingLegal>, rotulada «En revisión legal».
//
// Derecho de arrepentimiento: art. 16 de la Ley 17.250 (5 días hábiles hoy);
// la Ley 20.531 (art. 108) lo sustituye por 10 días corridos y «botón de
// arrepentimiento», con vigencia general desde el 1/1/2027 (art. 2). El texto
// no promete un plazo menor al legal en ningún caso.

const SECTIONS = [
  { id: 'resumen',          title: 'Resumen' },
  { id: 'arrepentimiento',  title: 'Derecho de arrepentimiento' },
  { id: 'antes-de-confirmar', title: 'Antes de que se confirme la reserva' },
  { id: 'cancela-cliente',  title: 'Si cancelás vos' },
  { id: 'cancela-proveedor', title: 'Si cancela el proveedor' },
  { id: 'fuerza-mayor',     title: 'Hechos fuera de control' },
  { id: 'cambios-fecha',    title: 'Cambios de fecha' },
  { id: 'pago-vencido',     title: 'Si no se paga a tiempo' },
  { id: 'creditos',         title: 'Créditos compensatorios' },
  { id: 'reembolsos',       title: 'Cómo y cuándo se reembolsa' },
  { id: 'contracargos',     title: 'Desconocimientos y contracargos' },
  { id: 'como-pedir',       title: 'Cómo pedir una cancelación o un reclamo' },
];

const INTERNAL_NOTES = [
  'Aprobar la escala de cancelación del cliente (propuesta de política única).',
  'Confirmar con el abogado cómo convive el pago anticipado del total (y lo retenido en la escala) con el derecho de arrepentimiento y si aplica a servicios con fecha determinada.',
  'Confirmar con el procesador de pagos cómo se reembolsa un pago hecho en cuotas (si se anulan las cuotas pendientes o se devuelve lo ya cobrado).',
  'Confirmar la fecha de vigencia del nuevo art. 16 (Ley 20.531, art. 108) e implementar el botón de arrepentimiento.',
  'Definir plazos de respuesta a pedidos de cancelación y de inicio del reembolso.',
  'Definir la lista objetiva de hechos fuera de control.',
  'Confirmar con el procesador de pagos cómo se devuelve la comisión de Eventonow en un reembolso total.',
];

export default function CancelacionesPage() {
  if (!LEGAL_PAGES_REACHABLE) notFound();

  const c = COMMERCIAL;

  return (
    <LegalDraftLayout
      doc={LEGAL_DOCS.cancelaciones}
      space="cliente"
      sections={SECTIONS}
      internalNotes={INTERNAL_NOTES}
      intro={`Esta política explica qué pasa con tu reserva y con tu dinero si tenés que cancelar, si el proveedor cancela o si ocurre algo que nadie podía prever. Complementa los Términos y condiciones de ${BRAND}.`}
    >
      {/* Resumen */}
      <section aria-labelledby="resumen" className="mb-10 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 id="resumen" className="!mt-0">1. Resumen</h2>
        <ul>
          <li>Podés <strong>arrepentirte</strong> dentro del plazo legal y recuperar lo que pagaste, sin dar explicaciones.</li>
          <li>Si <strong>cancela el proveedor</strong>, te devolvemos todo lo que pagaste.</li>
          <li>Si <strong>cancelás vos</strong> fuera del plazo de arrepentimiento, podés hacerlo <strong>hasta {c.clientCancellationMinDays} días antes del evento</strong>, y el reembolso depende de cuánto falte. Con menos anticipación la reserva ya no se puede cancelar.</li>
          <li>Ante un <strong>hecho fuera de control</strong> de las partes, revisamos el caso y buscamos una solución justa para ambos.</li>
          <li>Todas las cancelaciones y reembolsos los gestiona {BRAND}.</li>
        </ul>
      </section>

      {/* 2 */}
      <h2 id="arrepentimiento">2. Derecho de arrepentimiento</h2>
      <p>
        Como contratás a distancia, la ley uruguaya de relaciones de consumo te
        reconoce el derecho a <strong>arrepentirte sin dar explicaciones y sin
        costo</strong> dentro del plazo legal, que se cuenta desde que la reserva se
        confirma:
      </p>
      <ul>
        <li><strong>Hoy:</strong> 5 días hábiles (Ley 17.250, artículo 16).</li>
        <li>
          <strong>Con la Ley 20.531:</strong> 10 días corridos. Esa ley rige, en general,
          desde el 1° de enero de 2027.
        </li>
      </ul>
      <p>
        Si te arrepentís en plazo, te devolvemos <strong>todo lo que pagaste</strong>.
        Si una parte del servicio ya se prestó a tu pedido, se descuenta solo esa parte.
        Para ejercerlo, escribinos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
        con el asunto «Arrepentimiento» y el número de reserva.
      </p>
      <p>
        <strong>Este derecho está por encima de cualquier otra regla de esta
        política.</strong> La revisión de {BRAND} nunca puede demorarlo ni negarlo.
      </p>

      {/* 3 */}
      <h2 id="antes-de-confirmar">3. Antes de que se confirme la reserva</h2>
      <p>
        Mientras la reserva no esté confirmada (es decir, mientras no la pagaste),
        podés retirar tu solicitud en cualquier momento <strong>sin ningún costo</strong>.
        No se te cobra nada.
      </p>

      {/* 4 */}
      <h2 id="cancela-cliente">4. Si cancelás vos una reserva confirmada</h2>
      <p>
        Fuera del plazo de arrepentimiento podés cancelar una reserva confirmada{' '}
        <strong>como máximo hasta {c.clientCancellationMinDays} días corridos antes del
        evento</strong>. Contamos los días corridos entre la fecha en que nos pedís la
        cancelación y la fecha del evento, con fechas de Uruguay. Lo que te
        devolvemos depende de esa anticipación:
      </p>
      <PendingLegal inForce={LEGAL_DOCS.cancelaciones.status === 'published'} note="Plazo mínimo de 7 días decidido el 22/11/2026. El porcentaje retenido del tramo intermedio es una propuesta: falta aprobación comercial y revisión jurídica (proporcionalidad frente a la Ley 17.250).">
        <p className="mb-2">
          Los porcentajes se calculan sobre el total que pagaste por la reserva, aunque
          lo hayas pagado en cuotas.
        </p>
      </PendingLegal>
      <div className="overflow-x-auto mb-4">
        <table>
          <caption className="text-left text-xs text-gray-500 mb-2">
            Qué pasa si cancelás, según cuánto falte para el evento.
          </caption>
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th scope="col" className="py-2 pr-4 font-semibold text-gray-900">Cuándo cancelás</th>
              <th scope="col" className="py-2 font-semibold text-gray-900">Qué te devolvemos</th>
            </tr>
          </thead>
          <tbody>
            {CLIENT_CANCELLATION_SCALE.map((t) => (
              <tr key={t.label} className="border-b border-gray-100 align-top">
                <td className="py-2 pr-4 whitespace-nowrap">{t.label}</td>
                <td className="py-2">{t.refund}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Lo que no se reembolsa compensa al proveedor por haber bloqueado la fecha y
        rechazado otros eventos. Si reservás un servicio cuando faltan menos de{' '}
        {c.clientCancellationMinDays} días para el evento, tené en cuenta que desde el
        momento del pago la reserva ya no admite cancelación de tu parte (salvo el
        derecho de arrepentimiento del punto 2).
      </p>
      <p>
        Si pagaste en cuotas, el reembolso se hace sobre el mismo medio de pago y la
        forma en que se refleja en tu resumen (anulación de cuotas pendientes o
        devolución de lo cobrado) depende del emisor de tu tarjeta.
      </p>

      {/* 5 */}
      <h2 id="cancela-proveedor">5. Si cancela el proveedor</h2>
      <ul>
        <li>Te avisamos apenas lo sepamos.</li>
        <li><strong>Te devolvemos todo lo que pagaste</strong>: el total de la reserva.</li>
        <li>Te ayudamos a encontrar otro proveedor disponible para tu fecha.</li>
        <li>
          {BRAND} puede ofrecerte además un <strong>crédito compensatorio</strong> para
          contratar a otro proveedor (ver punto 9).
        </li>
      </ul>
      <p>
        El proveedor que cancela sin causa justificada enfrenta consecuencias con{' '}
        {BRAND}, pero tu reembolso no depende de eso.
      </p>

      {/* 6 */}
      <h2 id="fuerza-mayor">6. Hechos fuera de control</h2>
      <p>
        Si un hecho imprevisible y ajeno a las partes hace imposible realizar el evento
        o prestar el servicio (por ejemplo, una emergencia declarada por la autoridad o
        un fenómeno climático extremo), revisamos el caso con vos y con el proveedor.
        Buscamos primero un cambio de fecha; si no es posible, se reembolsa lo que
        corresponda.
      </p>
      <PendingLegal inForce={LEGAL_DOCS.cancelaciones.status === 'published'} note="Falta la lista objetiva de hechos que califican y qué documentación se pide." />

      {/* 7 */}
      <h2 id="cambios-fecha">7. Cambios de fecha</h2>
      <p>
        Por ahora la plataforma no ofrece cambios de fecha automáticos. Si necesitás
        mover tu evento, escribinos: lo coordinamos con el proveedor. Si el proveedor
        está disponible y acepta, lo que pagaste se mantiene para la nueva fecha. Si no
        hay acuerdo, se aplica esta política de cancelación.
      </p>

      {/* 8 */}
      <h2 id="pago-vencido">8. Si no se paga a tiempo</h2>
      <p>
        Si el proveedor acepta y no pagás dentro del plazo indicado, la solicitud{' '}
        <strong>vence sola</strong>: la fecha vuelve a quedar libre y no se te cobra
        nada.
      </p>

      {/* 9 */}
      <h2 id="creditos">9. Créditos compensatorios</h2>
      <p>
        Cuando un proveedor cancela, {BRAND} puede ofrecerte un crédito para contratar
        otro servicio. Es una decisión de {BRAND}, no un derecho automático, y se suma a
        tu reembolso: no lo reemplaza.
      </p>
      <ul>
        <li>Vence a los <strong>{c.creditExpiryMonths} meses</strong> desde que se emite.</li>
        <li>Se descuenta del <strong>total</strong> de una reserva nueva.</li>
        <li>Si la reserva donde lo usaste se cancela sin culpa tuya, <strong>te devolvemos el crédito</strong>.</li>
        <li>Lo financia {BRAND}: el nuevo proveedor cobra su precio completo.</li>
      </ul>

      {/* 10 */}
      <h2 id="reembolsos">10. Cómo y cuándo se reembolsa</h2>
      <ul>
        <li>Cada reembolso lo revisa y autoriza {BRAND}, con la información de la reserva.</li>
        <li>Se devuelve <strong>al mismo medio de pago</strong> que usaste.</li>
        <li>El tiempo de acreditación depende de tu banco o emisor de tarjeta.</li>
        <li>Si un reembolso legal se demora, el importe se actualiza según la ley.</li>
      </ul>
      <PendingLegal inForce={LEGAL_DOCS.cancelaciones.status === 'published'} note="Definir el plazo máximo para iniciar el reembolso una vez resuelto el caso." />

      {/* 11 */}
      <h2 id="contracargos">11. Desconocimientos y contracargos</h2>
      <p>
        Si no reconocés un cobro, escribinos primero: casi siempre lo resolvemos más
        rápido que por el banco. Igual conservás tu derecho de reclamar ante el emisor
        de tu tarjeta. En ese caso, {BRAND} coordina la respuesta con el proveedor y
        aporta la información de la reserva.
      </p>

      {/* 12 */}
      <h2 id="como-pedir">12. Cómo pedir una cancelación o hacer un reclamo</h2>
      <ol>
        <li>Escribinos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> con el número de reserva y el motivo.</li>
        <li>Te confirmamos la recepción y la fecha que tomamos como fecha de tu pedido.</li>
        <li>Te respondemos por escrito con la resolución y, si corresponde, el reembolso.</li>
      </ol>
      <p>
        Si no estás conforme con la respuesta, podés presentar un reclamo ante el Área
        de Defensa del Consumidor del Ministerio de Economía y Finanzas.
      </p>
    </LegalDraftLayout>
  );
}
