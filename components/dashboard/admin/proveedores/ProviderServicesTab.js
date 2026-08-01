'use client';

// Tab "Servicios" de Proveedor 360° (Fase A) — misma tabla que ya existía en
// la ficha de proveedor, con calificación y última actualización agregadas.
// No se agrega edición administrativa nueva (el pedido explícitamente no la
// quiere sin un flujo seguro/auditado ya existente) — solo permite abrir la
// publicación real cuando el servicio está activo.
import ServiceStatusBadge from '@/components/ServiceStatusBadge';
import EmptyState from '@/components/EmptyState';
import { Package, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { safeFormatDate } from '@/lib/date';
import { TABLE_HEAD_CLS, TABLE_ROW_HOVER_CLS } from '@/components/Table';

export default function ProviderServicesTab({ services = [] }) {
  return (
    <section className="w-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300">Servicios ({services.length})</h2>
      </div>
      {services.length === 0 ? (
        <EmptyState icon={Package} title="Sin servicios" description="Este proveedor todavía no cargó ningún servicio." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className={TABLE_HEAD_CLS.dark}>
                <th className="text-left px-5 py-3 font-medium">Servicio</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Precio desde</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Reservas</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Calificación</th>
                <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Publicado</th>
                <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Última actualización</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {services.map((s) => (
                <tr key={s.id} className={TABLE_ROW_HOVER_CLS.dark}>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-200 font-medium">{s.title}</p>
                    <p className="text-gray-500 text-xs">{s.category}</p>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 hidden md:table-cell">
                    ${formatCurrency(s.priceFrom)}
                  </td>
                  <td className="px-4 py-3.5">
                    <ServiceStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 hidden lg:table-cell">{s.totalBookings}</td>
                  <td className="px-4 py-3.5 text-gray-400 hidden lg:table-cell">
                    {s.ratingAvg > 0 ? `★ ${s.ratingAvg.toFixed(1)} (${s.reviewCount})` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs hidden xl:table-cell">
                    {safeFormatDate(s.publishedAt, '—')}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs hidden xl:table-cell">
                    {safeFormatDate(s.updatedAt, '—')}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {s.status === 'active' && (
                      <a
                        href={`/proveedor/${s.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary transition-colors"
                      >
                        Ver publicación <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
