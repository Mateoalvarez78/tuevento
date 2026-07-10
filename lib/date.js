// ─── UTILIDAD GLOBAL DE FECHAS ────────────────────────────────────────────────
// Única fuente de verdad para parsear/formatear fechas en toda la app.
// Regla: nunca mostrar "Invalid Date" — si algo no se puede parsear, se
// devuelve el fallback ("-" por defecto).

const LOCALE = 'es-UY';

/**
 * Parsea cualquier valor "fecha-ish" que puede llegar del backend o de un
 * <input type="date"> a un objeto Date válido, o null si no se puede.
 * Acepta: Date, "YYYY-MM-DD", timestamp ISO completo, o un Date ya
 * "stringificado" por error (ej. "Wed Jul 15 2026 00:00:00 GMT...") — este
 * último caso es justamente el que producía "Invalid Date" antes.
 */
export function parseApiDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string') return null;

  // "YYYY-MM-DD" puro → anclar a mediodía local para evitar corrimientos de
  // huso horario (evita que "2026-07-18" se muestre como 17/07 en UTC-3).
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnly.test(value)) {
    const d = new Date(`${value}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Parsea una hora "HH:mm" o "HH:mm:ss" (columna TIME de Postgres). */
export function parseApiTime(value) {
  if (!value || typeof value !== 'string') return null;
  const m = value.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** dd/mm/yyyy */
export function formatDate(value) {
  const d = parseApiDate(value);
  if (!d) return null;
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** dd/mm/yyyy HH:mm */
export function formatDateTime(value, time) {
  const datePart = formatDate(value);
  if (!datePart) return null;
  const timePart = time ? parseApiTime(time) : (parseApiDate(value)
    ? parseApiDate(value).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
    : null);
  return timePart ? `${datePart} ${timePart}` : datePart;
}

/** HH:mm */
export function formatTime(value) {
  return parseApiTime(value);
}

/** yyyy-mm-dd — para el value de un <input type="date">. */
export function formatDateForInput(value) {
  const d = parseApiDate(value);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Como formatDate, pero nunca devuelve null/"Invalid Date" — devuelve fallback. */
export function safeFormatDate(value, fallback = '-') {
  return formatDate(value) || fallback;
}

/** Como formatDateTime, pero nunca devuelve null/"Invalid Date" — devuelve fallback. */
export function safeFormatDateTime(value, time, fallback = '-') {
  return formatDateTime(value, time) || fallback;
}

/** dd/mm/yyyy con día y mes abreviados por nombre, ej. "18 jul 2026". */
export function formatShortDate(value, fallback = '-') {
  const d = parseApiDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "hace 2 días" / "hoy" / "ayer", con fallback seguro. */
export function formatRelativeDate(value, fallback = '-') {
  const d = parseApiDate(value);
  if (!d) return fallback;
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays > 0 && diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays >= 7 && diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays >= 30 && diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
  return formatShortDate(value, fallback);
}
