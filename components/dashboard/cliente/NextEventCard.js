'use client';

import Link from 'next/link';
import { CalendarDays, Clock, MapPin, ArrowRight } from 'lucide-react';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import { parseApiDate } from '@/lib/date';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

export default function NextEventCard({ booking }) {
  const bDate = parseApiDate(booking.date);
  const dateLabel = bDate
    ? bDate.toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long' })
    : '';
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-56 h-40 sm:h-auto shrink-0 bg-gray-100">
          {booking.providerImage
            ? <img src={booking.providerImage} alt={booking.serviceTitle || booking.providerName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-4xl">🎉</div>}
        </div>
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Tu próximo evento</span>
            <ReservationStatusBadge status={booking.displayStatus || booking.status} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{booking.serviceTitle || booking.providerName}</h3>
          <p className="text-sm text-gray-500">{booking.providerName}</p>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5 capitalize"><CalendarDays size={14} className="text-gray-400" /> {dateLabel}</span>
            {booking.time && <span className="flex items-center gap-1.5"><Clock size={14} className="text-gray-400" /> {booking.time} hs</span>}
            {booking.location && <span className="flex items-center gap-1.5 min-w-0"><MapPin size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{booking.location}</span></span>}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-[11px] text-gray-400">Total estimado</div>
              <div className="text-lg font-bold text-gray-900">{money(booking.totalEstimated)}</div>
            </div>
            <Link href="/dashboard/cliente/reservas" className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm">
              Ver detalle <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
