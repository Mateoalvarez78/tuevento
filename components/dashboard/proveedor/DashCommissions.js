'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, Percent,
  BarChart3, Calendar, AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import {
  COMMISSION_LABEL, COMMISSION_DESCRIPTION, fmtUYU, fmtFull, trendPct,
} from '@/lib/commissionHelpers';
import { CHART_AXIS, CHART_GRID_LIGHT, CHART_COLORS } from '@/lib/chartTheme';
import { providerDashboardService } from '@/services/providerDashboardService';
import { safeFormatDate } from '@/lib/date';
import MetricCard from '@/components/MetricCard';
import InfoTooltip from '@/components/Tooltip';
import Card from '@/components/Card';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const STATUS_PILL = {
  accepted:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:   'bg-amber-50   text-amber-700   border-amber-200',
  completed: 'bg-blue-50    text-blue-700    border-blue-200',
  cancelled: 'bg-red-50     text-red-500     border-red-200',
  rejected:  'bg-red-50     text-red-500     border-red-200',
};
const STATUS_LABEL = { accepted: 'Confirmada', pending: 'Pendiente', completed: 'Finalizada', cancelled: 'Cancelada', rejected: 'Rechazada' };

// Tooltip claro (misma superficie que el resto del dashboard de proveedor —
// antes este archivo tenía su propia versión oscura, inconsistente con
// ProviderOverview.js, que usa un tooltip claro para los mismos gráficos).
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white text-gray-900 text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-gray-100">
      <p className="font-semibold text-gray-500 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span style={{ color: p.fill || p.color }}>{p.name}</span>
          <span className="font-bold">{fmtUYU(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, action, children, className = '' }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <Card padding="md" className={className}>
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
      </Card>
    </motion.div>
  );
}

