'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, X, Phone, MessageCircle, Clock,
  MapPin, Users, DollarSign, CalendarClock, FileText,
} from 'lucide-react';
import { fmtFull } from '@/lib/commissionHelpers';

const STATUS_STYLES = {
  confirmed: { bg: 'bg-emerald-100',  text: 'text-emerald-700', dot: '#0BB885', label: 'Confirmada' },
  pending:   { bg: 'bg-amber-100',    text: 'text-amber-700',   dot: '#F5A623', label: 'Pendiente'  },
  completed: { bg: 'bg-blue-100',     text: 'text-blue-700',    dot: '#2563EB', label: 'Finalizada' },
  cancelled: { bg: 'bg-red-100',      text: 'text-red-500',     dot: '#E84D2C', label: 'Cancelada'  },
  rejected:  { bg: 'bg-red-100',      text: 'text-red-500',     dot: '#E84D2C', label: 'Rechazada'  },
};

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

// Widget compacto (no usado actualmente en ninguna pantalla, se mantiene por si se reutiliza).
export function ProviderCalendar({ bookings = [], onTabChange }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);
  const TODAY = todayStr();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthBookings = bookings.filter((b) => b.date?.startsWith(monthStr));

  const getDay = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Calendario</h3>
          <p className="text-xs text-gray-400">{monthBookings.length} evento{monthBookings.length !== 1 ? 's' : ''} este mes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-800 w-28 text-center">
            {MONTHS_ES[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} className="min-h-[80px] bg-gray-50/50" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = getDay(day);
          const dayBookings = bookings.filter((b) => b.date === dateStr);
          const isToday = dateStr === TODAY;
          const isPast = dateStr < TODAY;
          return (
            <div
              key={day}
              className={`min-h-[80px] p-1.5 relative transition-colors ${isPast && !isToday ? 'bg-gray-50/30' : 'hover:bg-gray-50/70'}`}
            >
              <div className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold mb-0.5 ${isToday ? 'bg-primary text-white' : 'text-gray-600'}`}>
                {day}
              </div>
              {dayBookings.map((b) => (
                <EventPill key={b.id} booking={b} onClick={setSelected} />
              ))}
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_STYLES).map(([k, s]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot }} />
            <span className="text-[11px] text-gray-500">{s.label}</span>
          </div>
        ))}
        <button onClick={() => onTabChange?.('calendario')} className="ml-auto text-xs font-semibold text-primary hover:underline">
          Vista completa →
        </button>
      </div>

      <CalendarDrawer booking={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export function CalendarDrawer({ booking, onClose }) {
  if (!booking) return null;
  const s = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
  const dateObj = new Date(booking.date + 'T12:00:00');
  const dateLabel = dateObj.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const gross = booking.totalEstimated || 0;
  const commission = booking.commissionAmount || 0;
  const net = booking.providerNet || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-sm bg-white shadow-2xl overflow-y-auto flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
              {s.label}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
                {(booking.clientName || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{booking.clientName}</p>
                <p className="text-xs text-gray-500">{booking.eventType}</p>
              </div>
            </div>
            {booking.clientPhone && (
              <div className="flex gap-2 mt-3">
                <a href={`tel:${booking.clientPhone}`} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                  <Phone size={13} /> Llamar
                </a>
                <a href={`https://wa.me/${booking.clientPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors">
                  <MessageCircle size={13} /> WhatsApp
                </a>
              </div>
            )}
          </div>

          <div className="px-5 py-4 space-y-3 border-b border-gray-100">
            <DetailRow icon={<CalendarClock size={15} className="text-primary" />} label="Fecha y hora" value={`${dateLabel}${booking.time ? `, ${booking.time}` : ''}`} />
            <DetailRow icon={<MapPin size={15} className="text-primary" />} label="Ubicación" value={booking.location || '—'} />
            <DetailRow icon={<Users size={15} className="text-primary" />} label="Invitados" value={`${booking.guests} personas`} />
            <DetailRow icon={<DollarSign size={15} className="text-primary" />} label="Monto" value={fmtFull(gross)} sub={booking.depositPaid ? '✓ Seña pagada' : '⚠ Seña pendiente'} subColor={booking.depositPaid ? 'text-emerald-600' : 'text-amber-500'} />
            <DetailRow icon={<FileText size={15} className="text-primary" />} label="Servicio" value={booking.serviceTitle || '—'} />
            {booking.message && (
              <DetailRow icon={<FileText size={15} className="text-gray-400" />} label="Mensaje del cliente" value={booking.message} />
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-400">Ref:</span>
              <span className="text-xs font-mono text-gray-500">{booking.requestNumber}</span>
            </div>
          </div>

          {gross > 0 && (
            <div className="px-5 py-4 border-b border-gray-100">
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DetailRow({ icon, label, value, sub, subColor = 'text-gray-400' }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-5 shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium leading-snug">{value}</p>
        {sub && <p className={`text-[11px] font-medium ${subColor} mt-0.5`}>{sub}</p>}
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
  const TODAY = todayStr();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const getDay = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Calendario</h2>
          <p className="text-sm text-gray-400">Gestión de reservas y disponibilidad</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-base font-bold text-gray-900 w-36 text-center">{MONTHS_ES[month]} {year}</span>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

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
          return (
            <div key={day} className={`min-h-[110px] p-2 relative ${isPast && !isToday ? 'bg-gray-50/30' : 'hover:bg-blue-50/20 transition-colors'}`}>
              <div className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-bold mb-1 ${isToday ? 'bg-primary text-white' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                {day}
              </div>
              {dayBookings.map((b) => <EventPill key={b.id} booking={b} onClick={setSelected} />)}
              {total > 0 && <div className="text-[9px] text-gray-400 mt-1 font-medium">${(total / 1000).toFixed(0)}K</div>}
            </div>
          );
        })}
      </div>

      <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-5 flex-wrap">
        {Object.entries(STATUS_STYLES).map(([k, s]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.dot }} />
            <span className="text-xs text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      <CalendarDrawer booking={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
