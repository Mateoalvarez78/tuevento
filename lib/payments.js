// ─── PAGOS (pago único por el total con dLocal Go) ───────────────────────────
// Desde el 22/11/2026 (ADR 0007 del backend) cada reserva se paga en UN solo
// pago por el total; con tarjeta de crédito el cliente puede elegir cuotas
// dentro del checkout. El saldo solo existe en reservas viejas (seña + saldo).
// Reglas de presentación de los cobros de una reserva. PURO a propósito: sin
// fetch, sin React. El backend decide (eventonow-back/docs/payments/); acá solo
// se traduce su estado a qué botón mostrar y qué decir.
//
// Regla de oro: el frontend NUNCA decide que algo está pagado. Solo muestra
// payment_status de la reserva y el estado del intento que devuelve la API.

/** Pagos online habilitados en este build (flag pública, no es un secreto). */
export function onlinePaymentsEnabled(raw = process.env.NEXT_PUBLIC_ONLINE_PAYMENTS_ENABLED) {
  return raw === 'true';
}

/** Simulador de desarrollo. Nunca junto con pagos online. */
export function paymentSimulationEnabled(
  raw = process.env.NEXT_PUBLIC_PAYMENT_SIMULATION,
  online = onlinePaymentsEnabled()
) {
  return raw === 'true' && !online;
}

/**
 * Aviso de cuotas en Mis reservas (junto al botón de pago). Espejo de
 * PAYMENT_INSTALLMENTS_ENABLED del backend: prendido salvo 'false' explícito.
 * La ficha del servicio usa `payment_terms.installments_available`, que manda el backend.
 */
export function installmentsHintEnabled(raw = process.env.NEXT_PUBLIC_PAYMENT_INSTALLMENTS) {
  return raw !== 'false';
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Próximo cobro de la reserva, o null si no corresponde ninguno.
 *   accepted + unpaid  → el total (pago único)
 *   accepted + partial → saldo (solo reservas viejas que pagaron seña)
 * Mismo criterio que payment-policy.js#nextPaymentKind del backend, que decide.
 * `now` se inyecta para poder testear plazos.
 */
export function nextPayment(booking, now = new Date()) {
  if (!booking || booking.rawStatus !== 'accepted') return null;
  const total = Number(booking.totalEstimated) || 0;
  if (booking.paymentStatus === 'unpaid') {
    const dueAt = booking.paymentDueAt ? new Date(booking.paymentDueAt) : null;
    return { kind: 'full', label: 'Total', amount: total, dueAt, overdue: Boolean(dueAt && dueAt < now) };
  }
  if (booking.paymentStatus === 'partial') {
    // Legado: reserva creada con seña + saldo antes del pago único.
    const deposit = Number(booking.depositAmount) || 0;
    const dueAt = booking.balanceDueAt ? new Date(booking.balanceDueAt) : null;
    return {
      kind: 'balance',
      label: 'Saldo',
      amount: round2(total - deposit),
      dueAt,
      overdue: Boolean(booking.balanceOverdueAt || (dueAt && dueAt < now)),
    };
  }
  return null;
}

/**
 * ¿Se muestra el botón de pago? El pago vencido no se puede hacer (el backend
 * responde 409 y la reserva se cancela sola); el saldo vencido del legado sí.
 */
export function canPayNow(booking, now = new Date()) {
  const next = nextPayment(booking, now);
  if (!next) return false;
  if (next.kind === 'full' && next.overdue) return false;
  return true;
}

/** El cliente solo cancela por su cuenta si no hay dinero cobrado (DEC-3). */
export function clientCanCancel(booking) {
  if (!booking) return false;
  if (booking.rawStatus !== 'pending' && booking.rawStatus !== 'accepted') return false;
  return booking.paymentStatus === 'unpaid';
}

/** Texto de un error de pago del backend, por código. Nunca un genérico que invite a pagar de nuevo. */
export function paymentErrorMessage(err) {
  switch (err && err.code) {
    case 'PAYMENT_STATUS_UNKNOWN':
      return 'No pudimos confirmar si el pago se inició. Lo estamos verificando: no vuelvas a pagar por ahora, te avisamos.';
    case 'PAYMENT_UNDER_REVIEW':
      return 'Estamos verificando un pago anterior de esta reserva. Te avisamos apenas esté resuelto.';
    case 'PAYMENT_IN_PROGRESS':
      return 'Ya hay un pago en proceso para esta reserva. Esperá unos minutos y volvé a intentar.';
    case 'PAYMENT_KIND_IN_PROGRESS':
      return (err && err.message) || 'Ya hay un pago iniciado para esta reserva. Terminalo o esperá a que venza para volver a pagar.';
    case 'PAYMENT_DEADLINE_PASSED':
      return 'Venció el plazo para pagar esta reserva.';
    case 'PROVIDER_PAYMENTS_UNAVAILABLE':
      return 'Este proveedor todavía no tiene habilitados los pagos online. Escribinos y lo coordinamos.';
    case 'PAYMENTS_DISABLED':
    case 'PAYMENTS_MISCONFIGURED':
      return 'Los pagos online no están disponibles en este momento. Probá más tarde.';
    case 'ALREADY_PAID':
      return 'Esta reserva ya está paga.';
    case 'PAYMENT_PROVIDER_REJECTED':
      return 'El proveedor de pagos no pudo iniciar el cobro. Probá de nuevo en unos minutos.';
    default:
      return (err && err.message) || 'No se pudo iniciar el pago.';
  }
}

/**
 * Estado del retorno de dLocal (/pago/exito) a partir de lo que devuelve
 * POST /payments/intents/:id/sync.
 */
export function returnState(intent) {
  if (!intent) return 'checking';
  switch (intent.status) {
    case 'paid':
      return 'paid';
    case 'pending':
    case 'creating':
    case 'creation_unknown':
      return 'processing';
    case 'rejected':
    case 'expired':
    case 'cancelled':
      return 'failed';
    default:
      return 'review'; // amount_mismatch, late_paid, refunded…: lo resuelve el equipo
  }
}

/** Formato de fecha y hora de un plazo, en Uruguay. */
export function formatDue(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Montevideo',
  }).format(date);
}

