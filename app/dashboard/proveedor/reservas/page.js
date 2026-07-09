'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Check, X, Eye, CheckCircle2, MapPin, AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { bookingService } from '@/services/bookingService';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import EmptyState from '@/components/EmptyState';
import { CalendarDrawer } from '@/components/dashboard/proveedor/DashCalendar';

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
  const access = useRequireRole(['provider']);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  if (access === 'loading' || access === 'denied') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Verificando acceso…</div>;
  }
  if (access === 'unauth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Necesitás iniciar sesión</h2>
          <Link href="/provider/login" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">Ingresar</Link>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/dashboard/proveedor" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-1">
              <ArrowLeft size={13} /> Panel de proveedor
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Reservas</h1>
          </div>
          {pendingCount > 0 && (
            <span className="shrink-0 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Buscar por cliente o servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
            <p className="text-gray-700 font-medium mb-1">No pudimos cargar tus reservas</p>
            <p className="text-sm text-gray-500 mb-5">{error}</p>
            <button onClick={reload} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState icon="📭" title="Sin reservas todavía" description="Cuando un cliente consulte disponibilidad, aparecerá aquí." />
          </div>
        )}

        {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState icon="🔍" title="Sin resultados" description="Ninguna reserva coincide con estos filtros." />
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {b.clientAvatar ? (
                      <img src={b.clientAvatar} alt={b.clientName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                        {(b.clientName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
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
                      {b.date ? new Date(b.date + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }) : '—'} {b.time}
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
                    <span className="font-medium text-gray-800">{b.createdAt ? new Date(b.createdAt + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }) : '—'}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                  <MapPin size={11} /> {b.location}
                </div>

                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => setSelected(b)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={13} /> Ver detalle
                  </button>
                  {b.status === 'pending' && (
                    <>
                      <button
                        disabled={busyId === b.id}
                        onClick={() => setRejectModal(b)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <X size={14} /> Rechazar
                      </button>
                      <button
                        disabled={busyId === b.id}
                        onClick={() => handleAccept(b)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <Check size={14} /> Aceptar
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      disabled={busyId === b.id}
                      onClick={() => handleComplete(b)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} /> Marcar completada
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CalendarDrawer booking={selected} onClose={() => setSelected(null)} />

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Rechazar reserva</h3>
            <p className="text-sm text-gray-500 mb-4">Indicá el motivo del rechazo para que el cliente lo sepa.</p>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none mb-4"
              placeholder="Ej: No tengo disponibilidad para esa fecha."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={handleReject} disabled={busyId === rejectModal.id} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 text-sm transition-colors disabled:opacity-50">
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
