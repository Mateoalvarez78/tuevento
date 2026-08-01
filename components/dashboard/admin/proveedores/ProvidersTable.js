'use client';

// Tabla del listado de Proveedor 360° (Fase A). Columnas núcleo siempre
// visibles (Proveedor, Estado, Acciones); el resto se revela progresivamente
// en pantallas más anchas (mismo criterio `hidden md/lg/xl:table-cell` que ya
// usan proveedores/servicios/reservas) para no saturar la tabla en mobile —
// el detalle completo vive en la ficha "Proveedor 360°".
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Users, ShieldCheck } from 'lucide-react';
import ProviderStatusBadge from '@/components/ProviderStatusBadge';
import Avatar from '@/components/Avatar';
import AppIcon from '@/components/AppIcon';
import Tooltip from '@/components/Tooltip';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { safeFormatDate, formatRelativeDate } from '@/lib/date';
import { TABLE_HEAD_CLS, TABLE_ROW_HOVER_CLS } from '@/components/Table';
import { assetUrl } from '@/services/api';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;

function bookingsTooltip(p) {
  return `${p.bookingsPending} pendiente(s) · ${p.bookingsAccepted} aceptada(s) · ${p.bookingsCompleted} completada(s) · ${p.bookingsCancelledRejected} cancelada(s)/rechazada(s)`;
}

export default function ProvidersTable({ providers = [], loading, pagination, onPage }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 space-y-2">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-11 w-full rounded-lg bg-gray-800" />)}
      </div>
    );
  }
  if (!providers.length) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900">
        <EmptyState icon={Users} title="Sin resultados" description="No hay proveedores con estos filtros." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className={TABLE_HEAD_CLS.dark}>
              <th className="text-left px-5 py-3.5 font-medium">Proveedor</th>
              <th className="text-left px-4 py-3.5 font-medium hidden md:table-cell">Ciudad / Zona</th>
              <th className="text-left px-4 py-3.5 font-medium">Estado</th>
              <th className="text-left px-4 py-3.5 font-medium hidden lg:table-cell">Alta</th>
              <th className="text-left px-4 py-3.5 font-medium hidden md:table-cell">Servicios</th>
              <th className="text-left px-4 py-3.5 font-medium hidden lg:table-cell">Reservas</th>
              <th className="text-right px-4 py-3.5 font-medium hidden xl:table-cell">Facturación</th>
              <th className="text-right px-4 py-3.5 font-medium hidden xl:table-cell">Comisión</th>
              <th className="text-right px-4 py-3.5 font-medium hidden xl:table-cell">Neto</th>
              <th className="text-left px-4 py-3.5 font-medium hidden lg:table-cell">Calificación</th>
              <th className="text-left px-4 py-3.5 font-medium hidden xl:table-cell">Última actividad</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {providers.map((p) => (
              <tr key={p.id} className={`${TABLE_ROW_HOVER_CLS.dark} group`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={p.logo_url ? assetUrl(p.logo_url) : null} name={p.name} size="sm" shape="square" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-gray-100 font-medium truncate">{p.name}</p>
                        {p.verified && <AppIcon icon={ShieldCheck} size={13} className="text-blue-400 shrink-0" aria-label="Verificado" />}
                      </div>
                      <p className="text-gray-500 text-xs truncate">{p.ownerName || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-400 hidden md:table-cell">
                  {p.city || (p.zones?.[0] ?? '—')}
                </td>
                <td className="px-4 py-4">
                  <ProviderStatusBadge status={p.status} />
                </td>
                <td className="px-4 py-4 text-gray-500 text-xs hidden lg:table-cell">
                  {safeFormatDate(p.createdAt, '—')}
                </td>
                <td className="px-4 py-4 text-gray-400 hidden md:table-cell">
                  {p.publishedServicesCount}/{p.servicesCount}
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <span>{p.bookingsActive + p.bookingsCompleted}</span>
                    <Tooltip text={bookingsTooltip(p)} />
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-gray-200 hidden xl:table-cell whitespace-nowrap">{money(p.grossAmount)}</td>
                <td className="px-4 py-4 text-right text-amber-400 hidden xl:table-cell whitespace-nowrap">{money(p.commissionAmount)}</td>
                <td className="px-4 py-4 text-right text-emerald-400 hidden xl:table-cell whitespace-nowrap">{money(p.providerNetAmount)}</td>
                <td className="px-4 py-4 text-gray-400 hidden lg:table-cell whitespace-nowrap">
                  {p.rating > 0 ? `★ ${p.rating.toFixed(1)} (${p.reviewCount})` : '— (sin reseñas)'}
                </td>
                <td className="px-4 py-4 text-gray-500 text-xs hidden xl:table-cell whitespace-nowrap">
                  {formatRelativeDate(p.lastActivityAt, '—')}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/admin/proveedores/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary transition-colors group-hover:text-gray-300"
                  >
                    Ver
                    <AppIcon icon={ChevronRight} size={13} aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <span className="text-xs text-gray-500">Página {pagination.page} de {pagination.totalPages} · {pagination.total} proveedor{pagination.total !== 1 ? 'es' : ''}</span>
          <div className="flex items-center gap-1.5">
            <Button iconOnly icon={ChevronLeft} variant="outline" theme="dark" size="sm" aria-label="Página anterior" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)} />
            <Button iconOnly icon={ChevronRight} variant="outline" theme="dark" size="sm" aria-label="Página siguiente" disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}
