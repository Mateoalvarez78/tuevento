'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  CalendarClock, Clock, CheckCircle2, DollarSign, Percent, Wallet,
  Package, AlertTriangle, Plus, ArrowRight, TrendingUp, Star,
} from 'lucide-react';
import ProviderStatusBadge from '@/components/ProviderStatusBadge';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import EmptyState from '@/components/EmptyState';
import { providerDashboardService } from '@/services/providerDashboardService';
import { parseApiDate, safeFormatDate } from '@/lib/date';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;
const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function MetricCard({ icon: Icon, label, value, sub, tone = 'gray' }) {
  const tones = {
    gray:    'text-gray-500 bg-gray-100',
    primary: 'text-primary bg-primary-light',
    amber:   'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    blue:    'text-blue-600 bg-blue-50',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon size={15} />
        </span>
        <span className="text-xs text-gray-500 font-medium leading-tight">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ProviderOverview({ provider, services = [], onCreateService, onGoToTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    providerDashboardService.getDashboard()
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { setError(err?.message || 'No se pudo cargar el panel'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const firstName = (provider?.ownerName || provider?.name || '').split(' ')[0] || 'proveedor';
  const activeServices = services.filter((s) => s.status === 'active').length;
  const inactiveServices = services.filter((s) => ['draft', 'pending_review', 'paused', 'rejected'].includes(s.status)).length;
  const pendingReview = services.filter((s) => s.status === 'pending_review').length;
  const drafts = services.filter((s) => s.status === 'draft').length;

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
        <p className="text-gray-700 font-medium mb-1">No pudimos cargar tu panel</p>
        <p className="text-sm text-gray-500 mb-5">{error}</p>
        <button onClick={load} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  const { bookings, earnings, monthlyStats, upcomingCalendar, recentBookings, topServices } = data;
  const thisMonth = monthlyStats.find((m) => m.monthKey === currentMonthKey());

  // ── Alertas ──
  const withoutPhotos = services.filter((s) => !s.primaryImage).length;
  const alerts = [];
  if (bookings.pending > 0) alerts.push({ tone: 'amber', text: `Tenés ${bookings.pending} reserva${bookings.pending !== 1 ? 's' : ''} pendiente${bookings.pending !== 1 ? 's' : ''} de respuesta.`, cta: 'Ver solicitudes', action: () => onGoToTab?.('solicitudes') });
  if (withoutPhotos > 0) alerts.push({ tone: 'amber', text: `Tenés ${withoutPhotos} servicio${withoutPhotos !== 1 ? 's' : ''} sin fotos. Agregar imágenes mejora tus reservas.`, cta: 'Ver servicios', action: () => onGoToTab?.('servicios') });
  if (pendingReview > 0) alerts.push({ tone: 'blue', text: `${pendingReview} servicio${pendingReview !== 1 ? 's' : ''} pendiente${pendingReview !== 1 ? 's' : ''} de aprobación.`, cta: 'Ver servicios', action: () => onGoToTab?.('servicios') });
  if (drafts > 0) alerts.push({ tone: 'gray', text: `Tenés ${drafts} servicio${drafts !== 1 ? 's' : ''} en borrador sin publicar.`, cta: 'Ver servicios', action: () => onGoToTab?.('servicios') });
  if (provider && !provider.description) alerts.push({ tone: 'gray', text: 'Completá la descripción de tu perfil para mejorar tu visibilidad.', cta: 'Ir al perfil', action: () => onGoToTab?.('perfil') });

  const noActivity = bookings.total === 0 && services.length === 0;

  return (
    <div className="space-y-5">
      {/* ── Header contextual ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">Hola, {firstName} 👋</h2>
            {provider?.status && <ProviderStatusBadge status={provider.status} />}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {provider?.name || 'Tu negocio'} · Panel de gestión de Eventonow
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onGoToTab?.('solicitudes')} className="px-3.5 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Ver reservas
          </button>
          <button onClick={onCreateService} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors">
            <Plus size={15} /> Crear servicio
          </button>
        </div>
      </div>

      {noActivity ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState
            icon="🚀"
            title="Empecemos con tu primer servicio"
            description="Publicá un servicio con sus menús para empezar a recibir reservas de clientes."
            cta="Crear mi primer servicio"
            onCta={onCreateService}
          />
        </div>
      ) : (
        <>
          {/* ── Alertas ── */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${a.tone === 'amber' ? 'bg-amber-400' : a.tone === 'blue' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700 truncate">{a.text}</span>
                  </div>
                  {a.cta && (
                    <button onClick={a.action} className="text-xs font-semibold text-primary hover:underline shrink-0 whitespace-nowrap">
                      {a.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Métricas ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard icon={CalendarClock} tone="primary" label="Próximas reservas" value={upcomingCalendar.length} sub="pendientes + aceptadas" />
            <MetricCard icon={Clock} tone="amber" label="Pendientes de respuesta" value={bookings.pending} />
            <MetricCard icon={CheckCircle2} tone="emerald" label="Reservas confirmadas" value={bookings.accepted} sub={`${bookings.completed} completadas`} />
            <MetricCard icon={TrendingUp} tone="blue" label="Reservas este mes" value={thisMonth?.bookings || 0} sub={thisMonth ? money(thisMonth.revenue) : '—'} />
            <MetricCard icon={DollarSign} tone="emerald" label="Ingresos brutos" value={money(earnings.grossRevenue)} sub="aceptadas + completadas" />
            <MetricCard icon={Percent} tone="amber" label="Comisión Eventonow (8%)" value={money(earnings.totalCommission)} />
            <MetricCard icon={Wallet} tone="primary" label="Tu neto estimado" value={money(earnings.netRevenue)} />
            <MetricCard icon={Package} tone="gray" label="Servicios activos" value={activeServices} sub={inactiveServices ? `${inactiveServices} inactivos/borrador` : 'todos publicados'} />
          </div>

          {/* ── Rendimiento + Próximas ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Chart */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Facturación por mes</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Reservas aceptadas y completadas · últimos 12 meses</p>
                </div>
              </div>
              {monthlyStats.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-gray-400">Todavía no hay datos de facturación.</div>
              ) : (
                <div style={{ width: '100%', height: 224 }}>
                  <ResponsiveContainer>
                    <AreaChart data={monthlyStats} margin={{ top: 5, right: 5, bottom: 5, left: -18 }}>
                      <defs>
                        <linearGradient id="povRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0BB885" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0BB885" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                      <Tooltip
                        formatter={(v) => [money(v), 'Facturación']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#0BB885" strokeWidth={2} fill="url(#povRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Próximas reservas */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">Próximas reservas</h3>
                <button onClick={() => onGoToTab?.('calendario')} className="text-xs font-semibold text-primary hover:underline">Calendario</button>
              </div>
              {upcomingCalendar.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No tenés reservas próximas.</div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingCalendar.slice(0, 5).map((b) => {
                    const bDate = parseApiDate(b.date);
                    return (
                    <div key={b.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-light flex flex-col items-center justify-center shrink-0 leading-none">
                        <span className="text-[10px] text-primary font-semibold uppercase">{bDate ? bDate.toLocaleDateString('es-UY', { month: 'short' }) : '—'}</span>
                        <span className="text-sm font-bold text-primary">{bDate ? bDate.getDate() : '—'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{b.clientName}</p>
                        <p className="text-xs text-gray-400 truncate">{b.serviceTitle}{b.time ? ` · ${b.time}` : ''}</p>
                      </div>
                      <ReservationStatusBadge status={b.status === 'accepted' ? 'confirmed' : b.status} />
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Reservas recientes + Top servicios ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">Reservas recientes</h3>
                <button onClick={() => onGoToTab?.('solicitudes')} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  Ver todas <ArrowRight size={12} />
                </button>
              </div>
              {recentBookings.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Todavía no recibiste reservas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[420px]">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="py-2 font-medium">Cliente</th>
                        <th className="py-2 font-medium">Servicio</th>
                        <th className="py-2 font-medium">Fecha</th>
                        <th className="py-2 font-medium">Estado</th>
                        <th className="py-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentBookings.map((b) => (
                        <tr key={b.id}>
                          <td className="py-2.5 font-medium text-gray-800 truncate max-w-[120px]">{b.clientName}</td>
                          <td className="py-2.5 text-gray-500 truncate max-w-[140px]">{b.serviceTitle}</td>
                          <td className="py-2.5 text-gray-500 whitespace-nowrap">{safeFormatDate(b.date, '—')}</td>
                          <td className="py-2.5"><ReservationStatusBadge status={b.status === 'accepted' ? 'confirmed' : b.status} /></td>
                          <td className="py-2.5 text-right font-semibold text-gray-800 whitespace-nowrap">{money(b.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top servicios */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Servicios más reservados</h3>
              {topServices.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">Sin datos aún.</div>
              ) : (
                <div className="space-y-3">
                  {topServices.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-gray-300">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                          <span>{s.confirmedBookings} reservas</span>
                          {s.ratingAvg > 0 && <span className="flex items-center gap-0.5"><Star size={10} className="text-yellow-400 fill-current" /> {s.ratingAvg.toFixed(1)}</span>}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 shrink-0">{money(s.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
