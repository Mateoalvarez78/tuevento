'use client';

import Link from 'next/link';
import { ExternalLink, Package } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import ServiceStatusBadge from '@/components/ServiceStatusBadge';
import { safeFormatDate } from '@/lib/date';

const fmtDate = safeFormatDate;

export default function RecentServices({ services = [] }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Servicios recientes</h3>
        <Link href="/admin/servicios" className="text-xs font-semibold text-primary hover:underline">Ver todos</Link>
      </div>
      {services.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Todavía no hay servicios.</div>
      ) : (
        <div className="space-y-2.5">
          {services.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-950 border border-gray-800">
              <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                <AppIcon icon={Package} size={16} className="text-gray-500" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-100 truncate">{s.title}</p>
                <p className="text-xs text-gray-500 truncate">{s.providerName} · {s.category} · {fmtDate(s.createdAt)}</p>
              </div>
              <ServiceStatusBadge status={s.status} />
              <Link href={`/proveedor/${s.id}`} target="_blank" className="p-1.5 text-gray-500 hover:text-primary transition-colors shrink-0" aria-label="Ver">
                <AppIcon icon={ExternalLink} size={15} aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
