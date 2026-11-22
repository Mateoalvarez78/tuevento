'use client';

// Tab "Resumen" de Proveedor 360° (Fase A). Los InfoCard/InfoRow existían
// antes directamente en app/admin/proveedores/[id]/page.js — se movieron acá
// tal cual al introducir las pestañas, sin cambiar su contenido.
import { Calendar, Package, CalendarClock, DollarSign, Percent, Wallet, CheckCircle2, XCircle, Star } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { safeFormatDate, safeFormatDateTime } from '@/lib/date';
import { COMMISSION_LABEL } from '@/lib/commissionHelpers';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;
const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(0)}%`);

function InfoCard({ title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-200 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

export default function ProviderOverviewTab({ provider }) {
  const p = provider;
  return (
    <div className="space-y-5 w-full">
      {/* Métricas — fórmulas: tasa de aceptación = (accepted+completed) / (accepted+completed+rejected);
          tasa de cancelación = cancelled / total histórico. Ver plan de Fase A.
          Mismo criterio de grid que BookingKpis.js (8 tarjetas, xl:grid-cols-8)
          — antes quedaban en 4 columnas fijas sin aprovechar el ancho real
          de la página, que ahora ya no está capado por un max-w. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <MetricCard theme="dark" icon={Package} label="Servicios publicados" value={`${p.publishedServicesCount}/${p.servicesCount}`} />
        <MetricCard theme="dark" icon={CalendarClock} label="Reservas totales" value={p.bookingsPending + p.bookingsAccepted + p.bookingsCompleted + p.bookingsCancelled + p.bookingsRejected} />
        <MetricCard theme="dark" icon={DollarSign} label="Volumen bruto" value={money(p.grossAmount)} tone="emerald" tooltip="Reservas completadas o aceptadas y pagas." />
        <MetricCard theme="dark" icon={Percent} label="Comisión Eventonow" value={money(p.commissionAmount)} tone="amber" />
        <MetricCard theme="dark" icon={Wallet} label="Neto del proveedor" value={money(p.providerNetAmount)} tone="blue" />
        <MetricCard theme="dark" icon={CheckCircle2} label="Tasa de aceptación" value={pct(p.acceptanceRate)} tooltip="(Aceptadas + completadas) / reservas ya decididas (excluye pendientes)." />
        <MetricCard theme="dark" icon={XCircle} label="Tasa de cancelación" value={pct(p.cancellationRate)} tooltip="Canceladas sobre el total histórico de reservas." tone="amber" />
        <MetricCard theme="dark" icon={Star} label="Calificación" value={p.rating > 0 ? `${p.rating.toFixed(1)} ★` : '—'} sub={p.reviewCount ? `${p.reviewCount} reseña${p.reviewCount !== 1 ? 's' : ''}` : 'Sin reseñas'} />
      </div>

      {/* Info grid — mismo contenido que antes; se agrega xl:grid-cols-3 para
          que las 4-5 tarjetas se distribuyan en el ancho real de la página
          en vez de quedar solo 2 columnas muy anchas en desktop grande. */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <InfoCard title="Información del negocio">
          <InfoRow label="Nombre comercial" value={p.businessName || p.name} />
          <InfoRow label="Razón social" value={p.legalName || '—'} />
          <InfoRow label="RUT" value={p.taxId || '—'} />
          <InfoRow label="Categoría" value={p.categoryLabel} />
          <InfoRow label="Ciudad / Depto" value={[p.city, p.department].filter(Boolean).join(' / ') || '—'} />
          <InfoRow label="Dirección" value={p.address || '—'} />
          <InfoRow label="Zonas" value={p.zones?.join(', ') || '—'} />
          <InfoRow label="Descripción" value={p.description || '—'} />
        </InfoCard>
        <InfoCard title="Contacto">
          <InfoRow label="Responsable" value={p.ownerName || '—'} />
          <InfoRow label="Email" value={p.email || '—'} />
          <InfoRow label="Teléfono" value={p.phone || '—'} />
          <InfoRow label="WhatsApp" value={p.whatsapp || '—'} />
          <InfoRow label="Tiempo de respuesta" value={p.responseTime ? `${p.responseTime} (declarado)` : '—'} />
        </InfoCard>
        <InfoCard title="Comercial">
          <InfoRow label="Comisión" value={`${COMMISSION_LABEL} (única)`} />
          <InfoRow label="Moneda" value={p.currency || '—'} />
          <InfoRow label="Método de cobro" value={p.paymentMethod || '—'} />
        </InfoCard>
        <InfoCard title="Plataforma">
          <InfoRow label="ID" value={p.id} mono />
          <InfoRow label="Registrado" value={safeFormatDate(p.createdAt, '—')} />
          <InfoRow label="Activo desde" value={safeFormatDate(p.approvedAt, '—')} />
          <InfoRow label="Verificado" value={p.verified ? 'Sí' : 'No'} />
        </InfoCard>
        {p.internalNotes && (
          <InfoCard title="Notas internas">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{p.internalNotes}</p>
          </InfoCard>
        )}
      </div>

      {/* Próximos eventos — reservas aceptadas con fecha futura (máx. 5). La
          línea de tiempo completa de actividad/auditoría es Fase C. */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">Próximos eventos</h2>
        </div>
        {!p.upcomingBookings?.length ? (
          <p className="px-5 py-6 text-gray-500 text-sm">Sin eventos aceptados próximamente.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {p.upcomingBookings.map((b) => (
              <li key={b.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-gray-200 text-sm font-medium truncate">{b.serviceTitle}</p>
                  <p className="text-gray-500 text-xs">{b.clientName} · {b.requestNumber}</p>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs shrink-0">
                  <Calendar size={13} aria-hidden="true" />
                  {safeFormatDateTime(b.eventDate, b.eventTime, safeFormatDate(b.eventDate, '—'))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
