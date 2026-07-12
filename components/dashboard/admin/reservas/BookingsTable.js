'use client';

import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import { Eye, Copy, ChevronLeft, ChevronRight, CalendarX } from 'lucide-react';
import { safeFormatDate } from '@/lib/date';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import { TABLE_HEAD_CLS, TABLE_ROW_HOVER_CLS } from '@/components/Table';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;
const fmtDate = safeFormatDate;
const fmtCreated = safeFormatDate;

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
      <div className="rounded-2xl border border-gray-800 bg-gray-900">
        <EmptyState
          icon={CalendarX}
          title="No hay reservas"
          description="Probá ajustar los filtros o esperá a que lleguen nuevas reservas."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className={TABLE_HEAD_CLS.dark}>
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
              <tr
                key={b.id}
                role="button"
                tabIndex={0}
                className={`${TABLE_ROW_HOVER_CLS.dark} cursor-pointer`}
                onClick={() => onRowClick(b)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(b); } }}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-100">{b.requestNumber}</div>
                  <div className="text-[11px] text-gray-500">{fmtCreated(b.createdAt)}</div>
                </td>
                <td className="px-4 py-3 text-gray-300 truncate max-w-[130px]">{b.clientName}</td>
                <td className="px-4 py-3 text-gray-300 truncate max-w-[130px]">{b.providerName}</td>
                <td className="px-4 py-3 text-gray-400 truncate max-w-[160px]">{b.serviceTitle}</td>
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
                    <Button iconOnly icon={Eye} variant="ghost" theme="dark" size="sm" aria-label="Ver detalle" title="Ver detalle" onClick={() => onRowClick(b)} />
                    <Button iconOnly icon={Copy} variant="ghost" theme="dark" size="sm" aria-label="Copiar número" title="Copiar número" onClick={() => onCopy(b.requestNumber)} />
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
            <Button iconOnly icon={ChevronLeft} variant="outline" theme="dark" size="sm" aria-label="Página anterior" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)} />
            <Button iconOnly icon={ChevronRight} variant="outline" theme="dark" size="sm" aria-label="Página siguiente" disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}
