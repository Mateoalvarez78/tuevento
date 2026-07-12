'use client';

import { CalendarDays, Clock, MapPin, ArrowRight, PartyPopper } from 'lucide-react';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
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
            : <div className="w-full h-full flex items-center justify-center"><AppIcon icon={PartyPopper} size={32} strokeWidth={1.5} className="text-gray-300" aria-hidden="true" /></div>}
        </div>
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Tu próximo evento</span>
            <ReservationStatusBadge status={booking.displayStatus || booking.status} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{booking.serviceTitle || booking.providerName}</h3>
          <p className="text-sm text-gray-500">{booking.providerName}</p>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5 capitalize"><AppIcon icon={CalendarDays} size={14} className="text-gray-400" aria-hidden="true" /> {dateLabel}</span>
            {booking.time && <span className="flex items-center gap-1.5"><AppIcon icon={Clock} size={14} className="text-gray-400" aria-hidden="true" /> {booking.time} hs</span>}
            {booking.location && <span className="flex items-center gap-1.5 min-w-0"><AppIcon icon={MapPin} size={14} className="text-gray-400 shrink-0" aria-hidden="true" /> <span className="truncate">{booking.location}</span></span>}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-[11px] text-gray-400">Total estimado</div>
              <div className="text-lg font-bold text-gray-900">{money(booking.totalEstimated)}</div>
            </div>
            <Button icon={ArrowRight} iconPosition="right" href="/dashboard/cliente/reservas">Ver detalle</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
