'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Phone, MessageCircle,
  MapPin, Users, DollarSign, CalendarClock, FileText, CheckCircle2, AlertCircle,
  CalendarCheck2, CalendarClock as CalendarPartial, CalendarOff,
} from 'lucide-react';
import { fmtFull } from '@/lib/commissionHelpers';
import { parseApiDate, todayStr } from '@/lib/date';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Drawer from '@/components/Drawer';
import LocationMap from '@/components/LocationMap';
import { CHART_COLORS } from '@/lib/chartTheme';
import { availabilityService } from '@/services/availabilityService';
import { serviceService } from '@/services/serviceService';
import DayDetailDrawer from './DayDetailDrawer';

// Estados de disponibilidad por día (Etapa 6.1) — simplificado a 3 estados
// visuales (a pedido): disponible, parcial y bloqueado. "Completo" y "fuera
// de horario" no se distinguen visualmente (se pliegan a parcial/disponible).
const DAY_STATUS_STYLES = {
  available: { icon: CalendarCheck2,  className: 'text-emerald-600',                label: 'Disponible' },
  partial:   { icon: CalendarPartial, className: 'text-amber-600 bg-amber-50',       label: 'Parcial' },
  blocked:   { icon: CalendarOff,     className: 'text-red-700 bg-red-100',          label: 'Bloqueado', cellClassName: 'bg-red-50 ring-1 ring-inset ring-red-300 hover:bg-red-100/60' },
};

// El backend devuelve 5 estados (available/partial/full/blocked/outside_hours);
// acá se colapsan a los 3 que se muestran en el grid.
function toDisplayStatus(rawStatus) {
  if (rawStatus === 'blocked') return 'blocked';
  if (rawStatus === 'partial' || rawStatus === 'full') return 'partial';
  return 'available'; // available | outside_hours
}

const STATUS_STYLES = {
  confirmed: { bg: 'bg-emerald-100',  text: 'text-emerald-700', dot: CHART_COLORS.success, label: 'Confirmada' },
  pending:   { bg: 'bg-amber-100',    text: 'text-amber-700',   dot: CHART_COLORS.warning, label: 'Pendiente'  },
  completed: { bg: 'bg-blue-100',     text: 'text-blue-700',    dot: CHART_COLORS.info,    label: 'Finalizada' },
  cancelled: { bg: 'bg-red-100',      text: 'text-red-500',     dot: CHART_COLORS.primary, label: 'Cancelada'  },
  rejected:  { bg: 'bg-red-100',      text: 'text-red-500',     dot: CHART_COLORS.primary, label: 'Rechazada'  },
};

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function EventPill({ booking, onClick }) {
  const s = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(booking); }}
      className={`w-full text-left text-[10px] font-semibold px-1.5 py-0.5 rounded-md mb-0.5 truncate leading-tight ${s.bg} ${s.text} hover:opacity-80 transition-opacity`}
    >
      {booking.time} {(booking.clientName || '').split(' ')[0]}
    </button>
  );
}

