'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Check, X, Eye, CheckCircle2, MapPin, AlertTriangle, Inbox, SearchX,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useSessionState } from '@/hooks/useSessionState';
import { bookingService } from '@/services/bookingService';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import EmptyState from '@/components/EmptyState';
import { CalendarDrawer } from '@/components/dashboard/proveedor/DashCalendar';
import { safeFormatDate } from '@/lib/date';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Avatar from '@/components/Avatar';

const STATUS_FILTERS = [
  { id: 'all',       label: 'Todas' },
  { id: 'pending',   label: 'Pendientes de respuesta' },
  { id: 'accepted',  label: 'Esperando seña' },
  { id: 'confirmed', label: 'Confirmadas (seña paga)' },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas' },
  { id: 'rejected',  label: 'Rechazadas' },
];

export default function ProviderReservationsPage() {
  const { showToast } = useApp();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useSessionState('provReservasSearch', '');
  const [statusFilter, setStatusFilter] = useSessionState('provReservasStatus', 'all');
  const [selected, setSelected] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingService.getByProvider(null, { limit: 50 });
      setBookings(res.data || []);
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filtered = bookings.filter((b) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || b.clientName.toLowerCase().includes(q) || b.serviceTitle.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || b.displayStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  const runAction = async (id, fn, successMsg) => {
    setBusyId(id);
    try {
      await fn();
      showToast(successMsg, 'success');
      await reload();
    } catch (e) {
      showToast(e?.message || 'No se pudo completar la acción', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleAccept = (b) => runAction(b.id, () => bookingService.updateStatus(b.id, 'accepted'), 'Reserva confirmada');
  const handleComplete = (b) => runAction(b.id, () => bookingService.updateStatus(b.id, 'completed'), 'Reserva marcada como completada');

  const handleReject = async () => {
    const b = rejectModal;
    setBusyId(b.id);
    try {
      await bookingService.updateStatus(b.id, 'rejected', rejectReason);
      showToast('Reserva rechazada', 'info');
      setRejectModal(null);
      setRejectReason('');
      await reload();
    } catch (e) {
      showToast(e?.message || 'No se pudo rechazar la reserva', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {pendingCount > 0 && (
        <div className="flex justify-end mb-3">
          <span className="shrink-0 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <Input
            icon={Search}
            wrapperClassName="flex-1 min-w-[180px] max-w-xs"
            placeholder="Buscar por cliente o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {!loading && !error && (
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} de {bookings.length} reserva{bookings.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <AppIcon icon={AlertTriangle} size={32} className="mx-auto text-amber-500 mb-3" aria-hidden="true" />
            <p className="text-gray-700 font-medium mb-1">No pudimos cargar tus reservas</p>
            <p className="text-sm text-gray-500 mb-5">{error}</p>
            <Button onClick={reload}>Reintentar</Button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState icon={Inbox} title="Sin reservas todavía" description="Cuando un cliente consulte disponibilidad, aparecerá aquí." />
          </div>
        )}

        {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState icon={SearchX} title="Sin resultados" description="Ninguna reserva coincide con estos filtros." />
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={b.clientAvatar} name={b.clientName} size="sm" />
                    <div>
                      <div className="font-bold text-gray-900">{b.clientName}</div>
                      <div className="text-xs text-gray-500">#{b.requestNumber} · {b.serviceTitle}{b.packageName ? ` · ${b.packageName}` : ''}</div>
                    </div>
                  </div>
                  <ReservationStatusBadge status={b.displayStatus} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-xs text-gray-600 mb-3">
                  <div>
                    <span className="text-gray-400 block">Fecha</span>
                    <span className="font-medium text-gray-800">
                      {safeFormatDate(b.date)} {b.time}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Personas</span>
                    <span className="font-medium text-gray-800">
                      {b.adults != null ? `${b.adults} ad.${b.children ? ` + ${b.children} niños` : ''}` : `${b.guests} pers.`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Total</span>
                    <span className="font-medium text-gray-800">${b.totalEstimated?.toLocaleString('es-UY')}</span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-gray-400 block">Comisión / Neto</span>
                    <span className="font-medium text-gray-800">-${b.commissionAmount?.toLocaleString('es-UY')} / ${b.providerNet?.toLocaleString('es-UY')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Creada</span>
                    <span className="font-medium text-gray-800">{safeFormatDate(b.createdAt)}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                  <AppIcon icon={MapPin} size={11} aria-hidden="true" /> {b.location}
                </div>

                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <Button variant="outline" size="sm" icon={Eye} onClick={() => setSelected(b)}>Ver detalle</Button>
                  {b.status === 'pending' && (
                    <>
                      <Button variant="danger" size="sm" icon={X} disabled={busyId === b.id} onClick={() => setRejectModal(b)}>Rechazar</Button>
                      <Button variant="success" size="sm" icon={Check} disabled={busyId === b.id} onClick={() => handleAccept(b)}>Aceptar</Button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <Button variant="outline" size="sm" icon={CheckCircle2} className="!text-blue-600 !border-blue-200 hover:!bg-blue-50" disabled={busyId === b.id} onClick={() => handleComplete(b)}>
                      Marcar completada
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      <CalendarDrawer booking={selected} onClose={() => setSelected(null)} />

      {rejectModal && (
        <Modal
          open
          onClose={() => setRejectModal(null)}
          title="Rechazar reserva"
          size="sm"
          footer={
            <>
              <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" loading={busyId === rejectModal.id} onClick={handleReject}>Rechazar</Button>
            </>
          }
        >
          <p className="text-sm text-gray-500 mb-4">Indicá el motivo del rechazo para que el cliente lo sepa.</p>
          <textarea
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
            placeholder="Ej: No tengo disponibilidad para esa fecha."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </Modal>
      )}
    </>
  );
}
