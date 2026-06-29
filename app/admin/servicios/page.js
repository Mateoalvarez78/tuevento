'use client';

import { useState } from 'react';
import { Search, Check, X } from 'lucide-react';
import { useAdminServices } from '@/hooks/useAdmin';
import ServiceStatusBadge from '@/components/ServiceStatusBadge';
import { formatDate, formatCurrency } from '@/utils/formatters';

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'pending_review', label: 'En revisión' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'draft', label: 'Borradores' },
  { value: 'rejected', label: 'Rechazados' },
];

function RejectModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-white font-semibold mb-3">Rechazar servicio</h3>
        <textarea
          placeholder="Motivo del rechazo (requerido)…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60 resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancelar</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminServiciosPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);

  const { services, loading, approve, reject } = useAdminServices();

  const displayed = services.filter((s) => {
    const matchStatus = !activeTab || s.status === activeTab;
    const matchSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.providerName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Servicios</h1>
          <p className="text-gray-400 text-sm mt-1">{services.length} en total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por título o proveedor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.value
                ? 'text-primary border-b-2 border-primary -mb-px bg-primary/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Cargando…</div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No hay servicios con este filtro.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Servicio</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Proveedor</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Precio</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayed.map((s) => (
                <tr key={s.id} className="hover:bg-gray-800/50 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-gray-100 font-medium">{s.title}</p>
                    <p className="text-gray-500 text-xs">{s.category}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-400 hidden md:table-cell">{s.providerName}</td>
                  <td className="px-4 py-4 text-gray-400 hidden lg:table-cell">
                    ${formatCurrency(s.priceFrom)}
                  </td>
                  <td className="px-4 py-4">
                    <ServiceStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    {s.status === 'pending_review' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => approve(s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Check size={12} /> Aprobar
                        </button>
                        <button
                          onClick={() => setRejectTarget(s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <X size={12} /> Rechazar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          onConfirm={(reason) => { reject(rejectTarget, reason); setRejectTarget(null); }}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