function SummaryCards({ byMonth, summary }) {
  const cur  = byMonth[byMonth.length - 1] || { gross: 0, commission: 0, net: 0 };
  const prev = byMonth[byMonth.length - 2] || { gross: 0, commission: 0, net: 0 };
  const annualGross      = byMonth.reduce((s, m) => s + m.gross, 0);
  const annualCommission = byMonth.reduce((s, m) => s + m.commission, 0);
  const avgNet = cur.count > 0 ? Math.round(cur.net / cur.count) : 0;
  const prevAvgNet = prev.count > 0 ? Math.round(prev.net / prev.count) : 0;

  const CARDS = [
    {
      key: 'gross', label: 'Facturación bruta', desc: 'Total facturado este mes',
      value: fmtUYU(cur.gross), trend: trendPct(cur.gross, prev.gross), inverse: false,
      icon: DollarSign, tone: 'blue',
      tooltip: 'Suma de reservas aceptadas o completadas este mes, antes de descontar la comisión de Eventonow.',
    },
    {
      key: 'commission', label: 'Comisión Eventonow', desc: `${COMMISSION_LABEL} sobre facturación`,
      value: fmtUYU(cur.commission), trend: trendPct(cur.commission, prev.commission), inverse: true,
      icon: Percent, tone: 'orange',
      tooltip: COMMISSION_DESCRIPTION,
    },
    {
      key: 'net', label: 'Ingreso neto', desc: 'Lo que recibís este mes',
      value: fmtUYU(cur.net), trend: trendPct(cur.net, prev.net), inverse: false,
      icon: ArrowUpRight, tone: 'emerald',
      tooltip: 'Facturación bruta menos la comisión de Eventonow.',
    },
    {
      key: 'avgTicket', label: 'Ticket neto promedio', desc: 'Por reserva confirmada',
      value: fmtUYU(avgNet), trend: trendPct(avgNet, prevAvgNet), inverse: false,
      icon: BarChart3, tone: 'violet',
      tooltip: 'Ingreso neto promedio por reserva del mes.',
    },
    {
      key: 'annualCommission', label: 'Comisiones (12 meses)', desc: 'Acumulado del período',
      value: fmtUYU(annualCommission), trend: null, inverse: true,
      icon: Calendar, tone: 'primary',
      tooltip: `Total de comisiones en los últimos 12 meses, sobre un bruto de ${fmtUYU(annualGross)}.`,
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {CARDS.map((c) => (
        <motion.div key={c.key} variants={fadeUp}>
          <MetricCard
            icon={c.icon} tone={c.tone} label={c.label} value={c.value} sub={c.desc}
            trend={c.trend} trendInverse={c.inverse} tooltip={c.trend === null ? c.tooltip : undefined}
          />
          {c.trend !== null && (
            <div className="mt-1.5 px-1 flex items-center justify-between">
              <InfoTooltip text={c.tooltip} />
              <span className="text-[10px] text-gray-300">vs mes ant.</span>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

function GrossVsNetChart({ byMonth }) {
  return (
    <ChartCard
      title="Bruto vs. Neto por mes"
      subtitle="Últimos meses con actividad"
      action={
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Neto</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />Comisión</span>
        </div>
      }
    >
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={byMonth} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_LIGHT} vertical={false} />
            <XAxis dataKey="label" tick={CHART_AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey="net"        name="Neto proveedor"    stackId="s" fill={CHART_COLORS.success} radius={[0, 0, 4, 4]} maxBarSize={28} />
            <Bar dataKey="commission" name="Comisión Eventonow" stackId="s" fill={CHART_COLORS.commission} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function MoneyDistributionPie({ byMonth }) {
  const annualGross      = byMonth.reduce((s, m) => s + m.gross, 0);
  const annualCommission = byMonth.reduce((s, m) => s + m.commission, 0);
  const annualNet        = byMonth.reduce((s, m) => s + m.net, 0);
  const pieData = [
    { name: 'Ingreso neto',        value: annualNet,        color: CHART_COLORS.success },
    { name: 'Comisión Eventonow',  value: annualCommission, color: CHART_COLORS.commission },
  ];
  return (
    <ChartCard title="Distribución del dinero" subtitle="Períodos con actividad">
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
            const pct = annualGross > 0 ? ((d.value / annualGross) * 100).toFixed(0) : 0;
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
    </ChartCard>
  );
}

function CommissionEvolutionChart({ byMonth }) {
  return (
    <ChartCard
      title="Evolución de comisiones"
      subtitle="Comisión mensual descontada por Eventonow"
      action={<span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">{COMMISSION_LABEL} fijo</span>}
    >
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <LineChart data={byMonth} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_LIGHT} />
            <XAxis dataKey="label" tick={CHART_AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="commission" name="Comisión Eventonow" stroke={CHART_COLORS.commission} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.commission }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function TransactionsTable({ transactions, summary }) {
  return (
    <ChartCard title="Detalle por reserva" subtitle="Desglose bruto · comisión · neto (últimas 50)">
      <div className="overflow-x-auto -mx-5">
        <table className="w-full">
          <thead>
            <tr className="border-y border-gray-100 bg-gray-50/60">
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Cliente</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3 hidden md:table-cell">Servicio</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3 hidden sm:table-cell">Estado</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3">Bruto</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3 hidden sm:table-cell">Comisión</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3">Neto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
                      {(t.clientName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{t.clientName || 'Cliente'}</p>
                      <p className="text-[10px] text-gray-400">{safeFormatDate(t.date)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 hidden md:table-cell"><p className="text-xs text-gray-700">{t.serviceTitle}</p></td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_PILL[t.status] || STATUS_PILL.pending}`}>
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-right"><p className="text-xs font-semibold text-gray-700">{fmtUYU(t.gross)}</p></td>
                <td className="px-3 py-3 text-right hidden sm:table-cell"><p className="text-xs font-bold text-orange-500">-{fmtUYU(t.commission)}</p></td>
                <td className="px-3 py-3 text-right"><p className="text-sm font-bold text-emerald-600">{fmtUYU(t.net)}</p></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Reservas (histórico):</span>
          <strong className="text-gray-800">{summary.bookingsCount}</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Bruto total:</span>
          <strong className="text-gray-800">{fmtFull(summary.gross)}</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Comisiones:</span>
          <strong className="text-orange-500">-{fmtFull(summary.commission)}</strong>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-gray-500 font-medium">Neto acumulado:</span>
          <strong className="text-emerald-600 text-sm">{fmtFull(summary.net)}</strong>
        </div>
      </div>
    </ChartCard>
  );
}

function TransparencyBanner() {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 flex items-center gap-5">
      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
        <AppIcon icon={Percent} size={22} className="text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm mb-0.5">Comisión de plataforma</p>
        <p className="text-gray-400 text-xs leading-relaxed">{COMMISSION_DESCRIPTION}</p>
      </div>
      <div className="shrink-0 text-right hidden sm:block">
        <p className="text-3xl font-black text-white">{COMMISSION_LABEL}</p>
        <p className="text-xs text-gray-400">fijo por reserva</p>
      </div>
    </div>
  );
}

export default function DashCommissions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    providerDashboardService.getEarnings()
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { setError(err?.message || 'No se pudieron cargar las finanzas'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <AppIcon icon={AlertTriangle} size={32} className="mx-auto text-amber-500 mb-3" aria-hidden="true" />
        <p className="text-gray-700 font-medium mb-1">No pudimos cargar tus finanzas</p>
        <p className="text-sm text-gray-500 mb-5">{error}</p>
        <Button onClick={load}>Reintentar</Button>
      </div>
    );
  }

  const { summary, byMonth, transactions } = data;

  if (summary.bookingsCount === 0) {
    return (
      <div className="space-y-5">
        <TransparencyBanner />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
          Todavía no tenés reservas confirmadas. Cuando recibas tu primera reserva, vas a ver acá el desglose de facturación y comisiones.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TransparencyBanner />
      <SummaryCards byMonth={byMonth} summary={summary} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2"><GrossVsNetChart byMonth={byMonth} /></div>
        <MoneyDistributionPie byMonth={byMonth} />
      </div>

      <CommissionEvolutionChart byMonth={byMonth} />

      <TransactionsTable transactions={transactions} summary={summary} />
    </div>
  );
}
