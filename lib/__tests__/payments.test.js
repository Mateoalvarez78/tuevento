import { describe, test, expect } from 'vitest';
import {
  onlinePaymentsEnabled, paymentSimulationEnabled, nextPayment, canPayNow, clientCanCancel,
  paymentErrorMessage, returnState, paymentTermsLines, isPaymentAccountRequiredError, BALANCE_DUE_DAYS_OPTIONS,
  canChoosePayInFull, PAYMENT_KIND_LABELS,
} from '@/lib/payments';

const NOW = new Date('2026-11-18T12:00:00Z');
const booking = (over = {}) => ({
  rawStatus: 'accepted', paymentStatus: 'unpaid', totalEstimated: 1000, depositAmount: 300,
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

describe('nextPayment — seña + saldo', () => {
  test('aceptada sin pagar → seña', () => {
    expect(nextPayment(booking(), NOW)).toMatchObject({ kind: 'deposit', amount: 300, overdue: false });
  });

  test('seña pagada → saldo = total − seña', () => {
    expect(nextPayment(booking({ paymentStatus: 'partial', totalEstimated: 1000.01 }), NOW))
      .toMatchObject({ kind: 'balance', amount: 700.01 });
  });

  test('pagada, pendiente o cancelada → ningún cobro', () => {
    expect(nextPayment(booking({ paymentStatus: 'paid' }), NOW)).toBeNull();
    expect(nextPayment(booking({ rawStatus: 'pending' }), NOW)).toBeNull();
    expect(nextPayment(booking({ rawStatus: 'cancelled' }), NOW)).toBeNull();
  });

  test('plazos: la seña vencida no se puede pagar; el saldo vencido sí', () => {
    const past = '2026-11-18T11:00:00Z';
    expect(canPayNow(booking({ paymentDueAt: past }), NOW)).toBe(false);
    expect(canPayNow(booking({ paymentDueAt: '2026-11-19T11:00:00Z' }), NOW)).toBe(true);
    const balance = booking({ paymentStatus: 'partial', balanceDueAt: past, balanceOverdueAt: past });
    expect(nextPayment(balance, NOW).overdue).toBe(true);
    expect(canPayNow(balance, NOW)).toBe(true);
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

describe('condiciones de cobro antes de reservar (A4)', () => {
  const terms = { deposit_percent: 20, balance_percent: 80, deposit_due_hours: 48, balance_due_days_before_event: 14 };

  test('muestra seña, plazo de la seña y el plazo del saldo que eligió el proveedor', () => {
    expect(paymentTermsLines(terms)).toEqual([
      'Seña del 20 % para confirmar la reserva, dentro de las 48 h desde que el proveedor la acepta.',
      'Saldo del 80 % hasta 14 días antes del evento.',
    ]);
  });

  test('sin condiciones del backend (o incompletas) no inventa números', () => {
    expect(paymentTermsLines(undefined)).toBeNull();
    expect(paymentTermsLines({ ...terms, balance_due_days_before_event: null })).toBeNull();
    expect(paymentTermsLines({ ...terms, deposit_percent: '20' })).toBeNull();
  });

  test('las opciones son las del backend', () => {
    expect(BALANCE_DUE_DAYS_OPTIONS).toEqual([3, 7, 14, 30]);
  });

  test('reconoce el 409 de aceptar sin cuenta de cobros', () => {
    expect(isPaymentAccountRequiredError({ code: 'PAYMENT_ACCOUNT_REQUIRED' })).toBe(true);
    expect(isPaymentAccountRequiredError({ code: 'BOOKING_COMMISSION_MISMATCH' })).toBe(true);
    expect(isPaymentAccountRequiredError({ code: 'AVAILABILITY_CONFLICT' })).toBe(false);
    expect(isPaymentAccountRequiredError(null)).toBe(false);
  });
});

describe('pagar el total de una vez (DEC-7)', () => {
  test('impaga: seña por defecto; total si lo marcó en el carrito o lo elige al pagar', () => {
    expect(nextPayment(booking(), NOW)).toMatchObject({ kind: 'deposit', amount: 300 });
    expect(nextPayment(booking({ payInFullRequested: true }), NOW)).toMatchObject({ kind: 'full', label: 'Total', amount: 1000 });
    expect(nextPayment(booking(), NOW, { payInFull: true })).toMatchObject({ kind: 'full', amount: 1000 });
  });

  test('lo que elige al pagar gana sobre lo del carrito', () => {
    expect(nextPayment(booking({ payInFullRequested: true }), NOW, { payInFull: false }).kind).toBe('deposit');
  });

  test('con la seña paga ya no hay opción: corresponde el saldo', () => {
    const b = booking({ paymentStatus: 'partial', payInFullRequested: true });
    expect(nextPayment(b, NOW, { payInFull: true })).toMatchObject({ kind: 'balance', amount: 700 });
    expect(canChoosePayInFull(b)).toBe(false);
  });

  test('el total comparte el plazo de la seña: vencido no se puede pagar', () => {
    const b = booking({ payInFullRequested: true, paymentDueAt: '2026-11-18T11:00:00Z' });
    expect(nextPayment(b, NOW)).toMatchObject({ kind: 'full', overdue: true });
    expect(canPayNow(b, NOW)).toBe(false);
  });

  test('canChoosePayInFull: solo aceptada, impaga y con saldo por pagar', () => {
    expect(canChoosePayInFull(booking())).toBe(true);
    expect(canChoosePayInFull(booking({ rawStatus: 'pending' }))).toBe(false);
    expect(canChoosePayInFull(booking({ depositAmount: 1000 }))).toBe(false);
  });

  test('mensaje del backend cuando ya empezó a pagar con la otra opción', () => {
    const err = { code: 'PAYMENT_KIND_IN_PROGRESS', message: 'Ya iniciaste el pago de la seña. Terminalo o esperá a que venza para elegir otra opción.' };
    expect(paymentErrorMessage(err)).toBe(err.message);
  });

  test('etiquetas de tipo de cobro', () => {
    expect(PAYMENT_KIND_LABELS).toEqual({ deposit: 'Seña', balance: 'Saldo', full: 'Pago total' });
  });
});
