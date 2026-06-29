'use client';

import { useAdminStats } from '@/hooks/useAdmin';
import { PROVIDER_STATUS, SERVICE_STATUS } from '@/utils/constants';

const STAT_CARDS = [
  { key: 'providers.pending',   label: 'Proveedores pendientes', color: 'text-amber-400',   bg: 'bg-amber-400/10'  },
  { key: 'providers.approved',  label: 'Proveedores activos',    color: 'text-emerald-400', bg: 'bg-emerald-400/10'},
  { key: 'services.pending_review', label: 'Servicios en revisión', color: 'text-blue-400', bg: 'bg-blue-400/10'  },
  { key: 'services.active',     label: 'Servicios publicados',   color: 'text-emerald-400', bg: 'bg-emerald-400/10'},
];

function dig(obj, path) {
  return path.split('.').reduce((o, k) => (o ? o[k] : 0), obj) || 0;
}

export default function AdminOverviewPage() {
  const { stats, loading } = useAdminStats();

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Estado actual de la plataforma</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>
              {loading ? '–' : dig(stats, card.key)}
            </p>
          </div>
        ))}
      </div>

      {/* Provider status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Proveedores por estado</h2>
          {!loading && stats && (
            <div className="space-y-3">
              {Object.entries(PROVIDER_STATUS).map(([status, cfg]) => {
                const count = stats.providers[status] || 0;
                const total = stats.totalProviders || 1;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-sm text-gray-400 w-28">{cfg.label}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cfg.dot}`}
                        style={{ width: `${Math.round((count / total) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-200 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Servicios por estado</h2>
          {!loading && stats && (
            <div className="space-y-3">
              {Object.entries(SERVICE_STATUS).map(([status, cfg]) => {
                const count = stats.services[status] || 0;
                const total = stats.totalServices || 1;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-sm text-gray-400 w-28">{cfg.label}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cfg.dot}`}
                        style={{ width: `${Math.round((count / total) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-200 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
