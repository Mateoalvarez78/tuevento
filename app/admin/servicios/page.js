'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Check, X, Eye, Pause, ExternalLink, AlertTriangle, MapPin } from 'lucide-react';
import { useAdminServices } from '@/hooks/useAdmin';
import { adminService } from '@/services/adminService';
import ServiceStatusBadge from '@/components/ServiceStatusBadge';
import { assetUrl } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import { safeFormatDate } from '@/lib/date';

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'pending_review', label: 'En revisión' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'draft', label: 'Borradores' },
  { value: 'rejected', label: 'Rechazados' },
];

function ReasonModal({ title, ctaLabel, ctaClass, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-white font-semibold mb-3">{title}</h3>
        <textarea
          placeholder="Motivo (requerido)…"
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
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40 ${ctaClass}`}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({ serviceId, onClose }) {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService.services.getById(serviceId)
      .then((s) => { if (!cancelled) { setService(s); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err?.message || 'No se pudo cargar el detalle'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [serviceId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 border-l border-gray-800 shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h3 className="text-base font-bold text-white">Detalle del servicio</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-800 flex items-center justify-center text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="p-5 space-y-3">
            <div className="skeleton h-40 w-full rounded-xl bg-gray-800" />
            <div className="skeleton h-4 w-2/3 rounded bg-gray-800" />
            <div className="skeleton h-4 w-1/2 rounded bg-gray-800" />
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="mx-auto text-amber-400 mb-3" />
            <p className="text-gray-300 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && service && (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <ServiceStatusBadge status={service._raw.status} size="md" />
              {service.verified && <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Verificado</span>}
            </div>

            {service.images?.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {service.images.slice(0, 6).map((img, i) => (
                  <img key={i} src={assetUrl(img)} alt="" className="w-full h-20 object-cover rounded-lg bg-gray-800" />
                ))}
              </div>
            ) : (
              <div className="h-24 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 text-sm">Sin imágenes</div>
            )}

            <div>
              <h4 className="text-lg font-bold text-white">{service.serviceTitle}</h4>
              <p className="text-sm text-gray-400">{service.categoryEmoji} {service.categoryLabel} · {service.businessName}</p>
            </div>

            {service.longDescription && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-gray-300 leading-relaxed">{service.longDescription}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Precio desde</p>
                <p className="text-gray-200 font-semibold">${formatCurrency(service.priceFrom)} <span className="text-xs text-gray-500">{service.priceType === 'per_person' ? 'por persona' : service.priceType === 'per_hour' ? 'por hora' : 'por evento'}</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reservas</p>
                <p className="text-gray-200 font-semibold">{service.totalBookings}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Zonas de cobertura</p>
                {service.zones?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {service.zones.map((z) => (
                      <span key={z} className="inline-flex items-center gap-1 text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                        <MapPin size={10} /> {z}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">Sin zonas definidas</p>}
              </div>
            </div>

            {service.packages?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Menús / paquetes</p>
                <div className="space-y-2">
                  {service.packages.map((p) => (
                    <div key={p.id} className="bg-gray-800/60 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-200">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                      </div>
                      <p className="text-sm font-semibold text-gray-200">${formatCurrency(p.price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service._raw.status_reason && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-400 mb-1">Motivo (último rechazo/pausa)</p>
                <p className="text-sm text-amber-200">{service._raw.status_reason}</p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Creado el {safeFormatDate(service._raw.created_at)}
              {service._raw.published_at && ` · Publicado el ${safeFormatDate(service._raw.published_at)}`}
            </div>

            {service._raw.status === 'active' && (
              <Link href={`/proveedor/${service.id}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <ExternalLink size={14} /> Ver publicación
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminServiciosPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [pauseTarget, setPauseTarget] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const { services, loading, error, approve, reject, pause, reload } = useAdminServices();

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

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Cargando…</div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertTriangle size={28} className="mx-auto text-amber-400 mb-3" />
            <p className="text-gray-300 text-sm mb-4">{error?.message || 'No pudimos cargar los servicios'}</p>
            <button onClick={reload} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">Reintentar</button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            {services.length === 0 ? 'Todavía no hay servicios creados en la plataforma.' : 'No hay servicios con este filtro.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Servicio</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Proveedor</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Precio</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Zonas</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Creado</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayed.map((s) => (
                <tr key={s.id} className="hover:bg-gray-800/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 shrink-0 flex items-center justify-center">
                        {s.primaryImage ? <img src={assetUrl(s.primaryImage)} alt="" className="w-full h-full object-cover" /> : <span className="text-base">{s.categoryEmoji || '📦'}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-100 font-medium truncate">{s.title}</p>
                        <p className="text-gray-500 text-xs">{s.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-400 hidden md:table-cell">{s.providerName}</td>
                  <td className="px-4 py-4 text-gray-400 hidden lg:table-cell">${formatCurrency(s.priceFrom)}</td>
                  <td className="px-4 py-4 text-gray-400 hidden lg:table-cell max-w-[160px] truncate">{s.zones?.length ? s.zones.join(', ') : '—'}</td>
                  <td className="px-4 py-4 text-gray-400 hidden sm:table-cell">{safeFormatDate(s.createdAt)}</td>
                  <td className="px-4 py-4">
                    <ServiceStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDetailId(s.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-700 text-gray-300 hover:border-primary/50 hover:text-primary rounded-lg text-xs font-semibold transition-colors"
                        title="Ver detalle"
                      >
                        <Eye size={12} /> <span className="hidden sm:inline">Ver</span>
                      </button>
                      {s.status === 'pending_review' && (
                        <>
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
                        </>
                      )}
                      {s.status === 'active' && (
                        <button
                          onClick={() => setPauseTarget(s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Pause size={12} /> Pausar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {rejectTarget && (
        <ReasonModal
          title="Rechazar servicio"
          ctaLabel="Rechazar"
          ctaClass="bg-red-600 hover:bg-red-700"
          onConfirm={(reason) => { reject(rejectTarget, reason); setRejectTarget(null); }}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {pauseTarget && (
        <ReasonModal
          title="Pausar servicio publicado"
          ctaLabel="Pausar"
          ctaClass="bg-amber-600 hover:bg-amber-700"
          onConfirm={(reason) => { pause(pauseTarget, reason); setPauseTarget(null); }}
          onCancel={() => setPauseTarget(null)}
        />
      )}

      {detailId && <DetailDrawer serviceId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
