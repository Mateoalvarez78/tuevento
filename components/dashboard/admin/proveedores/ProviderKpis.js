'use client';

// KPIs globales de la cabecera del listado de proveedores — Proveedor 360°
// (Fase A). A propósito NO dependen de los filtros de la tabla (ver plan de
// Fase A): muestran el estado global de la plataforma. Separa deliberadamente
// conteos de ESTADO (a hoy: activos/suspendidos/verificados) de cifras de
// FLUJO del período (nuevos, volumen, comisión, neto, cancelaciones) — nunca
// se mezclan en una misma tarjeta.
import { Store, CheckCircle2, Ban, ShieldCheck, Package, UserPlus, DollarSign, Percent, Wallet, XCircle } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

export default function ProviderKpis({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(10)].map((_, i) => <MetricCard key={i} theme="dark" loading />)}
      </div>
    );
  }
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard theme="dark" icon={Store} label="Proveedores totales" value={summary.total} />
      <MetricCard theme="dark" icon={CheckCircle2} label="Activos" value={summary.active} tone="emerald" />
      <MetricCard theme="dark" icon={Ban} label="Suspendidos" value={summary.suspended} tone="amber" />
      <MetricCard theme="dark" icon={ShieldCheck} label="Verificados" value={summary.verified} tone="blue" />
      <MetricCard theme="dark" icon={Package} label="Con servicios publicados" value={summary.withPublishedServices} />
      <MetricCard theme="dark" icon={UserPlus} label="Nuevos en el período" value={summary.newInPeriod} tooltip="Últimos 30 días, salvo que apliques un rango de fechas." />
      <MetricCard theme="dark" icon={DollarSign} label="Volumen bruto" value={money(summary.grossAmount)} tone="emerald" tooltip="Reservas completadas o aceptadas y pagas." />
      <MetricCard theme="dark" icon={Percent} label="Comisión Eventonow" value={money(summary.commissionAmount)} tone="amber" />
      <MetricCard theme="dark" icon={Wallet} label="Neto a proveedores" value={money(summary.providerNetAmount)} tone="blue" />
      <MetricCard theme="dark" icon={XCircle} label="Cancelaciones" value={summary.cancellations} />
    </div>
  );
}
