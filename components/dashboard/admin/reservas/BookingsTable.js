'use client';

import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import { Eye, Copy, ChevronLeft, ChevronRight } from 'lucide-react';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
const fmtCreated = (d) => d ? new Date(d).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }) : '—';

export default function BookingsTable({ bookings = [], loading, pagination, onPage, onRowClick, onCopy }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-2">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-11 w-full rounded-lg bg-gray-800" />)}
      </div>
    );
  }
  if (!bookings.length) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-16 text-center">
        <div className="text-4xl mb-3">🗂️</div>
        <p className="text-gray-300 font-medium">No hay reservas</p>
        <p className="text-sm text-gray-500 mt-1">Probá ajustar los filtros o esperá a que lleguen nuevas reservas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-800">
              <th className="px-4 py-3 font-medium">Reserva</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Servicio</th>
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Importe</th>
              <th className="px-4 py-3 font-medium text-right">Comisión</th>
              <th className="px-4 py-3 font-medium text-right">Neto</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-800/40 transition-colors cursor-pointer" onClick={() => onRowClick(b)}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-100">{b.requestNumber}</div>
                  <div className="text-[11px] text-gray-500">{fmtCreated(b.createdAt)}</div>
                </td>
                <td className="px-4 py-3 text-gray-300 truncate max-w-[130px]">{b.clientName}</td>
                <td className="px-4 py-3 text-gray-300 truncate max-w-[130px]">{b.providerName}</td>
                <td className="px-4 py-3 text-gray-400 truncate max-w-[160px]">
                  <span className="mr-1">{b.categoryEmoji}</span>{b.serviceTitle}
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {fmtDate(b.eventDate)}
                  <span className="text-gray-600"> · {b.adults != null ? `${b.adults + b.children} pers.` : `${b.guests} pers.`}</span>
                </td>
                <td className="px-4 py-3"><ReservationStatusBadge status={b.status} /></td>
                <td className="px-4 py-3 text-right font-semibold text-gray-200 whitespace-nowrap">{money(b.total)}</td>
                <td className="px-4 py-3 text-right text-amber-400 whitespace-nowrap">{money(b.commission)}</td>
                <td className="px-4 py-3 text-right text-emerald-400 whitespace-nowrap">{money(b.providerNet)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onRowClick(b)} title="Ver detalle" className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-800 transition-colors"><Eye size={15} /></button>
                    <button onClick={() => onCopy(b.requestNumber)} title="Copiar número" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"><Copy size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <span className="text-xs text-gray-500">Página {pagination.page} de {pagination.totalPages} · {pagination.total} reservas</span>
          <div className="flex items-center gap-1.5">
            <button disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)} className="p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={15} /></button>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)} className="p-1.5 rounded-lg border border-gray-800 text-gray-400 hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
