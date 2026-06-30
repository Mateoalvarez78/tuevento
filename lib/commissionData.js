// ─── COMMISSION MODULE DATA ───────────────────────────────────────────────────
// Almacena montos brutos (ingresos brutos en pesos uruguayos).
// Comisión y neto se calculan dinámicamente desde commissionHelpers.

import { calcCommission, calcNet } from './commissionHelpers';

// ── Datos mensuales (Jul 2025 – Jun 2026) ─────────────────────────────────────
// Mismos valores que MONTHLY_DATA.revenue × 1000 para consistencia de pantallas.
const MONTH_LABELS  = ['Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'];
const MONTHLY_GROSS = [
  48000, 62000, 79000, 71000, 96000, 87000,
  73000, 81000, 108000, 94000, 138000, 195000,
];

export const MONTHLY_COMMISSION_DATA = MONTH_LABELS.map((month, i) => {
  const gross = MONTHLY_GROSS[i];
  return { month, gross, commission: calcCommission(gross), net: calcNet(gross) };
});

// ── Comisión por servicio ──────────────────────────────────────────────────────
// Distribución anual. Suma ≈ total anual de MONTHLY_GROSS.
const SERVICE_GROSS_MAP = [
  { name: 'Catering Premium Bodas', gross: 485000 },
  { name: 'Cumpleaños Adultos',     gross: 218000 },
  { name: 'Cena de Gala',           gross: 195000 },
  { name: 'Almuerzo Corporativo',   gross: 142000 },
  { name: 'Catering Infantil',      gross:  92000 },
];

export const COMMISSION_BY_SERVICE = SERVICE_GROSS_MAP.map((s) => ({
  ...s,
  commission: calcCommission(s.gross),
  net:        calcNet(s.gross),
}));

// ── Historial de liquidaciones ────────────────────────────────────────────────
const PAYOUT_RAW = [
  { id:'py1', date:'05 Jul 2026', reservationsCount:  5, grossAmount:  58000, status:'pending',    note:'Reservas confirmadas de junio 2026' },
  { id:'py2', date:'05 Jun 2026', reservationsCount: 18, grossAmount: 138000, status:'paid',       note:'Ciclo mayo 2026' },
  { id:'py3', date:'05 May 2026', reservationsCount: 16, grossAmount:  94000, status:'paid',       note:'Ciclo abril 2026' },
  { id:'py4', date:'05 Abr 2026', reservationsCount: 20, grossAmount: 108000, status:'paid',       note:'Ciclo marzo 2026' },
  { id:'py5', date:'05 Mar 2026', reservationsCount: 17, grossAmount:  81000, status:'paid',       note:'Ciclo febrero 2026' },
  { id:'py6', date:'05 Feb 2026', reservationsCount: 14, grossAmount:  73000, status:'paid',       note:'Ciclo enero 2026' },
];

export const PAYOUT_HISTORY = PAYOUT_RAW.map((p) => ({
  ...p,
  commissionAmount: calcCommission(p.grossAmount),
  netAmount:        calcNet(p.grossAmount),
}));

// ── Config de chips de estado de pago ─────────────────────────────────────────
export const PAYMENT_STATUS_CONFIG = {
  paid:       { label: 'Pagado',       bg: 'bg-emerald-50', text: 'text-emerald-700', dot: '#0BB885'  },
  pending:    { label: 'Pendiente',    bg: 'bg-amber-50',   text: 'text-amber-700',   dot: '#F5A623'  },
  processing: { label: 'Procesando',  bg: 'bg-blue-50',    text: 'text-blue-700',    dot: '#2563EB'  },
  retained:   { label: 'Retenido',    bg: 'bg-orange-50',  text: 'text-orange-700',  dot: '#F97316'  },
  refunded:   { label: 'Reembolsado', bg: 'bg-gray-100',   text: 'text-gray-500',    dot: '#9CA3AF'  },
};

// Estado de pago por booking (clave = id de booking)
export const BOOKING_PAYMENT_STATUS = {
  bk1: 'pending',    bk2: 'pending',    bk3: 'processing', bk4: 'pending',
  bk5: 'pending',    bk6: 'pending',    bk7: 'pending',    bk8: 'pending',
  bk9: 'pending',    bk10: 'pending',
  bk11: 'paid', bk12: 'paid', bk13: 'paid',
  bk14: 'paid', bk15: 'paid', bk16: 'paid',
};

// Fecha estimada de depósito por booking
export const BOOKING_DEPOSIT_DATE = {
  bk1: '05 Jul 2026', bk2: '05 Jul 2026', bk3: '05 Jul 2026', bk4: '05 Jul 2026',
  bk5: '05 Jul 2026', bk6: '05 Jul 2026', bk7: '05 Ago 2026', bk8: '05 Ago 2026',
  bk9: '05 Ago 2026', bk10: '05 Ago 2026',
  bk11: '05 Jun 2026', bk12: '05 Jun 2026', bk13: '05 Jun 2026',
  bk14: '05 Jun 2026', bk15: '05 Jun 2026', bk16: '05 Jun 2026',
};
