'use client';

import { CalendarClock, Clock, CheckCircle2, Trophy, XCircle, DollarSign, Percent, Receipt } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

export default function BookingKpis({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
      <MetricCard theme="dark" icon={CalendarClock} label="Total reservas" value={stats.total} />
      <MetricCard theme="dark" icon={Clock} label="Pendientes" value={stats.pending} tone="amber" />
      <MetricCard theme="dark" icon={CheckCircle2} label="Aceptadas" value={stats.accepted} tone="emerald" />
      <MetricCard theme="dark" icon={Trophy} label="Completadas" value={stats.completed} tone="blue" />
      <MetricCard theme="dark" icon={XCircle} label="Canceladas" value={stats.cancelled} tone="red" />
      <MetricCard theme="dark" icon={DollarSign} label="GMV" value={money(stats.gmv)} tone="emerald" />
      <MetricCard theme="dark" icon={Percent} label="Comisión Eventonow" value={money(stats.commission)} tone="amber" />
      <MetricCard theme="dark" icon={Receipt} label="Ticket promedio" value={money(stats.avgTicket)} />
    </div>
  );
}
