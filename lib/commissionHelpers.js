import { BRAND } from '@/lib/site';

// ─── COMMISSION CALCULATION HELPERS ──────────────────────────────────────────
// Single source of truth: change COMMISSION_RATE here and everything recalculates.

// Comisión ÚNICA de Eventonow para todos los proveedores: 10 % (decisión
// comercial del 20/11/2026, ADR 0004 del backend). Debe coincidir con
// COMMISSION_RATE de eventonow-back/src/utils/constants.js. Las reservas ya
// creadas guardan su propia tasa (bookings.commission_rate): para importes
// reales se usa lo que manda el backend; esto es solo para textos y
// estimaciones del panel.
export const COMMISSION_RATE = 0.1;
export const COMMISSION_LABEL = '10 %';
export const PLATFORM_NAME = BRAND;
export const COMMISSION_DESCRIPTION =
  `${BRAND} cobra una comisión del ${COMMISSION_LABEL} por uso de la plataforma, procesamiento de pagos, visibilidad en el marketplace y gestión integral de reservas.`;

/** Raw commission on a gross amount. Rounded to nearest peso. */
export function calcCommission(gross) {
  return Math.round(gross * COMMISSION_RATE);
}

/** Net amount after platform commission. Rounded to nearest peso. */
export function calcNet(gross) {
  return Math.round(gross * (1 - COMMISSION_RATE));
}

/** All three values for a single booking amount. */
export function calcBookingFinancials(amount) {
  return {
    gross:      amount,
    commission: calcCommission(amount),
    net:        calcNet(amount),
  };
}

/**
 * Aggregate totals from a list of bookings.
 * Only counts confirmed + completed bookings.
 */
export function calcTotalsFromBookings(bookings) {
  const active = bookings.filter((b) => ['confirmed', 'completed'].includes(b.status));
  const totalGross      = active.reduce((s, b) => s + b.amount, 0);
  const totalCommission = calcCommission(totalGross);
  const totalNet        = calcNet(totalGross);
  const count           = active.length;
  const avgNet          = count > 0 ? Math.round(totalNet / count) : 0;
  const avgCommission   = count > 0 ? Math.round(totalCommission / count) : 0;
  return { totalGross, totalCommission, totalNet, avgNet, avgCommission, count };
}

/** Compact currency format — $2.3M, $187K, $450 */
export function fmtUYU(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString('es-UY')}`;
}

/** Full locale-formatted currency — $2.340.000 */
export function fmtFull(n) {
  return `$${n.toLocaleString('es-UY')}`;
}

/** Percentage trend between two values (positive = up). */
export function trendPct(current, prev) {
  if (!prev) return 0;
  return ((current - prev) / prev) * 100;
}
