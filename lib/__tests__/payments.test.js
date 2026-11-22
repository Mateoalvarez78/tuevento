import { describe, test, expect } from 'vitest';
import {
  onlinePaymentsEnabled, paymentSimulationEnabled, nextPayment, canPayNow, clientCanCancel,
  paymentErrorMessage, returnState, paymentTermsLines, isPaymentAccountRequiredError,
  PAYMENT_KIND_LABELS, INSTALLMENTS_LINE,
} from '@/lib/payments';

const NOW = new Date('2026-11-18T12:00:00Z');
const booking = (over = {}) => ({
  rawStatus: 'accepted', paymentStatus: 'unpaid', totalEstimated: 1000, depositAmount: 0,
  paymentDueAt: null, balanceDueAt: null, balanceOverdueAt: null, ...over,
});

describe('flags', () => {
  test('pagos online solo con el literal "true"', () => {
    expect(onlinePaymentsEnabled('true')).toBe(true);
    ['false', '1', '', undefined].forEach((v) => expect(onlinePaymentsEnabled(v)).toBe(false));
  });

  test('el simulador nunca convive con los pagos online', () => {
    expect(paymentSimulationEnabled('true', false)).toBe(true);
    expect(paymentSimulationEnabled('true', true)).toBe(false);
    expect(paymentSimulationEnabled(undefined, false)).toBe(false);
  });
});

describe('nextPayment — pago único por el total', () => {
  test('aceptada sin pagar → el total', () => {
    expect(nextPayment(booking(), NOW)).toMatchObject({ kind: 'full', label: 'Total', amount: 1000, overdue: false });
  });

  test('aunque una reserva vieja tenga seña cargada o el check del carrito, se paga el total', () => {
    expect(nextPayment(booking({ depositAmount: 300, payInFullRequested: false }), NOW)).toMatchObject({ kind: 'full', amount: 1000 });
  });

  test('pagada, pendiente o cancelada → ningún cobro', () => {
    expect(nextPayment(booking({ paymentStatus: 'paid' }), NOW)).toBeNull();
    expect(nextPayment(booking({ rawStatus: 'pending' }), NOW)).toBeNull();
    expect(nextPayment(booking({ rawStatus: 'cancelled' }), NOW)).toBeNull();
  });

  test('plazo: vencido no se puede pagar', () => {
    expect(canPayNow(booking({ paymentDueAt: '2026-11-18T11:00:00Z' }), NOW)).toBe(false);
    expect(canPayNow(booking({ paymentDueAt: '2026-11-19T11:00:00Z' }), NOW)).toBe(true);
  });
});

describe('legado: reservas con seña + saldo', () => {
  test('seña pagada → saldo = total − seña', () => {
    expect(nextPayment(booking({ paymentStatus: 'partial', totalEstimated: 1000.01, depositAmount: 300 }), NOW))
      .toMatchObject({ kind: 'balance', amount: 700.01 });
  });

  test('el saldo vencido se puede pagar igual', () => {
    const past = '2026-11-18T11:00:00Z';
    const balance = booking({ paymentStatus: 'partial', depositAmount: 300, balanceDueAt: past, balanceOverdueAt: past });
    expect(nextPayment(balance, NOW).overdue).toBe(true);
    expect(canPayNow(balance, NOW)).toBe(true);
  });

  test('etiquetas de tipo de cobro', () => {
    expect(PAYMENT_KIND_LABELS).toEqual({ deposit: 'Seña', balance: 'Saldo', full: 'Pago total' });
  });
});

describe('cancelación del cliente (DEC-3)', () => {
  test('solo sin dinero cobrado', () => {
    expect(clientCanCancel(booking())).toBe(true);
    expect(clientCanCancel(booking({ rawStatus: 'pending' }))).toBe(true);
    expect(clientCanCancel(booking({ paymentStatus: 'partial' }))).toBe(false);
    expect(clientCanCancel(booking({ paymentStatus: 'paid' }))).toBe(false);
    expect(clientCanCancel(booking({ rawStatus: 'completed' }))).toBe(false);
  });
});

describe('mensajes de error de pago', () => {
  test('un estado incierto pide explícitamente NO volver a pagar', () => {
    expect(paymentErrorMessage({ code: 'PAYMENT_STATUS_UNKNOWN' })).toMatch(/no vuelvas a pagar/);
    expect(paymentErrorMessage({ code: 'PAYMENT_UNDER_REVIEW' })).toMatch(/verificando/);
  });

  test('plazo vencido sin hablar de seña', () => {
    expect(paymentErrorMessage({ code: 'PAYMENT_DEADLINE_PASSED' })).toBe('Venció el plazo para pagar esta reserva.');
  });

  test('código desconocido: usa el mensaje del backend', () => {
    expect(paymentErrorMessage({ code: 'X', message: 'detalle' })).toBe('detalle');
  });
});

describe('retorno de dLocal', () => {
  test.each([
    ['paid', 'paid'], ['pending', 'processing'], ['creation_unknown', 'processing'],
    ['rejected', 'failed'], ['expired', 'failed'], ['amount_mismatch', 'review'], ['late_paid', 'review'],
  ])('%s → %s', (status, expected) => {
    expect(returnState({ status })).toBe(expected);
  });
});

describe('condiciones de cobro antes de reservar', () => {
  const terms = { payment_mode: 'single_payment', payment_due_hours: 48, installments_available: true };

  test('pago único, plazo y aviso de cuotas', () => {
    expect(paymentTermsLines(terms)).toEqual([
      'Pagás el total en un solo pago, dentro de las 48 h desde que el proveedor acepta la reserva.',
      INSTALLMENTS_LINE,
    ]);
  });

  test('sin cuotas habilitadas no se las promete', () => {
    expect(paymentTermsLines({ ...terms, installments_available: false })).toHaveLength(1);
  });

  test('el texto de cuotas nunca promete un número de cuotas', () => {
    expect(INSTALLMENTS_LINE).not.toMatch(/\d/);
  });

  test('sin condiciones del backend, incompletas o del formato viejo (seña + saldo): no inventa números', () => {
    expect(paymentTermsLines(undefined)).toBeNull();
    expect(paymentTermsLines({ ...terms, payment_due_hours: null })).toBeNull();
    expect(paymentTermsLines({ ...terms, payment_due_hours: '48' })).toBeNull();
    expect(paymentTermsLines({ deposit_percent: 20, balance_percent: 80, deposit_due_hours: 48, balance_due_days_before_event: 14 })).toBeNull();
  });

  test('reconoce el 409 de aceptar sin cuenta de cobros', () => {
    expect(isPaymentAccountRequiredError({ code: 'PAYMENT_ACCOUNT_REQUIRED' })).toBe(true);
    expect(isPaymentAccountRequiredError({ code: 'BOOKING_COMMISSION_MISMATCH' })).toBe(true);
    expect(isPaymentAccountRequiredError({ code: 'AVAILABILITY_CONFLICT' })).toBe(false);
    expect(isPaymentAccountRequiredError(null)).toBe(false);
  });
});