// ─── Condiciones de cobro visibles ANTES de reservar ─────────────────────────
// El backend manda `payment_terms` en la ficha del servicio:
//   { payment_mode: 'single_payment', payment_due_hours, installments_available }
// Si falta o viene en otro formato (backend viejo), no se inventan números:
// no se muestra nada.

/** Texto de las cuotas. Las ofrece el checkout según la tarjeta: nunca prometemos un número. */
export const INSTALLMENTS_LINE = 'Con tarjeta de crédito podés pagarlo en cuotas: las elegís al pagar, según lo que ofrezca tu tarjeta.';

/**
 * Texto de las condiciones de cobro para el cliente, o null si el backend no
 * las mandó o vienen incompletas.
 */
export function paymentTermsLines(terms) {
  if (!terms || terms.payment_mode !== 'single_payment') return null;
  const hours = terms.payment_due_hours;
  if (!(typeof hours === 'number' && Number.isInteger(hours) && hours > 0)) return null;
  const lines = [`Pagás el total en un solo pago, dentro de las ${hours} h desde que el proveedor acepta la reserva.`];
  if (terms.installments_available === true) lines.push(INSTALLMENTS_LINE);
  return lines;
}

/** Etiqueta de un tipo de cobro (espejo de payment_kind del backend; seña y saldo son del legado). */
export const PAYMENT_KIND_LABELS = { deposit: 'Seña', balance: 'Saldo', full: 'Pago total' };

/** Error al aceptar una reserva sin la cuenta de cobros lista (409 del backend). */
export function isPaymentAccountRequiredError(err) {
  return Boolean(err && (err.code === 'PAYMENT_ACCOUNT_REQUIRED' || err.code === 'BOOKING_COMMISSION_MISMATCH'));
}
