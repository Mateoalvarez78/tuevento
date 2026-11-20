// ─── PAGOS (seña + saldo con dLocal Go) ───────────────────────────────────────
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

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Próximo cobro de la reserva, o null si no corresponde ninguno.
 *   accepted + unpaid  → seña, o el total si el cliente eligió pagar todo
 *   accepted + partial → saldo
 * `payInFull`: lo que eligió el cliente ahora (true/false). Si no lo dijo,
 * vale lo que marcó al reservar (booking.payInFullRequested). Es el mismo
 * criterio que payment-policy.js#nextPaymentKind del backend, que decide.
 * `now` se inyecta para poder testear plazos.
 */
export function nextPayment(booking, now = new Date(), { payInFull } = {}) {
  if (!booking || booking.rawStatus !== 'accepted') return null;
  const total = Number(booking.totalEstimated) || 0;
  const deposit = Number(booking.depositAmount) || 0;
  if (booking.paymentStatus === 'unpaid') {
    const dueAt = booking.paymentDueAt ? new Date(booking.paymentDueAt) : null;
    const overdue = Boolean(dueAt && dueAt < now);
    const wantsFull = typeof payInFull === 'boolean' ? payInFull : booking.payInFullRequested === true;
    if (wantsFull) {
      return { kind: 'full', label: 'Total', amount: total, dueAt, overdue };
    }
    return {
      kind: 'deposit',
      label: 'Seña',
      amount: deposit,
      dueAt,
      overdue,
    };
  }
  if (booking.paymentStatus === 'partial') {
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

/** ¿Puede elegir entre seña y total? Solo antes del primer cobro. */
export function canChoosePayInFull(booking) {
  return Boolean(booking && booking.rawStatus === 'accepted' && booking.paymentStatus === 'unpaid'
    && Number(booking.totalEstimated) > Number(booking.depositAmount));
}

/**
 * ¿Se muestra el botón de pago? La seña vencida no se puede pagar (el backend
 * responde 409 y la reserva se cancela sola); el saldo vencido sí.
 */
export function canPayNow(booking, now = new Date()) {
  const next = nextPayment(booking, now);
  if (!next) return false;
  // Seña o total vencidos no se pagan (el backend responde 409 y la reserva
  // se cancela sola); el saldo vencido sí.
  if ((next.kind === 'deposit' || next.kind === 'full') && next.overdue) return false;
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
      return (err && err.message) || 'Ya iniciaste un pago con otra opción. Terminalo o esperá a que venza para elegir otra.';
    case 'PAYMENT_DEADLINE_PASSED':
      return 'Venció el plazo para pagar la seña de esta reserva.';
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
// El backend manda `payment_terms` en la ficha del servicio (seña, saldo y el
// plazo que eligió el proveedor). Si falta (backend viejo), no se inventan
// números: no se muestra nada.

/** Opciones de vencimiento del saldo (espejo de payment-policy.js del backend). */
export const BALANCE_DUE_DAYS_OPTIONS = [3, 7, 14, 30];

const isPositiveNumber = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0;

/**
 * Texto de las condiciones de cobro para el cliente, o null si el backend no
 * las mandó o vienen incompletas.
 */
export function paymentTermsLines(terms) {
  if (!terms) return null;
  const {
    deposit_percent: deposit, balance_percent: balance,
    deposit_due_hours: depositHours, balance_due_days_before_event: balanceDays,
  } = terms;
  if (![deposit, balance, depositHours, balanceDays].every(isPositiveNumber)) return null;
  const fmt = (n) => `${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')} %`;
  return [
    `Seña del ${fmt(deposit)} para confirmar la reserva, dentro de las ${depositHours} h desde que el proveedor la acepta.`,
    `Saldo del ${fmt(balance)} hasta ${balanceDays} ${balanceDays === 1 ? 'día' : 'días'} antes del evento.`,
  ];
}

/** Etiqueta de un tipo de cobro (espejo de payment_kind del backend). */
export const PAYMENT_KIND_LABELS = { deposit: 'Seña', balance: 'Saldo', full: 'Pago total' };

/** Error al aceptar una reserva sin la cuenta de cobros lista (409 del backend). */
export function isPaymentAccountRequiredError(err) {
  return Boolean(err && (err.code === 'PAYMENT_ACCOUNT_REQUIRED' || err.code === 'BOOKING_COMMISSION_MISMATCH'));
}
