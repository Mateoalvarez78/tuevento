// ─── FORMATTERS ───────────────────────────────────────────────────────────────
// Pure utility functions for formatting data for display.
// Framework-agnostic — safe to use in server and client components.

const LOCALE = 'es-UY';

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return `$${Number(amount).toLocaleString(LOCALE)}`;
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
