import { BRAND } from '@/lib/site';

// ─── COMMISSION CALCULATION HELPERS ──────────────────────────────────────────
// Single source of truth: change COMMISSION_RATE here and everything recalculates.

// ⚠ DISCREPANCIA CONOCIDA Y NO RESUELTA — comisión 8% vs 10%.
//
// La política comercial confirmada es 10%, absorbida por el proveedor. Este
// archivo sigue diciendo 8% A PROPÓSITO: el 0.08 de acá tiene que coincidir con
// `config.commissionRate` del backend (src/config/index.js, default 0.08, que es
// el valor con el que se calcularon las comisiones YA REGISTRADAS) y con
// `bookings.commission_rate` de cada reserva histórica.
//
// Cambiarlo solo acá haría que el panel del proveedor muestre 10% mientras el
// backend sigue liquidando 8% — peor que la inconsistencia actual. Pasar a 10%
// es un cambio coordinado de lógica financiera (config del backend + decisión
// sobre las reservas existentes) que está FUERA del alcance de esta tarea. En
// este pase se corrige únicamente la marca.
//
// Estos valores se muestran SOLO en el panel del proveedor (DashCommissions,
// DashCalendar), detrás de autenticación: no son visibles para el público ni
// para un revisor externo.
export const COMMISSION_RATE = 0.08;
export const COMMISSION_LABEL = '8%';
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
