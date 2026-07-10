'use client';

import { useState } from 'react';
import { Search, Eye, EyeOff, AlertTriangle, Flag } from 'lucide-react';
import { useAdminReviews } from '@/hooks/useAdmin';
import RatingStars from '@/components/RatingStars';
import { safeFormatDate } from '@/lib/date';

const STATUS_TABS = [
  { value: '',         label: 'Todas' },
  { value: 'visible',  label: 'Visibles' },
  { value: 'reported', label: 'Reportadas' },
  { value: 'hidden',   label: 'Ocultas' },
];

const STATUS_STYLES = {
  visible:  { label: 'Visible',   cls: 'bg-emerald-500/10 text-emerald-400' },
  hidden:   { label: 'Oculta',    cls: 'bg-gray-700 text-gray-300' },
  reported: { label: 'Reportada', cls: 'bg-red-500/10 text-red-400' },
  deleted:  { label: 'Eliminada', cls: 'bg-gray-800 text-gray-500' },
};

export default function AdminResenasPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const { reviews, loading, error, hide, restore, reload } = useAdminReviews({ status: activeTab || undefined });

  const displayed = reviews.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.clientName || '').toLowerCase().includes(q) ||
      (r.serviceTitle || '').toLowerCase().includes(q) ||
      (r.providerName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reseñas</h1>
          <p className="text-gray-400 text-sm mt-1">{reviews.length} en total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por cliente, servicio o proveedor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.value
                ? 'text-primary border-b-2 border-primary -mb-px bg-primary/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Cargando…</div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertTriangle size={28} className="mx-auto text-amber-400 mb-3" />
            <p className="text-gray-300 text-sm mb-4">{error?.message || 'No pudimos cargar las reseñas'}</p>
            <button onClick={reload} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">Reintentar</button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            {reviews.length === 0 ? 'Todavía no hay reseñas en la plataforma.' : 'No hay reseñas con este filtro.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {displayed.map((r) => {
              const statusCfg = STATUS_STYLES[r.status] || STATUS_STYLES.visible;
              return (
                <div key={r.id} className="p-5 hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <RatingStars rating={r.rating} size={13} />
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.cls}`}>
                          {r.status === 'reported' && <Flag size={9} className="inline mr-1 -mt-0.5" />}
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200 font-medium truncate">
                        {r.clientName} <span className="text-gray-500 font-normal">→ {r.providerName}</span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">{r.serviceTitle} · {safeFormatDate(r.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === 'hidden' ? (
                        <button
                          onClick={() => restore(r.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Eye size={12} /> Restaurar
                        </button>
                      ) : (
                        <button
                          onClick={() => hide(r.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <EyeOff size={12} /> Ocultar
                        </button>
                      )}
                    </div>
                  </div>
                  {r.title && <p className="text-sm font-semibold text-gray-200 mt-2">{r.title}</p>}
                  {r.comment && <p className="text-sm text-gray-400 mt-1 leading-relaxed">{r.comment}</p>}
                  {r.providerReply && (
                    <div className="mt-2.5 bg-gray-800/60 border-l-2 border-primary/40 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-bold text-primary mb-0.5">Respuesta del proveedor</p>
                      <p className="text-xs text-gray-400">{r.providerReply}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
