'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, Eye, Check, X, Clock, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { BOOKINGS } from '@/lib/proveedorDashboardData';
import { CalendarDrawer } from './DashCalendar';

const STATUS_PILL = {
  confirmed: 'bg-emerald-50  text-emerald-700 border-emerald-200',
  pending:   'bg-amber-50    text-amber-700   border-amber-200',
  completed: 'bg-blue-50     text-blue-700    border-blue-200',
  cancelled: 'bg-red-50      text-red-600     border-red-200',
};
const STATUS_LABEL = { confirmed:'Confirmada', pending:'Pendiente', completed:'Finalizada', cancelled:'Cancelada' };

const TODAY = '2026-06-29';

export function UpcomingList({ onBookingSelect }) {
  const upcoming = BOOKINGS
    .filter((b) => b.date >= TODAY && b.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const today    = upcoming.filter((b) => b.date === TODAY);
  const tomorrow = upcoming.filter((b) => b.date === '2026-06-30');
  const week     = upcoming.filter((b) => b.date > '2026-06-30' && b.date <= '2026-07-06');
  const later    = upcoming.filter((b) => b.date > '2026-07-06');

  const Section = ({ title, items, accent }) => {
    if (!items.length) return null;
    return (
      <div className="mb-5">
        <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${accent}`}>{title}</div>
        <div className="space-y-2">
          {items.map((b) => (
            <button
              key={b.id}
              onClick={() => onBookingSelect?.(b)}
              className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <img src={b.clientAvatar} alt={b.clientName} className="w-8 h-8 rounded-full shrink-0 object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">{b.clientName}</p>
                    <p className="text-xs text-gray-500 truncate">{b.service}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_PILL[b.status]}`}>
                  {STATUS_LABEL[b.status]}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><Clock size={10} /> {b.time}</span>
                <span className="flex items-center gap-1"><MapPin size={10} /> {b.location.split(',')[0]}</span>
                <span className="flex items-center gap-1 ml-auto font-semibold text-gray-600">${(b.amount / 1000).toFixed(0)}K</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Próximos eventos</h3>
          <p className="text-xs text-gray-400">{upcoming.length} confirmados o pendientes</p>
        </div>
        <div className="flex items-center gap-1.5 bg-primary-light text-primary text-xs font-bold px-2.5 py-1 rounded-xl">
          <Calendar size={12} /> {today.length} hoy
        </div>
      </div>
      <div className="overflow-y-auto max-h-[420px] pr-0.5">
        <Section title="Hoy" items={today} accent="text-primary" />
        <Section title="Mañana" items={tomorrow} accent="text-blue-600" />
        <Section title="Esta semana" items={week} accent="text-gray-500" />
        <Section title="Más adelante" items={later} accent="text-gray-400" />
        {!upcoming.length && <p className="text-sm text-gray-400 text-center py-8">No hay eventos próximos</p>}
      </div>
    </div>
  );
}

export function LatestBookings() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 7;

  const filtered = BOOKINGS.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.clientName.toLowerCase().includes(q) || b.service.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Últimas reservas</h3>
          <p className="text-xs text-gray-400">{filtered.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-gray-50 w-40"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {/* Status filter */}
          <div className="relative">
            <select
              className="appearance-none text-xs border border-gray-200 rounded-xl pl-3 pr-7 py-2 bg-gray-50 focus:outline-none focus:border-primary cursor-pointer font-medium text-gray-700"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Finalizadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3">Cliente</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3 hidden md:table-cell">Servicio</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3 hidden sm:table-cell">Fecha</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Estado</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3 hidden sm:table-cell">Monto</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3 hidden md:table-cell">Pago</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((b) => {
              const dateObj = new Date(b.date + 'T12:00:00');
              return (
                <motion.tr
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50/60 transition-colors group"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={b.clientAvatar} alt={b.clientName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{b.clientName}</p>
                        <p className="text-[11px] text-gray-400">{b.guests} invitados</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <p className="text-xs text-gray-700 font-medium">{b.service}</p>
                    <p className="text-[11px] text-gray-400">{b.eventType}</p>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <p className="text-xs font-medium text-gray-700">{dateObj.toLocaleDateString('es-UY', { day:'2-digit', month:'short' })}</p>
                    <p className="text-[11px] text-gray-400">{b.time}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_PILL[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right hidden sm:table-cell">
                    <p className="text-sm font-bold text-gray-900">${(b.amount / 1000).toFixed(0)}K</p>
                  </td>
                  <td className="px-3 py-3 text-right hidden md:table-cell">
                    <span className={`text-[11px] font-medium ${b.depositPaid ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {b.depositPaid ? '✓ Pagado' : '⏳ Pendiente'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelected(b)}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary/40 disabled:opacity-40 transition-colors">
              <ChevronDown size={13} className="rotate-90" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary/40 disabled:opacity-40 transition-colors">
              <ChevronDown size={13} className="-rotate-90" />
            </button>
          </div>
        </div>
      )}

      <CalendarDrawer booking={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