export function CalendarDrawer({ booking, onClose }) {
  const dateObj = booking ? parseApiDate(booking.date) : null;
  const dateLabel = dateObj
    ? dateObj.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Fecha no disponible';
  const gross = booking?.totalEstimated || 0;
  const commission = booking?.commissionAmount || 0;
  const net = booking?.providerNet || 0;
  const s = booking ? (STATUS_STYLES[booking.status] || STATUS_STYLES.pending) : null;

  return (
    <Drawer
      open={!!booking}
      onClose={onClose}
      title={booking && (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
          {s.label}
        </span>
      )}
    >
      {booking && (
        <>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
              {(booking.clientName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{booking.clientName}</p>
              <p className="text-xs text-gray-500">{booking.eventType}</p>
            </div>
          </div>
          {booking.clientPhone && (
            <div className="flex gap-2 mb-4">
              <a href={`tel:${booking.clientPhone}`} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                <AppIcon icon={Phone} size={13} aria-hidden="true" /> Llamar
              </a>
              <a href={`https://wa.me/${booking.clientPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors">
                <AppIcon icon={MessageCircle} size={13} aria-hidden="true" /> WhatsApp
              </a>
            </div>
          )}

          <div className="space-y-3 pb-4 border-b border-gray-100 mb-4">
            <DetailRow icon={CalendarClock} label="Fecha y hora" value={`${dateLabel}${booking.time ? `, ${booking.time}` : ''}`} />
            <DetailRow icon={MapPin} label="Ubicación" value={booking.location || '—'} />
            {booking.locationDetails && (
              <LocationMap lat={booking.locationDetails.lat} lng={booking.locationDetails.lng} readOnly height="h-40" className="ml-6" />
            )}
            <DetailRow icon={Users} label="Invitados" value={`${booking.guests} personas`} />
            <DetailRow icon={DollarSign} label="Monto" value={fmtFull(gross)} sub={booking.depositPaid ? 'Seña pagada' : 'Seña pendiente'} subIcon={booking.depositPaid ? CheckCircle2 : AlertCircle} subColor={booking.depositPaid ? 'text-emerald-600' : 'text-amber-500'} />
            <DetailRow icon={FileText} label="Servicio" value={booking.serviceTitle || '—'} />
            {booking.message && (
              <DetailRow icon={FileText} label="Mensaje del cliente" iconClassName="text-gray-400" value={booking.message} />
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-400">Ref:</span>
              <span className="text-xs font-mono text-gray-500">{booking.requestNumber}</span>
            </div>
          </div>

          {gross > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Desglose financiero</p>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Precio del servicio</span>
                  <span className="text-sm font-semibold text-gray-800">{fmtFull(gross)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Comisión Eventonow</span>
                  <span className="text-sm font-bold text-orange-500">-{fmtFull(commission)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Total a recibir</span>
                  <span className="text-xl font-black text-emerald-600">{fmtFull(net)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}

function DetailRow({ icon, label, value, sub, subIcon, subColor = 'text-gray-400', iconClassName = 'text-primary' }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-5 shrink-0 mt-0.5">
        <AppIcon icon={icon} size={15} className={iconClassName} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium leading-snug">{value}</p>
        {sub && (
          <p className={`flex items-center gap-1 text-[11px] font-medium ${subColor} mt-0.5`}>
            {subIcon && <AppIcon icon={subIcon} size={11} aria-hidden="true" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// Vista completa para la pestaña Calendario. `bookings` viene del proveedor autenticado.
export function FullCalendarView({ bookings = [] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);
  const [statusByDate, setStatusByDate] = useState({});
  const [services, setServices] = useState([]);
  const TODAY = todayStr();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const getDay = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const loadMonthStatus = useCallback(async () => {
    const from = getDay(1);
    const to = getDay(daysInMonth);
    try {
      const days = await availabilityService.getCalendar(from, to);
      const map = {};
      days.forEach((d) => { map[d.date] = d; });
      setStatusByDate(map);
    } catch {
      // el grid sigue funcionando mostrando solo las reservas, sin estados de disponibilidad
    }
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadMonthStatus(); }, [loadMonthStatus]);
  useEffect(() => { serviceService.getByProvider().then(setServices).catch(() => {}); }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Calendario</h2>
          <p className="text-sm text-gray-400">Gestión de reservas y disponibilidad</p>
        </div>
        <div className="flex items-center gap-3">
          <Button iconOnly icon={ChevronLeft} variant="outline" size="sm" aria-label="Mes anterior" onClick={prevMonth} />
          <span className="text-base font-bold text-gray-900 w-36 text-center">{MONTHS_ES[month]} {year}</span>
          <Button iconOnly icon={ChevronRight} variant="outline" size="sm" aria-label="Mes siguiente" onClick={nextMonth} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-3">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="min-h-[110px] bg-gray-50/30" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDay(day);
              const dayBookings = bookings.filter((b) => b.date === dateStr);
              const isToday = dateStr === TODAY;
              const isPast = dateStr < TODAY;
              const total = dayBookings.reduce((s, b) => s + (b.totalEstimated || 0), 0);
              const dayStatus = statusByDate[dateStr];
              const displayStatus = dayStatus ? toDisplayStatus(dayStatus.status) : null;
              const statusStyle = displayStatus ? DAY_STATUS_STYLES[displayStatus] : null;
              const isBlocked = displayStatus === 'blocked';
              return (
                <div
                  key={day}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDayDetail(dateStr)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDayDetail(dateStr); } }}
                  className={`min-h-[110px] p-2 relative text-left w-full cursor-pointer ${
                    isBlocked
                      ? statusStyle.cellClassName
                      : isPast && !isToday ? 'bg-gray-50/30' : 'hover:bg-blue-50/20 transition-colors'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-primary text-white' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                      {day}
                    </div>
                    {statusStyle && (
                      displayStatus === 'available' ? (
                        <AppIcon icon={statusStyle.icon} size={14} className={statusStyle.className} aria-hidden="true" />
                      ) : (
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusStyle.className}`} title={statusStyle.label}>
                          <AppIcon icon={statusStyle.icon} size={10} aria-hidden="true" />
                        </span>
                      )
                    )}
                  </div>
                  {dayBookings.map((b) => <EventPill key={b.id} booking={b} onClick={setSelected} />)}
                  {total > 0 && <div className="text-[9px] text-gray-400 mt-1 font-medium">${(total / 1000).toFixed(0)}K</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-5 flex-wrap">
        {Object.entries(STATUS_STYLES).map(([k, s]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.dot }} />
            <span className="text-xs text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-5 flex-wrap">
        {Object.entries(DAY_STATUS_STYLES).map(([k, s]) => (
          <div key={k} className="flex items-center gap-1.5">
            <AppIcon icon={s.icon} size={13} className={s.className.split(' ')[0]} aria-hidden="true" />
            <span className="text-xs text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      <CalendarDrawer booking={selected} onClose={() => setSelected(null)} />
      <DayDetailDrawer
        date={dayDetail}
        services={services}
        onClose={() => setDayDetail(null)}
        onChanged={loadMonthStatus}
      />
    </div>
  );
}
