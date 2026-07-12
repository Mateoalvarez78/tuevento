'use client';

import { CalendarClock, CheckCircle2, Heart, Package, CalendarCheck } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

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
      {items.map((it) => (
        <MetricCard key={it.label} icon={it.icon} label={it.label} value={it.value} tone={it.tone} />
      ))}
    </div>
  );
}
