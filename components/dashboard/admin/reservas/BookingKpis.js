'use client';

import { CalendarClock, Clock, CheckCircle2, Trophy, XCircle, DollarSign, Percent, Receipt } from 'lucide-react';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

function Kpi({ icon: Icon, label, value, tone = 'gray' }) {
  const tones = {
    gray: 'text-gray-400 bg-gray-800',
    amber: 'text-amber-400 bg-amber-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    red: 'text-red-400 bg-red-500/10',
  };
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tones[tone]}`}><Icon size={14} /></span>
        <span className="text-[11px] text-gray-500 font-medium leading-tight">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}

export default function BookingKpis({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      <Kpi icon={CalendarClock} label="Total reservas" value={stats.total} />
      <Kpi icon={Clock} label="Pendientes" value={stats.pending} tone="amber" />
      <Kpi icon={CheckCircle2} label="Aceptadas" value={stats.accepted} tone="emerald" />
      <Kpi icon={Trophy} label="Completadas" value={stats.completed} tone="blue" />
      <Kpi icon={XCircle} label="Canceladas" value={stats.cancelled} tone="red" />
      <Kpi icon={DollarSign} label="GMV" value={money(stats.gmv)} tone="emerald" />
      <Kpi icon={Percent} label="Comisión Eventonow" value={money(stats.commission)} tone="amber" />
      <Kpi icon={Receipt} label="Ticket promedio" value={money(stats.avgTicket)} />
    </div>
  );
}
