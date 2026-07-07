'use client';

import { Check, X } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }) : '—';

export default function PendingProviders({ providers = [], onApprove, onReject }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Proveedores pendientes</h3>
        {providers.length > 0 && <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{providers.length}</span>}
      </div>

      {providers.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">No hay proveedores esperando aprobación. 🎉</div>
      ) : (
        <div className="space-y-2.5">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-950 border border-gray-800">
              <div className="w-9 h-9 rounded-xl bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center text-gray-500">
                {p.logoUrl ? <img src={p.logoUrl} alt={p.businessName} className="w-full h-full object-cover" /> : (p.businessName?.[0] || '?')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-100 truncate">{p.businessName}</p>
                <p className="text-xs text-gray-500 truncate">{p.email} · {fmtDate(p.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => onReject?.(p)} title="Rechazar" className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                  <X size={15} />
                </button>
                <button onClick={() => onApprove?.(p)} title="Aprobar" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                  <Check size={13} /> Aprobar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
