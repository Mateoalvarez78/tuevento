'use client';

import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { MONTHLY_DATA, TOP_SERVICES, BOOKING_STATUS_DATA, HEATMAP_DATA, HEATMAP_HOURS } from '@/lib/proveedorDashboardData';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

function SectionCard({ title, subtitle, children, action }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg">
      <p className="font-semibold mb-1 text-gray-300">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{prefix}{typeof p.value === 'number' && p.value > 1000 ? `${(p.value).toLocaleString('es-UY')}K` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export function RevenueChart() {
  return (
    <SectionCard
      title="Facturación"
      subtitle="Últimos 12 meses en miles de pesos"
      action={<span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">+8.3% vs año anterior</span>}
    >
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={MONTHLY_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0BB885" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0BB885" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Facturación" stroke="#0BB885" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#0BB885' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

export function BookingsChart() {
  return (
    <SectionCard
      title="Reservas por mes"
      subtitle="Evolución de reservas confirmadas"
      action={<span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">+52 este mes</span>}
    >
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={MONTHLY_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#E84D2C" stopOpacity={1}   />
                <stop offset="100%" stopColor="#E84D2C" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey="bookings" name="Reservas" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

export function TopServicesChart() {
  const max = TOP_SERVICES[0]?.bookings || 1;
  return (
    <SectionCard title="Servicios más vendidos" subtitle="Reservas acumuladas del período">
      <div className="space-y-3">
        {TOP_SERVICES.map((s, i) => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400 w-4">{i + 1}</span>
                <span className="text-sm font-medium text-gray-700 truncate max-w-[160px]">{s.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{s.bookings}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(s.bookings / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, #E84D2C, #F97316)` }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function StatusPieChart() {
  const total = BOOKING_STATUS_DATA.reduce((s, d) => s + d.value, 0);
  return (
    <SectionCard title="Reservas por estado" subtitle="Distribución histórica">
      <div className="flex items-center gap-4">
        <div style={{ width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={BOOKING_STATUS_DATA} cx="50%" cy="50%" innerRadius={42} outerRadius={64} dataKey="value" strokeWidth={2} stroke="#fff">
                {BOOKING_STATUS_DATA.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} (${((v / total) * 100).toFixed(0)}%)`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {BOOKING_STATUS_DATA.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-gray-600">{d.name}</span>
              </div>
              <span className="text-xs font-bold text-gray-900">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function heatColor(v, max) {
  if (v === 0) return '#F9FAFB';
  const ratio = v / max;
  if (ratio < 0.2) return '#FEF0EB';
  if (ratio < 0.4) return '#FDBA9A';
  if (ratio < 0.6) return '#F97316';
  if (ratio < 0.8) return '#E84D2C';
  return '#B91C1C';
}

export function BookingHeatmap() {
  const allVals = HEATMAP_DATA.flatMap((r) => r.slots);
  const maxVal = Math.max(...allVals);
  return (
    <SectionCard title="Horarios más reservados" subtitle="Frecuencia histórica por día y hora">
      <div className="overflow-x-auto">
        <div style={{ minWidth: 560 }}>
          {/* Hour labels */}
          <div className="flex mb-1 ml-10">
            {HEATMAP_HOURS.map((h) => (
              <div key={h} className="flex-1 text-[10px] text-center text-gray-400 font-medium">{h}</div>
            ))}
          </div>
          {HEATMAP_DATA.map((row) => (
            <div key={row.day} className="flex items-center gap-0 mb-0.5">
              <div className="w-10 text-[11px] font-medium text-gray-500 shrink-0 pr-1 text-right">{row.day}</div>
              {row.slots.map((v, j) => (
                <div
                  key={j}
                  className="flex-1 h-6 rounded-sm mx-px transition-transform hover:scale-110 cursor-default"
                  style={{ background: heatColor(v, maxVal) }}
                  title={`${row.day} ${HEATMAP_HOURS[j]}hs — ${v} reservas`}
                />
              ))}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] text-gray-400">Menos</span>
            {['#F9FAFB','#FEF0EB','#FDBA9A','#F97316','#E84D2C','#B91C1C'].map((c) => (
              <div key={c} className="w-5 h-3 rounded-sm" style={{ background: c }} />
            ))}
            <span className="text-[10px] text-gray-400">Más</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
