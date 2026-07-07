'use client';

import ReservationStatusBadge from '@/components/ReservationStatusBadge';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }) : '—';
const uiStatus = (s) => (s === 'accepted' ? 'confirmed' : s);

export default function RecentBookings({ bookings = [] }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Reservas recientes</h3>
      {bookings.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Todavía no hay reservas.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-800">
                <th className="py-2 font-medium">Cliente</th>
                <th className="py-2 font-medium">Servicio</th>
                <th className="py-2 font-medium">Fecha</th>
                <th className="py-2 font-medium">Estado</th>
                <th className="py-2 font-medium text-right">Total</th>
                <th className="py-2 font-medium text-right">Comisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-2.5 text-gray-200 truncate max-w-[120px]">{b.clientName}</td>
                  <td className="py-2.5 text-gray-400 truncate max-w-[160px]">{b.serviceTitle}<span className="text-gray-600"> · {b.providerName}</span></td>
                  <td className="py-2.5 text-gray-400 whitespace-nowrap">{fmtDate(b.date)}</td>
                  <td className="py-2.5"><ReservationStatusBadge status={uiStatus(b.status)} /></td>
                  <td className="py-2.5 text-right font-semibold text-gray-200 whitespace-nowrap">{money(b.total)}</td>
                  <td className="py-2.5 text-right text-amber-400 whitespace-nowrap">{money(b.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
