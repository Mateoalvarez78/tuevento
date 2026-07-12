// ─── FORMATTERS ───────────────────────────────────────────────────────────────
// Pure utility functions for formatting data for display.
// Framework-agnostic — safe to use in server and client components.

const LOCALE = 'es-UY';

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return `$${Number(amount).toLocaleString(LOCALE)}`;
};

export const formatRating = (rating, count) => {
  if (!rating) return '—';
  return `${Number(rating).toFixed(1)}★ (${count ?? 0})`;
};
