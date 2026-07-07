'use client';

import { CalendarClock, CheckCircle2, Heart, Package, CalendarCheck } from 'lucide-react';

const TONES = {
  primary: 'text-primary bg-primary-light',
  emerald: 'text-emerald-600 bg-emerald-50',
  rose:    'text-rose-500 bg-rose-50',
  blue:    'text-blue-600 bg-blue-50',
  amber:   'text-amber-600 bg-amber-50',
};

export default function ClientStats({ stats }) {
  const items = [
    { icon: CalendarClock, label: 'Reservas activas',       value: stats.activeBookings,    tone: 'primary' },
    { icon: CheckCircle2,  label: 'Finalizadas',            value: stats.completedBookings, tone: 'emerald' },
    { icon: Heart,         label: 'Favoritos',              value: stats.favoritesCount,    tone: 'rose'    },
    { icon: Package,       label: 'Servicios contratados',  value: stats.contractedServices,tone: 'blue'    },
    { icon: CalendarCheck, label: 'Próximo evento',         value: stats.hasNextEvent ? 'Sí' : '—', tone: 'amber' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${TONES[it.tone]}`}>
              <Icon size={15} />
            </span>
            <div className="text-2xl font-bold text-gray-900 leading-none">{it.value}</div>
            <div className="text-[11px] text-gray-400 mt-1 leading-tight">{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}
