// ─── PARÁMETROS COMERCIALES DE LOS DOCUMENTOS LEGALES ────────────────────────
//
// Fuente única de los números que citan las Condiciones para proveedores y la
// Política de cancelaciones del cliente. Existe para que ningún documento tenga
// porcentajes o plazos escritos a mano: si una decisión cambia, cambia acá y
// todos los textos se actualizan.
//
// ⚠ NADA DE ESTE ARCHIVO SE APLICA A RESERVAS. Solo lo importan las páginas
// legales (test). La lógica de cobro vive en el backend (payments/
// payment-policy.js y utils/constants.js). Desde el 22/11/2026 los valores
// coinciden: comisión 10 % y pago único por el total dentro de las 48 h desde
// la aceptación, con cuotas con tarjeta de crédito en el checkout (ADR 0007 del
// backend, que reemplazó al modelo anterior de pago en dos partes). Si cambia
// uno, hay que cambiarlo en los dos lados.
//
// No se nombra el procesador de pagos en el texto: el guard de contenido público
// (lib/__tests__/publicContent.guard.test.js) prohíbe anunciarlo mientras el
// checkout no esté operativo. Los documentos dicen «el procesador de pagos de
// la plataforma»; el nombre se agrega cuando el checkout esté validado.

import { DRAFTS_VISIBLE, LEGAL_PREVIEW_PUBLISHED } from '@/lib/site';
import { LEGAL_DOCS } from '@/lib/legalDocs';

/**
 * Estado del documento: sale del registro único (lib/legalDocs.js). Una
 * versión preliminar no tiene fecha de vigencia y no puede aceptarse.
 */
export const PROVIDER_TERMS_DOC = LEGAL_DOCS.proveedores;

/**
 * Compuerta propia de la versión DEFINITIVA, separada de PUBLIC_LEGAL_READY a
 * propósito: que los Términos de clientes y la Privacidad se publiquen como
 * vigentes NO publica estas condiciones como vigentes. Se pone en `true` solo
 * con aprobación de Mateo y del abogado.
 */
export const PROVIDER_TERMS_PUBLISHED = false;

/**
 * ¿Se sirve la página? Como definitiva si se publicó; como versión preliminar
 * mientras LEGAL_PREVIEW_PUBLISHED esté encendida (decisión del 19/11/2026);
 * como borrador en dev/test.
 */
export const PROVIDER_TERMS_REACHABLE =
  PROVIDER_TERMS_PUBLISHED || LEGAL_PREVIEW_PUBLISHED || DRAFTS_VISIBLE;

// ── Parámetros comerciales confirmados por Eventonow ───────────────────────
// "Confirmado" = decisión comercial tomada. No equivale a validación jurídica.

export const COMMERCIAL = Object.freeze({
  commissionPercent: 10,
  /** El cliente paga el total en un solo pago (puede elegir cuotas con tarjeta de crédito). */
  singlePayment: true,
  /**
   * Anticipación mínima, en días corridos, con la que el CLIENTE puede
   * cancelar una reserva confirmada (decisión del 22/11/2026). Con menos días
   * que esto la reserva ya no admite cancelación del cliente, sin perjuicio del
   * derecho de arrepentimiento ni de los casos en que cancela el proveedor.
   */
  clientCancellationMinDays: 7,
  /**
   * Porcentaje del total que se retiene si el cliente cancela entre
   * `clientCancellationMinDays` y 30 días antes del evento. PROPUESTA,
   * pendiente de aprobación.
   */
  clientRetainedPercentMid: 20,
  /** Días corridos para pagar una multa confirmada y notificada. */
  finePaymentDays: 7,
  /** Ventana móvil para contar reincidencias. */
  recidivismWindowMonths: 12,
  /** Vigencia de un crédito compensatorio desde su emisión. */
  creditExpiryMonths: 12,
});

// ── Escala de penalizaciones (PROPUESTA, pendiente de aprobación) ──────────
//
// Límites exactos, sin huecos ni superposiciones. La medida es
//
//   d = (fecha del evento) − (fecha en que el proveedor presenta la cancelación)
//
// en DÍAS CORRIDOS ENTEROS, contando fechas calendario de Uruguay (UTC-3), no
// horas. Así un pedido presentado a las 23:59 y otro a las 00:01 del día
// siguiente caen en tramos distintos de forma predecible, y no existe el caso
// "14,5 días" que dejaba un hueco entre «7 a 14» y «15 a 30».
//
// Se mide desde la PRESENTACIÓN, no desde la resolución del admin: la demora de
// la revisión no puede agravar la situación del proveedor.
//
// El texto original decía «más de 30 días: 0 %» y «entre 15 y 30: 5 %». Con
// días enteros, «más de 30» es d ≥ 31.
export const PENALTY_SCALE = Object.freeze([
  Object.freeze({ minDays: 31, maxDays: null, percent: 0,  label: '31 días o más antes del evento' }),
  Object.freeze({ minDays: 15, maxDays: 30,   percent: 5,  label: 'Entre 15 y 30 días antes' }),
  Object.freeze({ minDays: 7,  maxDays: 14,   percent: 10, label: 'Entre 7 y 14 días antes' }),
  Object.freeze({ minDays: 0,  maxDays: 6,    percent: 15, label: 'Entre 0 y 6 días antes (incluye el mismo día del evento)' }),
]);

