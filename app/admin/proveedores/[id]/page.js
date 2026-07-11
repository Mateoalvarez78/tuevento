'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Pause, Ban, RotateCcw, AlertTriangle } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { assetUrl } from '@/services/api';
import ProviderStatusBadge from '@/components/ProviderStatusBadge';
import ServiceStatusBadge from '@/components/ServiceStatusBadge';
import { formatCurrency } from '@/utils/formatters';
import { safeFormatDate } from '@/lib/date';

function ConfirmModal({ title, description, confirmLabel, confirmClass, onConfirm, onCancel, requireReason }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-gray-400 text-sm mt-1">{description}</p>
          </div>
        </div>
        {requireReason && (
          <textarea
            placeholder="Motivo (requerido)…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60 resize-none mb-4"
          />
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={requireReason && !reason.trim()}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProviderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // 'suspend' | 'deactivate' | 'activate'

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, svcs] = await Promise.all([
        adminService.getProvider(id),
        adminService.getProviderServices(id).catch(() => []),
      ]);
      setProvider(p);
      setServices(svcs || []);
    } catch (e) {
      setError(e?.message || 'No se pudo cargar el proveedor');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) {
    return <div className="p-8 text-gray-500 text-sm">Cargando proveedor…</div>;
  }
  if (error || !provider) {
    return (
      <div className="p-8">
        <Link href="/admin/proveedores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-4"><ArrowLeft size={15} /> Proveedores</Link>
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-400 text-sm">
          {error || 'Proveedor no encontrado.'}
        </div>
      </div>
    );
  }

  const displayName = provider.businessName || provider.name || 'Proveedor';

  const STATUS_FOR_ACTION = { suspend: 'suspended', deactivate: 'inactive', activate: 'active' };

  const handleAction = async (type, reason) => {
    try {
      await adminService.providers.updateStatus(id, STATUS_FOR_ACTION[type], reason);
      setModal(null);
      await reload();
    } catch (e) {
      setModal(null);
      setError(e?.message || 'No se pudo completar la acción');
    }
  };

  const MODAL_CONFIGS = {
    suspend:    { title: 'Suspender proveedor', description: `Indicá el motivo de suspensión de "${displayName}".`, confirmLabel: 'Suspender', confirmClass: 'bg-amber-600 hover:bg-amber-700', requireReason: true },
    deactivate: { title: 'Desactivar proveedor',description: `Indicá el motivo de desactivación de "${displayName}".`, confirmLabel: 'Desactivar', confirmClass: 'bg-red-600 hover:bg-red-700', requireReason: true },
    activate:   { title: 'Activar proveedor',   description: `¿Activar a "${displayName}"? Volverá a aparecer en el catálogo.`, confirmLabel: 'Activar', confirmClass: 'bg-emerald-600 hover:bg-emerald-700', requireReason: false },
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      {/* Back */}
      <Link href="/admin/proveedores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors">
        <ArrowLeft size={15} />
        Proveedores
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
          {provider.logo_url ? (
            <img src={assetUrl(provider.logo_url)} alt={displayName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <span className="text-2xl text-gray-500">{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <ProviderStatusBadge status={provider.status} size="md" />
          </div>
          <p className="text-gray-400 text-sm mt-1">{provider.categoryLabel} · {provider.zone}</p>
          {provider.statusReason && (
            <div className="mt-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 inline-block">
              Motivo: {provider.statusReason}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href={`/admin/proveedores/${id}/editar`} className="flex items-center gap-2 px-4 py-2.5 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 rounded-xl text-sm font-semibold transition-colors">
          <Pencil size={15} /> Editar
        </Link>
        {provider.status === 'active' && (
          <>
            <button onClick={() => setModal('suspend')} className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Pause size={15} /> Suspender
            </button>
            <button onClick={() => setModal('deactivate')} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Ban size={15} /> Desactivar
            </button>
          </>
        )}
        {(provider.status === 'suspended' || provider.status === 'inactive') && (
          <button onClick={() => setModal('activate')} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <RotateCcw size={15} /> Activar
          </button>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <InfoCard title="Información del negocio">
          <InfoRow label="Nombre comercial" value={displayName} />
          <InfoRow label="Razón social" value={provider.legalName || '—'} />
          <InfoRow label="RUT" value={provider.taxId || '—'} />
          <InfoRow label="Categoría" value={provider.categoryLabel} />
          <InfoRow label="Ciudad / Depto" value={[provider.city, provider.department].filter(Boolean).join(' / ') || '—'} />
          <InfoRow label="Dirección" value={provider.address || '—'} />
          <InfoRow label="Zonas" value={provider.zones?.join(', ') || '—'} />
          <InfoRow label="Descripción" value={provider.description || '—'} />
        </InfoCard>
        <InfoCard title="Contacto">
          <InfoRow label="Responsable" value={provider.ownerName || provider.owner?.name || '—'} />
          <InfoRow label="Email" value={provider.email || '—'} />
          <InfoRow label="Teléfono" value={provider.phone || provider.owner?.phone || '—'} />
          <InfoRow label="WhatsApp" value={provider.whatsapp || '—'} />
        </InfoCard>
        <InfoCard title="Comercial">
          <InfoRow label="Comisión" value={provider.commissionRate != null ? `${(provider.commissionRate * 100).toFixed(1)}%` : 'Default de la plataforma'} />
          <InfoRow label="Moneda" value={provider.currency || '—'} />
          <InfoRow label="Método de cobro" value={provider.paymentMethod || '—'} />
        </InfoCard>
        <InfoCard title="Plataforma">
          <InfoRow label="ID" value={provider.id} mono />
          <InfoRow label="Registrado" value={safeFormatDate(provider.createdAt, '—')} />
          <InfoRow label="Activo desde" value={safeFormatDate(provider.approvedAt, '—')} />
          <InfoRow label="Rating" value={provider.rating ? `${provider.rating} (${provider.reviewCount} reseñas)` : '—'} />
        </InfoCard>
        <InfoCard title="Estadísticas">
          <InfoRow label="Reservas totales" value={provider.totalBookings || 0} />
          <InfoRow label="Tiempo de respuesta" value={provider.responseTime || '—'} />
          <InfoRow label="Verificado" value={provider.verified ? 'Sí' : 'No'} />
          <InfoRow label="Precio desde" value={provider.priceFrom ? `$${formatCurrency(provider.priceFrom)}` : '—'} />
        </InfoCard>
        {provider.internalNotes && (
          <InfoCard title="Notas internas">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{provider.internalNotes}</p>
          </InfoCard>
        )}
      </div>

      {/* Services */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">Servicios publicados ({services.length})</h2>
        </div>
        {services.length === 0 ? (
          <p className="px-5 py-6 text-gray-500 text-sm">Sin servicios.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Servicio</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Precio desde</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-gray-200 font-medium">{s.title}</p>
                    <p className="text-gray-500 text-xs">{s.category}</p>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 hidden md:table-cell">
                    ${formatCurrency(s.priceFrom)}
                  </td>
                  <td className="px-4 py-3.5">
                    <ServiceStatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      {/* Confirm modal */}
      {modal && (
        <ConfirmModal
          {...MODAL_CONFIGS[modal]}
          onConfirm={(reason) => handleAction(modal, reason)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-200 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
