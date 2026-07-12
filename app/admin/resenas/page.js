'use client';

import { useState } from 'react';
import { Search, Eye, EyeOff, AlertTriangle, Flag, Star } from 'lucide-react';
import { useAdminReviews } from '@/hooks/useAdmin';
import RatingStars from '@/components/RatingStars';
import { safeFormatDate } from '@/lib/date';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Badge from '@/components/Badge';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

const STATUS_TABS = [
  { value: '',         label: 'Todas' },
  { value: 'visible',  label: 'Visibles' },
  { value: 'reported', label: 'Reportadas' },
  { value: 'hidden',   label: 'Ocultas' },
];

const STATUS_STYLES = {
  visible:  { label: 'Visible',   bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-transparent' },
  hidden:   { label: 'Oculta',    bg: 'bg-gray-700',        text: 'text-gray-300',    border: 'border-transparent' },
  reported: { label: 'Reportada', bg: 'bg-red-500/10',      text: 'text-red-400',     border: 'border-transparent', icon: Flag },
  deleted:  { label: 'Eliminada', bg: 'bg-gray-800',        text: 'text-gray-500',    border: 'border-transparent' },
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
      <PageHeader theme="dark" title="Reseñas" subtitle={`${reviews.length} en total`} className="mb-5 sm:mb-6" />

      {/* Search */}
      <Input
        variant="dark"
        icon={Search}
        wrapperClassName="max-w-sm mb-5"
        placeholder="Buscar por cliente, servicio o proveedor…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-lg bg-gray-800" />)}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AppIcon icon={AlertTriangle} size={28} className="mx-auto text-amber-400 mb-3" aria-hidden="true" />
            <p className="text-gray-300 text-sm mb-4">{error?.message || 'No pudimos cargar las reseñas'}</p>
            <Button onClick={reload}>Reintentar</Button>
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={Star}
            title={reviews.length === 0 ? 'Todavía no hay reseñas' : 'Sin resultados'}
            description={reviews.length === 0 ? 'Todavía no hay reseñas en la plataforma.' : 'No hay reseñas con este filtro.'}
          />
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
                        <Badge bg={statusCfg.bg} text={statusCfg.text} border={statusCfg.border} icon={statusCfg.icon} label={statusCfg.label} />
                      </div>
                      <p className="text-sm text-gray-200 font-medium truncate">
                        {r.clientName} <span className="text-gray-500 font-normal">→ {r.providerName}</span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">{r.serviceTitle} · {safeFormatDate(r.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === 'hidden' ? (
                        <Button variant="success" size="sm" icon={Eye} onClick={() => restore(r.id)}>Restaurar</Button>
                      ) : (
                        <Button variant="danger" size="sm" icon={EyeOff} onClick={() => hide(r.id)}>Ocultar</Button>
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
