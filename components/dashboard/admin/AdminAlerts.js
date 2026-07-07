'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const DOT = { amber: 'bg-amber-400', blue: 'bg-blue-400', gray: 'bg-gray-500' };

export default function AdminAlerts({ alerts = [] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="text-sm text-gray-300">No hay alertas. Todo en orden. 🎉</span>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={15} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-gray-300">Alertas administrativas</h3>
      </div>
      <div className="space-y-2.5">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[a.tone] || DOT.gray}`} />
              <span className="text-sm text-gray-300 truncate">{a.text}</span>
            </div>
            {a.href && (
              <Link href={a.href} className="text-xs font-semibold text-primary hover:underline shrink-0 inline-flex items-center gap-1 whitespace-nowrap">
                Revisar <ArrowRight size={12} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
