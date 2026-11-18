'use client';

// Proveedor 360° (Fase A) — encabezado y acciones administrativas sin
// cambios; se agregan pestañas (Resumen/Servicios/Reservas) donde antes
// había un único bloque de info + tabla de servicios.
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Pause, Ban, RotateCcw } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { assetUrl } from '@/services/api';
import ProviderStatusBadge from '@/components/ProviderStatusBadge';
import ProviderOverviewTab from '@/components/dashboard/admin/proveedores/ProviderOverviewTab';
import ProviderServicesTab from '@/components/dashboard/admin/proveedores/ProviderServicesTab';
import ProviderBookingsTab from '@/components/dashboard/admin/proveedores/ProviderBookingsTab';
import ProviderPaymentAccountTab from '@/components/dashboard/admin/proveedores/ProviderPaymentAccountTab';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Avatar from '@/components/Avatar';

const TABS = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'reservas', label: 'Reservas' },
  { value: 'cobros', label: 'Cobros' },
];

function ConfirmModal({ title, description, confirmLabel, confirmVariant, onConfirm, onCancel, requireReason }) {
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
          <Button variant={confirmVariant} disabled={requireReason && !reason.trim()} onClick={() => onConfirm(reason)}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      {requireReason && (
        <textarea
          placeholder="Motivo (requerido)…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60 resize-none"
        />
      )}
    </Modal>
  );
}

export default function AdminProviderDetailPage() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // 'suspend' | 'deactivate' | 'activate'
  const [activeTab, setActiveTab] = useState('resumen');

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
        <Link href="/admin/proveedores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-4">
          <AppIcon icon={ArrowLeft} size={15} aria-hidden="true" /> Proveedores
        </Link>
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
    suspend:    { title: 'Suspender proveedor', description: `Indicá el motivo de suspensión de "${displayName}".`, confirmLabel: 'Suspender', confirmVariant: 'warning', requireReason: true },
    deactivate: { title: 'Desactivar proveedor',description: `Indicá el motivo de desactivación de "${displayName}".`, confirmLabel: 'Desactivar', confirmVariant: 'danger', requireReason: true },
    activate:   { title: 'Activar proveedor',   description: `¿Activar a "${displayName}"? Volverá a aparecer en el catálogo.`, confirmLabel: 'Activar', confirmVariant: 'success', requireReason: false },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      {/* Back */}
      <Link href="/admin/proveedores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors">
        <AppIcon icon={ArrowLeft} size={15} aria-hidden="true" />
        Proveedores
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Avatar src={provider.logo_url ? assetUrl(provider.logo_url) : null} name={displayName} size="lg" shape="square" />
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
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="outline" theme="dark" icon={Pencil} href={`/admin/proveedores/${id}/editar`}>Editar</Button>
        {provider.status === 'active' && (
          <>
            <Button variant="warning" icon={Pause} onClick={() => setModal('suspend')}>Suspender</Button>
            <Button variant="danger" icon={Ban} onClick={() => setModal('deactivate')}>Desactivar</Button>
          </>
        )}
        {(provider.status === 'suspended' || provider.status === 'inactive') && (
          <Button variant="success" icon={RotateCcw} onClick={() => setModal('activate')}>Activar</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
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

      {activeTab === 'resumen' && <ProviderOverviewTab provider={provider} />}
      {activeTab === 'servicios' && <ProviderServicesTab services={services} />}
      {activeTab === 'reservas' && <ProviderBookingsTab providerId={id} />}
      {activeTab === 'cobros' && <ProviderPaymentAccountTab providerId={id} />}

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
