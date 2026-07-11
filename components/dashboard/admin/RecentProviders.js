'use client';

import Link from 'next/link';
import { safeFormatDate } from '@/lib/date';

const fmtDate = safeFormatDate;

export default function RecentProviders({ providers = [] }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Proveedores recientes</h3>
        <Link href="/admin/proveedores" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>
      </div>

      {providers.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Todavía no hay proveedores creados.</div>
      ) : (
        <div className="space-y-2.5">
          {providers.map((p) => (
            <Link
              key={p.id}
              href={`/admin/proveedores/${p.id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center text-gray-500">
                {p.logoUrl ? <img src={p.logoUrl} alt={p.businessName} className="w-full h-full object-cover" /> : (p.businessName?.[0] || '?')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-100 truncate">{p.businessName}</p>
                <p className="text-xs text-gray-500 truncate">{p.email} · {fmtDate(p.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
