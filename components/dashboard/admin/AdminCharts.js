'use client';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;
const shortMonth = (label) => (label || '').split(' ')[0]; // "Ene 2026" → "Ene"
const kFmt = (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v);

const AXIS = { fontSize: 11, fill: '#9CA3AF' };
const GRID = '#1f2937';
const TOOLTIP_STYLE = { background: '#111827', border: '1px solid #374151', borderRadius: 12, fontSize: 12, color: '#fff' };

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const empty = (msg) => <div className="h-48 flex items-center justify-center text-sm text-gray-600">{msg}</div>;

export default function AdminCharts({ monthly = [], stats }) {
  const data = monthly.map((m) => ({ ...m, m: shortMonth(m.label) }));
  const hasMonthly = data.length > 0;

  const bookingStatus = [
    { name: 'Pendientes', value: stats.bookings.pending, color: '#F59E0B' },
    { name: 'Aceptadas', value: stats.bookings.accepted, color: '#0BB885' },
    { name: 'Completadas', value: stats.bookings.completed, color: '#3B82F6' },
    { name: 'Rechazadas', value: stats.bookings.rejected, color: '#EF4444' },
    { name: 'Canceladas', value: stats.bookings.cancelled, color: '#6B7280' },
  ].filter((s) => s.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Monto vendido por mes */}
      <Panel title="Monto vendido por mes" subtitle="GMV (reservas aceptadas y completadas) · UYU">
        {!hasMonthly ? empty('Sin datos aún') : (
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -12 }}>
                <defs>
                  <linearGradient id="admGmv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0BB885" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0BB885" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="m" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={kFmt} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [money(v), 'Vendido']} />
                <Area type="monotone" dataKey="grossAmount" name="Vendido" stroke="#0BB885" strokeWidth={2} fill="url(#admGmv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {/* Reservas por mes */}
      <Panel title="Reservas por mes" subtitle="Reservas confirmadas · últimos 12 meses">
        {!hasMonthly ? empty('Sin datos aún') : (
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="m" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#ffffff08' }} formatter={(v) => [v, 'Reservas']} />
                <Bar dataKey="bookingsCount" name="Reservas" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {/* Comisión Eventonow por mes */}
      <Panel title="Comisión Eventonow por mes" subtitle="8% sobre reservas confirmadas · UYU">
        {!hasMonthly ? empty('Sin datos aún') : (
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -12 }}>
                <defs>
                  <linearGradient id="admComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="m" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={kFmt} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [money(v), 'Comisión']} />
                <Area type="monotone" dataKey="commissionAmount" name="Comisión" stroke="#F59E0B" strokeWidth={2} fill="url(#admComm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      {/* Reservas por estado */}
      <Panel title="Reservas por estado">
        {bookingStatus.length === 0 ? empty('Sin reservas aún') : (
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={bookingStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2}>
                  {bookingStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>
    </div>
  );
}
