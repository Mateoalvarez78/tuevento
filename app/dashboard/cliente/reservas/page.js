'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Eye, X, MapPin, AlertTriangle, Phone, MessageCircle,
  CalendarClock, Users, DollarSign, FileText, CheckCircle, CreditCard,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { bookingService } from '@/services/bookingService';
import { assetUrl } from '@/services/api';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import EmptyState from '@/components/EmptyState';

const STATUS_FILTERS = [
  { id: 'all',       label: 'Todas' },
  { id: 'pending',   label: 'Esperando respuesta' },
  { id: 'accepted',  label: 'Esperando seña' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas' },
  { id: 'rejected',  label: 'Rechazadas' },
];

const STATUS_HELP = {
  pending:   'El proveedor está revisando tu consulta. Todavía no se realizó ningún cobro.',
  accepted:  'El proveedor aceptó tu consulta. Pagá la seña para confirmar la reserva.',
  confirmed: 'Reserva confirmada: la seña ya fue pagada.',
  rejected:  'El proveedor no pudo confirmar esta consulta.',
  cancelled: 'Esta reserva fue cancelada.',
  completed: 'El evento ya se realizó.',
};

// Puede cancelarse mientras está pendiente, aceptada o ya confirmada (regla del backend).
const CAN_CANCEL = (status) => status === 'pending' || status === 'confirmed';
// Solo se puede pagar la seña de una reserva aceptada sin pago todavía.
const CAN_PAY = (b) => b.displayStatus === 'accepted';

export default function ClientReservationsPage() {
  const { showToast } = useApp();
  const access = useRequireRole(['client']);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingService.getByClient(null, { limit: 50 });
      setBookings(res.data || []);
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar tus reservas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (access === 'loading' || access === 'denied') {
    return <div className="min-h-screen bg-surface flex items-center justify-center text-gray-400 text-sm">Verificando acceso…</div>;
  }
  if (access === 'unauth') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Necesitás iniciar sesión</h2>
          <Link href="/login" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors">Ingresar</Link>
        </div>
      </div>
    );
  }

  const filtered = bookings.filter((b) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || b.providerName.toLowerCase().includes(q) || b.serviceTitle.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || b.displayStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handlePayDeposit = async (b) => {
    setBusyId(b.id);
    try {
      await bookingService.payDeposit(b.id);
      showToast('Seña pagada — tu reserva quedó confirmada', 'success');
      await reload();
    } catch (e) {
      showToast(e?.message || 'No se pudo procesar el pago', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async () => {
    const b = cancelModal;
    setBusyId(b.id);
    try {
      await bookingService.updateStatus(b.id, 'cancelled', cancelReason);
      showToast('Reserva cancelada', 'info');
      setCancelModal(null);
      setCancelReason('');
      setSelected(null);
      await reload();
    } catch (e) {
      showToast(e?.message || 'No se pudo cancelar la reserva', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/dashboard/cliente" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-1">
              <ArrowLeft size={13} /> Mi panel
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Mis reservas</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Buscar por proveedor o servicio..."
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
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
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
            <EmptyState
              icon="📅"
              title="Todavía no hiciste ninguna consulta"
              description="Explorá el catálogo y consultá disponibilidad con los proveedores que te interesen."
              cta="Explorar catálogo"
              ctaHref="/catalogo"
            />
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
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.providerLogo ? assetUrl(b.providerLogo) : (b.providerImage ? assetUrl(b.providerImage) : '')}
                      alt={b.providerName}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 bg-gray-100"
                    />
                    <div>
                      <div className="font-bold text-gray-900">{b.providerName}</div>
                      <div className="text-xs text-gray-500">{b.serviceTitle}{b.packageName ? ` · ${b.packageName}` : ''}</div>
                    </div>
                  </div>
                  <ReservationStatusBadge status={b.displayStatus} />
                </div>
                <p className="text-xs text-gray-400 mb-3">{STATUS_HELP[b.displayStatus]}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs text-gray-600 mb-3">
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
                  <div>
                    <span className="text-gray-400 block">#</span>
                    <span className="font-medium text-gray-800">{b.requestNumber}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => setSelected(b)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={13} /> Ver detalle
                  </button>
                  {CAN_PAY(b) && (
                    <button
                      disabled={busyId === b.id}
                      onClick={() => handlePayDeposit(b)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <CreditCard size={13} /> {busyId === b.id ? 'Procesando...' : 'Simular pago aprobado'}
                    </button>
                  )}
                  {CAN_CANCEL(b.status) && (
                    <button
                      disabled={busyId === b.id}
                      onClick={() => setCancelModal(b)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <X size={13} /> Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <BookingDetailDrawer
          booking={selected}
          onClose={() => setSelected(null)}
          onCancel={CAN_CANCEL(selected.status) ? () => setCancelModal(selected) : null}
          onPay={CAN_PAY(selected) ? () => handlePayDeposit(selected) : null}
          paying={busyId === selected.id}
        />
      )}

      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar reserva</h3>
            <p className="text-sm text-gray-500 mb-4">¿Seguro que querés cancelar la reserva con <strong>{cancelModal.providerName}</strong>?</p>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none mb-4"
              placeholder="Motivo (opcional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setCancelModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors">
                Volver
              </button>
              <button onClick={handleCancel} disabled={busyId === cancelModal.id} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 text-sm transition-colors disabled:opacity-50">
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingDetailDrawer({ booking: b, onClose, onCancel, onPay, paying }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <ReservationStatusBadge status={b.displayStatus} />
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={b.providerLogo ? assetUrl(b.providerLogo) : ''}
              alt={b.providerName}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0"
            />
            <div>
              <p className="font-bold text-gray-900">{b.providerName}</p>
              <p className="text-xs text-gray-500">{b.serviceTitle}</p>
            </div>
          </div>
          <Link href={`/proveedor/${b.serviceId}`} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
            <Phone size={13} /> Ver ficha del proveedor
          </Link>
        </div>

        <div className="px-5 py-4 space-y-3 border-b border-gray-100">
          <DetailRow icon={<CalendarClock size={15} className="text-primary" />} label="Fecha y hora" value={`${b.date ? new Date(b.date + 'T12:00:00').toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}${b.time ? `, ${b.time}` : ''}`} />
          <DetailRow icon={<MapPin size={15} className="text-primary" />} label="Ubicación" value={b.location || '—'} />
          <DetailRow icon={<Users size={15} className="text-primary" />} label="Invitados" value={b.adults != null ? `${b.adults} adultos${b.children ? ` + ${b.children} niños` : ''}` : `${b.guests} personas`} />
          <DetailRow icon={<DollarSign size={15} className="text-primary" />} label="Total estimado" value={`$${b.totalEstimated?.toLocaleString('es-UY')}`} />
          {b.depositAmount > 0 && (
            <DetailRow
              icon={<CreditCard size={15} className="text-primary" />}
              label="Seña"
              value={`$${b.depositAmount.toLocaleString('es-UY')}${b.depositPaid ? ' · Pagada' : ' · Pendiente de pago'}`}
            />
          )}
          {b.packageName && <DetailRow icon={<FileText size={15} className="text-primary" />} label="Menú/paquete" value={b.packageName} />}
          {b.message && <DetailRow icon={<MessageCircle size={15} className="text-gray-400" />} label="Tu mensaje" value={b.message} />}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-400">Ref:</span>
            <span className="text-xs font-mono text-gray-500">{b.requestNumber}</span>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
            <CheckCircle size={14} className="text-green-500 shrink-0" />
            {STATUS_HELP[b.displayStatus]}
          </div>
        </div>

        {(onPay || onCancel) && (
          <div className="px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white space-y-2">
            {onPay && (
              <button onClick={onPay} disabled={paying} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                <CreditCard size={15} /> {paying ? 'Procesando...' : 'Simular pago aprobado'}
              </button>
            )}
            {onCancel && (
              <button onClick={onCancel} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-red-600 border border-red-200 rounded-2xl hover:bg-red-50 transition-colors">
                <X size={15} /> Cancelar reserva
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-5 shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium leading-snug">{value}</p>
      </div>
    </div>
  );
}