/**
 * Tramo de la escala para `d` días corridos. SOLO documental: existe para que
 * los tests demuestren que la escala cubre todos los casos sin superponerse.
 * No calcula ni aplica multas a reservas.
 *
 * Devuelve null para d < 0 (cancelación posterior al evento / no presentación),
 * que queda fuera de la escala y pendiente de definición.
 */
export function penaltyTierFor(days) {
  if (!Number.isInteger(days)) {
    throw new TypeError('La escala se mide en días corridos enteros');
  }
  if (days < 0) return null;
  return PENALTY_SCALE.find(
    (t) => days >= t.minDays && (t.maxDays === null || days <= t.maxDays)
  ) ?? null;
}

// ── Reincidencias (ventana de 12 meses) ────────────────────────────────────

export const RECIDIVISM_STEPS = Object.freeze([
  Object.freeze({ ordinal: 'Primera', consequence: 'Advertencia formal y la multa que corresponda según la escala.' }),
  Object.freeze({ ordinal: 'Segunda', consequence: 'Multa y suspensión de 15 días corridos para recibir nuevas reservas.' }),
  Object.freeze({ ordinal: 'Tercera', consequence: 'Multa, suspensión de 30 días corridos y revisión integral de la cuenta.' }),
  Object.freeze({ ordinal: 'Cuarta',  consequence: 'Multa y posible baja definitiva de la plataforma.' }),
]);

// ── Plazo de pago ──────────────────────────────────────────────────────────

/** Horas que tiene el cliente para pagar el total después de que el proveedor acepta. */
export const PAYMENT_HOURS = 48;

// ── Cancelación por parte del CLIENTE ──────────────────────────────────────
//
// Misma medida que la escala de proveedores: días corridos enteros entre la
// fecha en que el cliente presenta la cancelación y la fecha del evento.
// Política ÚNICA de plataforma (no la elige cada proveedor).
//
// Decidido (22/11/2026): el cliente puede cancelar como máximo hasta 7 días
// antes del evento. Con menos de 7 días la reserva ya no admite cancelación
// del cliente (`cancellable: false`). Los porcentajes del tramo intermedio
// siguen siendo PROPUESTA, pendiente de aprobación.
//
// Siempre sin perjuicio del derecho de arrepentimiento: si la cancelación
// entra en ese plazo legal, se reembolsa todo lo que corresponda por ley y esta
// escala no se aplica.
export const CLIENT_CANCELLATION_SCALE = Object.freeze([
  Object.freeze({
    minDays: 31, maxDays: null, cancellable: true,
    label: '31 días o más antes del evento',
    refund: 'Te devolvemos el total que pagaste.',
  }),
  Object.freeze({
    minDays: COMMERCIAL.clientCancellationMinDays, maxDays: 30, cancellable: true,
    label: `Entre ${COMMERCIAL.clientCancellationMinDays} y 30 días antes`,
    refund: `Se retiene el ${COMMERCIAL.clientRetainedPercentMid} % del total y te devolvemos el ${100 - COMMERCIAL.clientRetainedPercentMid} %.`,
  }),
  Object.freeze({
    minDays: 0, maxDays: COMMERCIAL.clientCancellationMinDays - 1, cancellable: false,
    label: `Menos de ${COMMERCIAL.clientCancellationMinDays} días antes (incluye el día del evento)`,
    refund: 'Ya no se puede cancelar la reserva y no hay reembolso, salvo derecho de arrepentimiento en plazo, cancelación del proveedor o un hecho fuera de control.',
  }),
]);

/** Tramo de la escala del cliente. Solo documental (tests), como penaltyTierFor. */
export function clientCancellationTierFor(days) {
  if (!Number.isInteger(days)) throw new TypeError('La escala se mide en días corridos enteros');
  if (days < 0) return null;
  return CLIENT_CANCELLATION_SCALE.find(
    (t) => days >= t.minDays && (t.maxDays === null || days <= t.maxDays)
  ) ?? null;
}
