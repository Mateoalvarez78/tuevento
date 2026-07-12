'use client';

import { Store, PauseCircle, Users, Package, CalendarClock, DollarSign, Percent, Receipt, UserPlus } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

export default function AdminStats({ stats }) {
  const s = stats;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <MetricCard theme="dark" icon={Store} label="Proveedores" value={s.providers.total} sub={`${s.providers.active} activos`} />
      <MetricCard theme="dark" icon={PauseCircle} label="Suspendidos" value={s.providers.suspended} highlight={s.providers.suspended > 0} />
      <MetricCard theme="dark" icon={Users} label="Clientes registrados" value={s.users.clients} />
      <MetricCard theme="dark" icon={Package} label="Servicios publicados" value={s.services.active} sub={`${s.services.pendingReview} en revisión`} />
      <MetricCard theme="dark" icon={CalendarClock} label="Reservas activas" value={s.bookings.active} sub={`${s.bookings.total} totales`} />
      <MetricCard theme="dark" icon={DollarSign} label="Ingresos (GMV)" value={money(s.revenue.gmv)} sub="aceptadas + completadas" />
      <MetricCard theme="dark" icon={Percent} label="Comisión Eventonow" value={money(s.revenue.totalCommission)} />
      <MetricCard theme="dark" icon={Receipt} label="Ticket promedio" value={money(s.revenue.avgTicket)} />
      <MetricCard theme="dark" icon={UserPlus} label="Nuevos usuarios (30d)" value={s.users.newLast30} />
      <MetricCard theme="dark" icon={Users} label="Usuarios totales" value={s.users.total} />
    </div>
  );
}
