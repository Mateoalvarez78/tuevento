// ─── FORMATTERS ───────────────────────────────────────────────────────────────
// Pure utility functions for formatting data for display.
// Framework-agnostic — safe to use in server and client components.

const LOCALE = 'es-UY';

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return `$${Number(amount).toLocaleString(LOCALE)}`;
};

export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return '—';
  const defaults = { day: '2-digit', month: 'long', year: 'numeric' };
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(LOCALE, { ...defaults, ...options });
};

export const formatShortDate = (dateStr) =>
  formatDate(dateStr, { day: '2-digit', month: 'short', year: 'numeric' });

export const formatMonthYear = (dateStr) =>
  formatDate(dateStr, { month: 'long', year: 'numeric' });

export const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '—';
  const then = new Date(dateStr);
  const now = new Date();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
  return formatShortDate(dateStr);
};

export const formatPhone = (phone) => phone || '—';

export const formatRating = (rating, count) => {
  if (!rating) return '—';
  return `${Number(rating).toFixed(1)}★ (${count ?? 0})`;
};

export const generateRequestNumber = () =>
  `TE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

export const slugify = (str) =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
