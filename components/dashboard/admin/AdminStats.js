'use client';

import { Store, PauseCircle, Users, Package, CalendarClock, DollarSign, Percent, Receipt, UserPlus } from 'lucide-react';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

function Card({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-amber-500/40 bg-amber-500/5' : 'border-gray-800 bg-gray-900'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${highlight ? 'bg-amber-500/15 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
          <Icon size={15} />
        </span>
        <span className="text-[11px] text-gray-400 font-medium leading-tight">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AdminStats({ stats }) {
  const s = stats;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <Card icon={Store} label="Proveedores" value={s.providers.total} sub={`${s.providers.active} activos`} />
      <Card icon={PauseCircle} label="Suspendidos" value={s.providers.suspended} highlight={s.providers.suspended > 0} />
      <Card icon={Users} label="Clientes registrados" value={s.users.clients} />
      <Card icon={Package} label="Servicios publicados" value={s.services.active} sub={`${s.services.pendingReview} en revisión`} />
      <Card icon={CalendarClock} label="Reservas activas" value={s.bookings.active} sub={`${s.bookings.total} totales`} />
      <Card icon={DollarSign} label="Ingresos (GMV)" value={money(s.revenue.gmv)} sub="aceptadas + completadas" />
      <Card icon={Percent} label="Comisión Eventonow" value={money(s.revenue.totalCommission)} />
      <Card icon={Receipt} label="Ticket promedio" value={money(s.revenue.avgTicket)} />
      <Card icon={UserPlus} label="Nuevos usuarios (30d)" value={s.users.newLast30} />
      <Card icon={Users} label="Usuarios totales" value={s.users.total} />
    </div>
  );
}
