'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Percent, Info,
  Wallet, BarChart3, Calendar, ChevronDown, Eye,
  ArrowDownRight, ArrowUpRight, Check,
} from 'lucide-react';
import { BOOKINGS } from '@/lib/proveedorDashboardData';
import {
  COMMISSION_RATE, COMMISSION_LABEL, COMMISSION_DESCRIPTION,
  calcBookingFinancials, calcTotalsFromBookings, fmtUYU, fmtFull, trendPct,
} from '@/lib/commissionHelpers';
import {
  MONTHLY_COMMISSION_DATA, COMMISSION_BY_SERVICE, PAYOUT_HISTORY,
  PAYMENT_STATUS_CONFIG, BOOKING_PAYMENT_STATUS, BOOKING_DEPOSIT_DATE,
} from '@/lib/commissionData';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// Current month = Jun (index 11), prev = May (index 10)
const CUR  = MONTHLY_COMMISSION_DATA[11];
const PREV = MONTHLY_COMMISSION_DATA[10];

// ─── TOOLTIP (card info hover) ────────────────────────────────────────────────
function InfoTooltip({ text }) {
  return (
    <div className="group relative inline-flex">
      <Info size={13} className="text-gray-300 hover:text-gray-400 cursor-default transition-colors" />
      <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 text-white text-xs leading-relaxed px-3 py-2.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {text}
        <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

// ─── TREND BADGE ─────────────────────────────────────────────────────────────
function TrendBadge({ pct, inverse = false }) {
  const up = pct >= 0;
  const good = inverse ? !up : up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${good ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
      <Icon size={10} />
      {up ? '+' : ''}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

// ─── RECHARTS CUSTOM TOOLTIP ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-gray-700">
      <p className="font-semibold text-gray-300 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span style={{ color: p.fill || p.color }}>{p.name}</span>
          <span className="font-bold">{fmtUYU(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SECTION CARD WRAPPER ─────────────────────────────────────────────────────
function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.div>
  );
}

// ─── 1. SUMMARY CARDS ─────────────────────────────────────────────────────────
function SummaryCards() {
  // Annual totals from all 12 months
  const annualGross      = MONTHLY_COMMISSION_DATA.reduce((s, m) => s + m.gross, 0);
  const annualCommission = MONTHLY_COMMISSION_DATA.reduce((s, m) => s + m.commission, 0);

  // Per-booking avg from visible BOOKINGS
  const { avgNet } = calcTotalsFromBookings(BOOKINGS);

  const CARDS = [
    {
      key: 'gross',
      label: 'Facturación bruta',
      desc: 'Total facturado este mes',
      value: fmtUYU(CUR.gross),
      fullValue: fmtFull(CUR.gross),
      trend: trendPct(CUR.gross, PREV.gross),
      inverse: false,
      icon: <DollarSign size={16} className="text-blue-600" />,
      iconBg: 'bg-blue-50',
      tooltip: 'Suma de todos los servicios confirmados o completados en el mes, antes de descontar la comisión de TuEvento.',
    },
    {
      key: 'commission',
      label: 'Comisión TuEvento',
      desc: `${COMMISSION_LABEL} sobre facturación`,
      value: fmtUYU(CUR.commission),
      fullValue: fmtFull(CUR.commission),
      trend: trendPct(CUR.commission, PREV.commission),
      inverse: true,
      icon: <Percent size={16} className="text-orange-600" />,
      iconBg: 'bg-orange-50',
      tooltip: COMMISSION_DESCRIPTION,
    },
    {
      key: 'net',
      label: 'Ingreso neto',
      desc: 'Lo que recibís este mes',
      value: fmtUYU(CUR.net),
      fullValue: fmtFull(CUR.net),
      trend: trendPct(CUR.net, PREV.net),
      inverse: false,
      icon: <ArrowUpRight size={16} className="text-emerald-600" />,
      iconBg: 'bg-emerald-50',
      tooltip: 'Facturación bruta menos la comisión del 8% de TuEvento. Este es el monto que recibirás en tu depósito.',
    },
    {
      key: 'avgTicket',
      label: 'Ticket neto promedio',
      desc: 'Por reserva confirmada',
      value: fmtUYU(avgNet),
      fullValue: fmtFull(avgNet),
      trend: trendPct(avgNet, Math.round(PREV.net / 48)),
      inverse: false,
      icon: <BarChart3 size={16} className="text-violet-600" />,
      iconBg: 'bg-violet-50',
      tooltip: 'Ingreso neto promedio por reserva, calculado dividiendo el ingreso neto del mes entre el número de reservas confirmadas.',
    },
    {
      key: 'annualCommission',
      label: 'Comisiones del año',
      desc: 'Acumulado 12 meses',
      value: fmtUYU(annualCommission),
      fullValue: fmtFull(annualCommission),
      trend: null,
      inverse: true,
      icon: <Calendar size={16} className="text-primary" />,
      iconBg: 'bg-primary-light',
      tooltip: `Total acumulado de comisiones cobradas por TuEvento en los últimos 12 meses. Representa el ${COMMISSION_LABEL} del total bruto de ${fmtUYU(annualGross)}.`,
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {CARDS.map((c) => (
        <motion.div key={c.key} variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center`}>{c.icon}</div>
            {c.trend !== null
              ? <TrendBadge pct={c.trend} inverse={c.inverse} />
              : <InfoTooltip text={c.tooltip} />}
          </div>
          <div className="mb-1">
            <p className="text-xs text-gray-400 font-medium leading-tight">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{c.value}</p>
          </div>
          <p className="text-[11px] text-gray-400 leading-tight">{c.desc}</p>
          {c.trend !== null && (
            <div className="mt-1.5 flex items-center justify-between">
              <InfoTooltip text={c.tooltip} />
              <span className="text-[10px] text-gray-300">vs mes ant.</span>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── 2. BRUTO vs NETO (STACKED BAR) ──────────────────────────────────────────
function GrossVsNetChart() {
  return (
    <Card
      title="Bruto vs. Neto por mes"
      subtitle="Facturación bruta con comisión y neto diferenciados"
      action={
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Neto</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />Comisión</span>
        </div>
      }
    >
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={MONTHLY_COMMISSION_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey="net"        name="Neto proveedor"   stackId="s" fill="#0BB885" radius={[0, 0, 4, 4]} maxBarSize={28} />
            <Bar dataKey="commission" name="Comisión TuEvento" stackId="s" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Junio (mes actual): <strong className="text-gray-800">{fmtUYU(CUR.gross)} bruto</strong></span>
        <span>Neto: <strong className="text-emerald-600">{fmtUYU(CUR.net)}</strong> · Comisión: <strong className="text-orange-500">-{fmtUYU(CUR.commission)}</strong></span>
      </div>
    </Card>
  );
}

// ─── 3. DISTRIBUCIÓN DEL DINERO (PIE) ────────────────────────────────────────
function MoneyDistributionPie() {
  const annualGross      = MONTHLY_COMMISSION_DATA.reduce((s, m) => s + m.gross, 0);
  const annualCommission = MONTHLY_COMMISSION_DATA.reduce((s, m) => s + m.commission, 0);
  const annualNet        = MONTHLY_COMMISSION_DATA.reduce((s, m) => s + m.net, 0);
  const pieData = [
    { name: 'Ingreso neto',       value: annualNet,        color: '#0BB885' },
    { name: 'Comisión TuEvento',  value: annualCommission, color: '#F97316' },
  ];
  return (
    <Card title="Distribución del dinero" subtitle="Últimos 12 meses">
      <div className="flex items-center gap-4">
        <div style={{ width: 150, height: 150, flexShrink: 0 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={68} dataKey="value" strokeWidth={2} stroke="#fff">
                {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmtUYU(v), '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          {pieData.map((d) => {
            const pct = ((d.value / annualGross) * 100).toFixed(0);
            return (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-gray-600">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: d.color }}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: d.color }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{fmtUYU(d.value)}</p>
              </div>
            );
          })}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[11px] text-gray-400">Total bruto: <strong className="text-gray-700">{fmtUYU(annualGross)}</strong></p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── 4. EVOLUCIÓN DE COMISIONES (LINE) ───────────────────────────────────────
function CommissionEvolutionChart() {
  return (
    <Card
      title="Evolución de comisiones"
      subtitle="Comisión mensual descontada por TuEvento (últimos 12 meses)"
      action={<span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">8% fijo</span>}
    >
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <LineChart data={MONTHLY_COMMISSION_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <defs>
              <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="commission" name="Comisión TuEvento" stroke="#F97316" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#F97316' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100">
        <p className="text-xs text-orange-700 leading-relaxed">
          <strong>¿Por qué es fija?</strong> La comisión del 8% crece en términos absolutos a medida que facturás más — es la manera en que TuEvento te acompaña: si vos ganás más, la plataforma también.
        </p>
      </div>
    </Card>
  );
}

// ─── 5. COMISIÓN POR SERVICIO ─────────────────────────────────────────────────
function CommissionByServiceChart() {
  const max = COMMISSION_BY_SERVICE[0]?.commission || 1;
  return (
    <Card title="Comisión por servicio" subtitle="Servicios que más comisión generan para la plataforma">
      <div className="space-y-3.5">
        {COMMISSION_BY_SERVICE.map((s, i) => {
          const pct = (s.commission / max) * 100;
          return (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-700">{s.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-gray-400">Bruto {fmtUYU(s.gross)}</span>
                  <span className="text-sm font-bold text-orange-600">{fmtUYU(s.commission)}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #F97316, #E84D2C)' }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 text-right">Neto: {fmtUYU(s.net)}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── 6. TABLA DE RESERVAS CON DESGLOSE ───────────────────────────────────────
function CommissionBookingsTable() {
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;
  const total = Math.ceil(BOOKINGS.length / PER_PAGE);
  const paginated = BOOKINGS.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const STATUS_PILL = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending:   'bg-amber-50   text-amber-700   border-amber-200',
    completed: 'bg-blue-50    text-blue-700    border-blue-200',
    cancelled: 'bg-red-50     text-red-500     border-red-200',
  };
  const STATUS_LABEL = { confirmed:'Confirmada', pending:'Pendiente', completed:'Finalizada', cancelled:'Cancelada' };

  return (
    <Card title="Detalle por reserva" subtitle="Desglose bruto · comisión · neto por cada servicio">
      <div className="overflow-x-auto -mx-5">
        <table className="w-full">
          <thead>
            <tr className="border-y border-gray-100 bg-gray-50/60">
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Cliente</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3 hidden md:table-cell">Servicio</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3 hidden sm:table-cell">Estado</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3">Bruto</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3 hidden sm:table-cell">Comisión 8%</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3">Neto</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3 hidden md:table-cell">Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((b) => {
              const { gross, commission, net } = calcBookingFinancials(b.amount);
              const payStatus = BOOKING_PAYMENT_STATUS[b.id] || 'pending';
              const payConf   = PAYMENT_STATUS_CONFIG[payStatus];
              const depositDt = BOOKING_DEPOSIT_DATE[b.id] || '—';
              return (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={b.clientAvatar} alt={b.clientName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800 leading-tight">{b.clientName}</p>
                        <p className="text-[10px] text-gray-400">{new Date(b.date + 'T12:00:00').toLocaleDateString('es-UY', { day:'2-digit', month:'short' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <p className="text-xs text-gray-700">{b.service}</p>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_PILL[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </td>
                  {/* BRUTO */}
                  <td className="px-3 py-3 text-right">
                    <p className="text-xs font-semibold text-gray-700">{fmtUYU(gross)}</p>
                  </td>
                  {/* COMISIÓN */}
                  <td className="px-3 py-3 text-right hidden sm:table-cell">
                    <p className="text-xs font-bold text-orange-500">-{fmtUYU(commission)}</p>
                  </td>
                  {/* NETO */}
                  <td className="px-3 py-3 text-right">
                    <p className="text-sm font-bold text-emerald-600">{fmtUYU(net)}</p>
                  </td>
                  {/* PAYMENT STATE */}
                  <td className="px-3 py-3 text-right hidden md:table-cell">
                    <div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${payConf.bg} ${payConf.text}`}>
                        {payConf.label}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5 text-right">{depositDt}</p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
          <p className="text-xs text-gray-400">Página {page} de {total}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary/30 disabled:opacity-30 transition-colors">
              <ChevronDown size={13} className="rotate-90" />
            </button>
            <button onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={page === total} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary/30 disabled:opacity-30 transition-colors">
              <ChevronDown size={13} className="-rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* Table totals bar */}
      {(() => {
        const { totalGross, totalCommission, totalNet, count } = calcTotalsFromBookings(BOOKINGS);
        return (
          <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Reservas activas:</span>
              <strong className="text-gray-800">{count}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Bruto total:</span>
              <strong className="text-gray-800">{fmtUYU(totalGross)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Comisiones:</span>
              <strong className="text-orange-500">-{fmtUYU(totalCommission)}</strong>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-gray-500 font-medium">Neto a cobrar:</span>
              <strong className="text-emerald-600 text-sm">{fmtUYU(totalNet)}</strong>
            </div>
          </div>
        );
      })()}
    </Card>
  );
}

// ─── 7. PAGOS Y DEPÓSITOS ─────────────────────────────────────────────────────
function PayoutsSection() {
  const pending    = PAYOUT_HISTORY.find((p) => p.status === 'pending');
  const totalPaid  = PAYOUT_HISTORY.filter((p) => p.status === 'paid').reduce((s, p) => s + p.netAmount, 0);
  const totalComm  = PAYOUT_HISTORY.filter((p) => p.status === 'paid').reduce((s, p) => s + p.commissionAmount, 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Pending payout card */}
      <Card className="xl:col-span-1">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white mb-4">
          <p className="text-xs text-gray-400 mb-1">Próximo depósito</p>
          <p className="text-3xl font-black">{fmtUYU(pending?.netAmount || 0)}</p>
          <div className="flex items-center gap-2 mt-2">
            <Calendar size={13} className="text-emerald-400" />
            <p className="text-sm text-emerald-400 font-semibold">{pending?.date}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Bruto procesado</span>
              <span className="font-semibold">{fmtUYU(pending?.grossAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Comisión TuEvento (8%)</span>
              <span className="text-orange-400 font-semibold">-{fmtUYU(pending?.commissionAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1.5 border-t border-gray-700">
              <span className="font-bold text-white">Neto a depositar</span>
              <span className="font-black text-emerald-400">{fmtUYU(pending?.netAmount || 0)}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 leading-tight">Pagado total</p>
            <p className="text-base font-bold text-emerald-700">{fmtUYU(totalPaid)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 leading-tight">Comisiones ret.</p>
            <p className="text-base font-bold text-orange-600">{fmtUYU(totalComm)}</p>
          </div>
        </div>
        <div className="mt-3 bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100">
          <p className="text-xs text-blue-700 leading-relaxed">
            Los depósitos se procesan automáticamente el <strong>5 de cada mes</strong>. Las reservas canceladas no generan pago.
          </p>
        </div>
      </Card>

      {/* Deposit history table */}
      <Card title="Historial de depósitos" subtitle="Últimos 6 ciclos de pago" className="xl:col-span-2">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full">
            <thead>
              <tr className="border-y border-gray-100 bg-gray-50/60">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-5 py-2.5">Fecha</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-3 py-2.5 hidden sm:table-cell">Reservas</th>
                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase px-3 py-2.5 hidden md:table-cell">Bruto</th>
                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase px-3 py-2.5">Comisión</th>
                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase px-3 py-2.5">Neto dep.</th>
                <th className="text-center text-[11px] font-semibold text-gray-400 uppercase px-3 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {PAYOUT_HISTORY.map((p) => {
                const cfg = PAYMENT_STATUS_CONFIG[p.status];
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-gray-800">{p.date}</p>
                      <p className="text-[10px] text-gray-400 hidden sm:block">{p.note}</p>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <p className="text-xs font-medium text-gray-600 text-center">{p.reservationsCount}</p>
                    </td>
                    <td className="px-3 py-3 text-right hidden md:table-cell">
                      <p className="text-xs text-gray-600 font-medium">{fmtUYU(p.grossAmount)}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <p className="text-xs font-bold text-orange-500">-{fmtUYU(p.commissionAmount)}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <p className="text-sm font-bold text-emerald-600">{fmtUYU(p.netAmount)}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── 8. TRANSPARENCY BANNER ───────────────────────────────────────────────────
function TransparencyBanner() {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 flex items-center gap-5">
      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
        <Percent size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm mb-0.5">Comisión de plataforma</p>
        <p className="text-gray-400 text-xs leading-relaxed">{COMMISSION_DESCRIPTION}</p>
      </div>
      <div className="shrink-0 text-right hidden sm:block">
        <p className="text-3xl font-black text-white">8%</p>
        <p className="text-xs text-gray-400">fijo por reserva</p>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function DashCommissions() {
  return (
    <div className="space-y-5">
      <TransparencyBanner />
      <SummaryCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2"><GrossVsNetChart /></div>
        <MoneyDistributionPie />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CommissionEvolutionChart />
        <CommissionByServiceChart />
      </div>

      <CommissionBookingsTable />
      <PayoutsSection />
    </div>
  );
}
