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
 *   accepted + unpaid  → seña
 *   accepted + partial → saldo
 * `now` se inyecta para poder testear plazos.
 */
export function nextPayment(booking, now = new Date()) {
  if (!booking || booking.rawStatus !== 'accepted') return null;
  const total = Number(booking.totalEstimated) || 0;
  const deposit = Number(booking.depositAmount) || 0;
  if (booking.paymentStatus === 'unpaid') {
    const dueAt = booking.paymentDueAt ? new Date(booking.paymentDueAt) : null;
    return {
      kind: 'deposit',
      label: 'Seña',
      amount: deposit,
      dueAt,
      overdue: Boolean(dueAt && dueAt < now),
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

/**
 * ¿Se muestra el botón de pago? La seña vencida no se puede pagar (el backend
 * responde 409 y la reserva se cancela sola); el saldo vencido sí.
 */
export function canPayNow(booking, now = new Date()) {
  const next = nextPayment(booking, now);
  if (!next) return false;
  if (next.kind === 'deposit' && next.overdue) return false;
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
