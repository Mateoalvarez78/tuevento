'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Check, X, Eye, Pause, ExternalLink, AlertTriangle, MapPin, Package } from 'lucide-react';
import { useAdminServices } from '@/hooks/useAdmin';
import { adminService } from '@/services/adminService';
import ServiceStatusBadge from '@/components/ServiceStatusBadge';
import { assetUrl } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import { safeFormatDate } from '@/lib/date';
import { getCategoryIcon } from '@/utils/icons';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Drawer from '@/components/Drawer';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { TABLE_HEAD_CLS, TABLE_ROW_HOVER_CLS } from '@/components/Table';

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'pending_review', label: 'En revisión' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'draft', label: 'Borradores' },
  { value: 'rejected', label: 'Rechazados' },
];

function ReasonModal({ title, ctaLabel, ctaVariant, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open
      onClose={onCancel}
      theme="dark"
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="ghost" theme="dark" className="ml-auto" onClick={onCancel}>Cancelar</Button>
          <Button variant={ctaVariant} disabled={!reason.trim()} onClick={() => onConfirm(reason)}>{ctaLabel}</Button>
        </>
      }
    >
      <textarea
        placeholder="Motivo (requerido)…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60 resize-none"
      />
    </Modal>
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
    <Drawer open onClose={onClose} theme="dark" title="Detalle del servicio">
      {loading && (
        <div className="space-y-3">
          <div className="skeleton h-40 w-full rounded-xl bg-gray-800" />
          <div className="skeleton h-4 w-2/3 rounded bg-gray-800" />
          <div className="skeleton h-4 w-1/2 rounded bg-gray-800" />
        </div>
      )}

      {!loading && error && (
        <div className="py-8 text-center">
          <AppIcon icon={AlertTriangle} size={28} className="mx-auto text-amber-400 mb-3" aria-hidden="true" />
          <p className="text-gray-300 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && service && (
        <div className="space-y-5">
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
            <p className="text-sm text-gray-400">{service.categoryLabel} · {service.businessName}</p>
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
                      <AppIcon icon={MapPin} size={10} aria-hidden="true" /> {z}
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
              <AppIcon icon={ExternalLink} size={14} aria-hidden="true" /> Ver publicación
            </Link>
          )}
        </div>
      )}
    </Drawer>
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
      <PageHeader theme="dark" title="Servicios" subtitle={`${services.length} en total`} className="mb-5 sm:mb-6" />

      {/* Search */}
      <Input
        variant="dark"
        icon={Search}
        wrapperClassName="max-w-sm mb-5"
        placeholder="Buscar por título o proveedor…"
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

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded-lg bg-gray-800" />)}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AppIcon icon={AlertTriangle} size={28} className="mx-auto text-amber-400 mb-3" aria-hidden="true" />
            <p className="text-gray-300 text-sm mb-4">{error?.message || 'No pudimos cargar los servicios'}</p>
            <Button onClick={reload}>Reintentar</Button>
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={Package}
            title={services.length === 0 ? 'Todavía no hay servicios' : 'Sin resultados'}
            description={services.length === 0 ? 'Todavía no hay servicios creados en la plataforma.' : 'No hay servicios con este filtro.'}
          />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className={TABLE_HEAD_CLS.dark}>
                <th className="text-left px-5 py-3.5 font-medium">Servicio</th>
                <th className="text-left px-4 py-3.5 font-medium hidden md:table-cell">Proveedor</th>
                <th className="text-left px-4 py-3.5 font-medium hidden lg:table-cell">Precio</th>
                <th className="text-left px-4 py-3.5 font-medium hidden lg:table-cell">Zonas</th>
                <th className="text-left px-4 py-3.5 font-medium hidden sm:table-cell">Creado</th>
                <th className="text-left px-4 py-3.5 font-medium">Estado</th>
                <th className="px-4 py-3.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayed.map((s) => (
                <tr key={s.id} className={`${TABLE_ROW_HOVER_CLS.dark} group`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 shrink-0 flex items-center justify-center">
                        {s.primaryImage
                          ? <img src={assetUrl(s.primaryImage)} alt="" className="w-full h-full object-cover" />
                          : <AppIcon icon={getCategoryIcon(s.category)} size={18} strokeWidth={1.5} className="text-gray-500" aria-hidden="true" />}
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
                      <Button variant="outline" theme="dark" size="sm" icon={Eye} onClick={() => setDetailId(s.id)}>
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                      {s.status === 'pending_review' && (
                        <>
                          <Button variant="success" size="sm" icon={Check} onClick={() => approve(s.id)}>Aprobar</Button>
                          <Button variant="danger" size="sm" icon={X} onClick={() => setRejectTarget(s.id)}>Rechazar</Button>
                        </>
                      )}
                      {s.status === 'active' && (
                        <Button variant="warning" size="sm" icon={Pause} onClick={() => setPauseTarget(s.id)}>Pausar</Button>
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
          ctaVariant="danger"
          onConfirm={(reason) => { reject(rejectTarget, reason); setRejectTarget(null); }}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {pauseTarget && (
        <ReasonModal
          title="Pausar servicio publicado"
          ctaLabel="Pausar"
          ctaVariant="warning"
          onConfirm={(reason) => { pause(pauseTarget, reason); setPauseTarget(null); }}
          onCancel={() => setPauseTarget(null)}
        />
      )}

      {detailId && <DetailDrawer serviceId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
