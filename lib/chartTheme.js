// ─── PALETA DE GRÁFICOS (Recharts) ───────────────────────────────────────────
// Recharts no acepta clases Tailwind en sus props de color (stroke/fill), así
// que estos valores no pueden vivir solo en CSS — pero SÍ pueden tener una
// única fuente en JS en vez de retipearse a mano en 5 archivos distintos.
// Los valores con equivalente semántico repiten EXACTO el hex ya definido en
// el @theme de app/globals.css (no son colores nuevos, es la misma paleta).

export const CHART_COLORS = {
  primary: '#E84D2C',   // --color-primary
  success: '#0BB885',   // --color-success
  warning: '#F5A623',   // --color-warning
  info: '#2563EB',      // --color-info
  danger: '#DC2626',    // --color-danger
  // Colores de gráfico sin token semántico equivalente (paleta secundaria ya
  // existente para distinguir series en charts — se centralizan, no se inventan).
  commission: '#F97316',
  chartRed: '#EF4444',
  chartAmber: '#F59E0B',
  chartBlue: '#3B82F6',
  chartGray: '#6B7280',
};

export const CHART_AXIS = { fontSize: 11, fill: '#9CA3AF' };
export const CHART_GRID_LIGHT = '#f3f4f6';
export const CHART_GRID_DARK = '#1f2937';

export const CHART_TOOLTIP_LIGHT = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  fontSize: 12,
};

export const CHART_TOOLTIP_DARK = {
  background: '#111827',
  border: '1px solid #374151',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
};
