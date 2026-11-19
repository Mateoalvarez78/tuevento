// ─── PARÁMETROS COMERCIALES DE LOS DOCUMENTOS LEGALES ────────────────────────
//
// Fuente única de los números que citan las Condiciones para proveedores y la
// Política de cancelaciones del cliente. Existe para que ningún documento tenga
// porcentajes o plazos escritos a mano: si una decisión cambia, cambia acá y
// todos los textos se actualizan.
//
// ⚠ NADA DE ESTE ARCHIVO SE APLICA A RESERVAS. Solo lo importan las páginas
// legales (test). La lógica de cobro vive en el backend (payments/
// payment-policy.js en feat/dlocal-phase-2) y hoy usa otros valores: seña 30 %,
// saldo a 7 días fijos, comisión 8 %. Alinear esos valores es un cambio
// coordinado de lógica financiera, aparte de estos documentos.
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
  depositPercent: 20,
  balancePercent: 80,
  /** Días antes del evento entre los que el proveedor elige el vencimiento del saldo. */
  balanceDueOptionsDays: Object.freeze([3, 7, 14, 30]),
  balanceDueDefaultDays: 7,
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

// ── Pago de la seña ────────────────────────────────────────────────────────

/** Horas que tiene el cliente para pagar la seña después de que el proveedor acepta. */
export const DEPOSIT_PAYMENT_HOURS = 48;

// ── Cancelación por parte del CLIENTE (PROPUESTA, pendiente de aprobación) ──
//
// Misma medida que la escala de proveedores: días corridos enteros entre la
// fecha en que el cliente presenta la cancelación y la fecha del evento.
// Política ÚNICA de plataforma (no la elige cada proveedor) — decisión
// recomendada para la primera versión, a confirmar.
//
// Siempre sin perjuicio del derecho de arrepentimiento: si la cancelación
// entra en ese plazo legal, se reembolsa todo lo que corresponda por ley y esta
// escala no se aplica.
export const CLIENT_CANCELLATION_SCALE = Object.freeze([
  Object.freeze({ minDays: 31, maxDays: null, label: '31 días o más antes del evento', refund: 'Reembolso total de lo pagado.' }),
  Object.freeze({ minDays: 7,  maxDays: 30,   label: 'Entre 7 y 30 días antes',       refund: 'Se retiene la seña. Se reembolsa lo que hayas pagado del saldo.' }),
  Object.freeze({ minDays: 0,  maxDays: 6,    label: 'Entre 0 y 6 días antes',        refund: 'Se retiene la seña y la mitad del saldo. Se reembolsa la otra mitad del saldo.' }),
]);

/** Tramo de la escala del cliente. Solo documental (tests), como penaltyTierFor. */
export function clientCancellationTierFor(days) {
  if (!Number.isInteger(days)) throw new TypeError('La escala se mide en días corridos enteros');
  if (days < 0) return null;
  return CLIENT_CANCELLATION_SCALE.find(
    (t) => days >= t.minDays && (t.maxDays === null || days <= t.maxDays)
  ) ?? null;
}
