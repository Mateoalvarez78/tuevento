'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Eye, X, MapPin, AlertTriangle, Phone, MessageCircle,
  CalendarClock, Users, DollarSign, FileText, CheckCircle, CreditCard, Star, Pencil,
  AlertCircle, Lock, CalendarX, SearchX,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { bookingService } from '@/services/bookingService';
import { assetUrl } from '@/services/api';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import RatingStars from '@/components/RatingStars';
import RateBookingModal from '@/components/dashboard/cliente/RateBookingModal';
import EmptyState from '@/components/EmptyState';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Drawer from '@/components/Drawer';
import LocationMap from '@/components/LocationMap';
import { safeFormatDate } from '@/lib/date';

const EDIT_WINDOW_MS = 30 * 60 * 1000;
const canEditReview = (b) => b.reviewId && b.reviewCreatedAt && (Date.now() - new Date(b.reviewCreatedAt).getTime()) < EDIT_WINDOW_MS;

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
  const [rateModal, setRateModal] = useState(null);

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
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <AppIcon icon={Lock} size={28} strokeWidth={1.5} className="text-gray-400" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Necesitás iniciar sesión</h2>
          <Button href="/login">Ingresar</Button>
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
              <AppIcon icon={ArrowLeft} size={13} aria-hidden="true" /> Mi panel
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Mis reservas</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <Input
            icon={Search}
            wrapperClassName="flex-1 min-w-[180px] max-w-xs"
            placeholder="Buscar por proveedor o servicio..."
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
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
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
            <EmptyState
              icon={CalendarX}
              title="Todavía no hiciste ninguna consulta"
              description="Explorá el catálogo y consultá disponibilidad con los proveedores que te interesen."
              cta="Explorar catálogo"
              ctaHref="/catalogo"
            />
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
                  <div>
                    <span className="text-gray-400 block">#</span>
                    <span className="font-medium text-gray-800">{b.requestNumber}</span>
                  </div>
                </div>

                {b.displayStatus === 'completed' && (
                  <div className="mb-3">
                    {b.canReview ? (
                      <div className="flex items-center justify-between gap-3 bg-primary-light/60 border border-primary/20 rounded-xl px-3.5 py-2.5">
                        <span className="text-xs font-semibold text-gray-700">¿Cómo fue tu experiencia?</span>
                        <Button size="sm" icon={Star} onClick={() => setRateModal(b)}>Calificar servicio</Button>
                      </div>
                    ) : b.reviewId ? (
                      <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <RatingStars rating={b.reviewRating} size={13} />
                          <span className="text-xs text-gray-500">Tu valoración</span>
                        </div>
                        {canEditReview(b) && (
                          <button
                            onClick={() => setRateModal(b)}
                            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                          >
                            <AppIcon icon={Pencil} size={11} aria-hidden="true" /> Editar
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <Button variant="outline" size="sm" icon={Eye} onClick={() => setSelected(b)}>Ver detalle</Button>
                  {CAN_PAY(b) && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={CreditCard}
                      loading={busyId === b.id}
                      onClick={() => handlePayDeposit(b)}
                    >
                      Simular pago aprobado
                    </Button>
                  )}
                  {CAN_CANCEL(b.status) && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={X}
                      disabled={busyId === b.id}
                      onClick={() => setCancelModal(b)}
                    >
                      Cancelar
                    </Button>
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
        <Modal
          open
          onClose={() => setCancelModal(null)}
          title="Cancelar reserva"
          size="sm"
          footer={
            <>
              <Button variant="outline" className="flex-1" onClick={() => setCancelModal(null)}>Volver</Button>
              <Button variant="danger" className="flex-1" loading={busyId === cancelModal.id} onClick={handleCancel}>Sí, cancelar</Button>
            </>
          }
        >
          <p className="text-sm text-gray-500 mb-4">¿Seguro que querés cancelar la reserva con <strong>{cancelModal.providerName}</strong>?</p>
          <textarea
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
            placeholder="Motivo (opcional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </Modal>
      )}

      {rateModal && (
        <RateBookingModal
          booking={rateModal}
          existingReview={rateModal.reviewId ? rateModal : null}
          onClose={() => setRateModal(null)}
          onSaved={() => { setRateModal(null); showToast('¡Gracias por tu valoración!', 'success'); reload(); }}
        />
      )}
    </div>
  );
}

function BookingDetailDrawer({ booking: b, onClose, onCancel, onPay, paying }) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={<ReservationStatusBadge status={b.displayStatus} />}
      footer={
        (onPay || onCancel) ? (
          <div className="w-full space-y-2">
            {onPay && (
              <Button variant="success" className="w-full" icon={CreditCard} loading={paying} onClick={onPay}>
                Simular pago aprobado
              </Button>
            )}
            {onCancel && (
              <Button variant="danger" className="w-full" icon={X} onClick={onCancel}>
                Cancelar reserva
              </Button>
            )}
          </div>
        ) : null
      }
    >
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
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
      <Link href={`/proveedor/${b.serviceId}`} className="mb-4 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
        <AppIcon icon={Phone} size={13} aria-hidden="true" /> Ver ficha del proveedor
      </Link>

      <div className="space-y-3 pb-4 border-b border-gray-100 mb-4">
        <DetailRow icon={CalendarClock} label="Fecha y hora" value={`${safeFormatDate(b.date)}${b.time ? `, ${b.time}` : ''}`} />
        <DetailRow icon={MapPin} label="Ubicación" value={b.location || '—'} />
        {b.locationDetails && (
          <LocationMap lat={b.locationDetails.lat} lng={b.locationDetails.lng} readOnly height="h-40" className="ml-6" />
        )}
        <DetailRow icon={Users} label="Invitados" value={b.adults != null ? `${b.adults} adultos${b.children ? ` + ${b.children} niños` : ''}` : `${b.guests} personas`} />
        <DetailRow icon={DollarSign} label="Total estimado" value={`$${b.totalEstimated?.toLocaleString('es-UY')}`} />
        {b.depositAmount > 0 && (
          <DetailRow
            icon={CreditCard}
            label="Seña"
            value={
              <span className="inline-flex items-center gap-1">
                ${b.depositAmount.toLocaleString('es-UY')}
                <span className={`inline-flex items-center gap-1 ${b.depositPaid ? 'text-emerald-600' : 'text-amber-500'}`}>
                  · <AppIcon icon={b.depositPaid ? CheckCircle : AlertCircle} size={12} aria-hidden="true" />
                  {b.depositPaid ? 'Pagada' : 'Pendiente de pago'}
                </span>
              </span>
            }
          />
        )}
        {b.packageName && <DetailRow icon={FileText} label="Menú/paquete" value={b.packageName} />}
        {b.message && <DetailRow icon={MessageCircle} label="Tu mensaje" iconClassName="text-gray-400" value={b.message} />}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">Ref:</span>
          <span className="text-xs font-mono text-gray-500">{b.requestNumber}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
        <AppIcon icon={CheckCircle} size={14} className="text-green-500 shrink-0" aria-hidden="true" />
        {STATUS_HELP[b.displayStatus]}
      </div>
    </Drawer>
  );
}

function DetailRow({ icon, label, value, iconClassName = 'text-primary' }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-5 shrink-0 mt-0.5">
        <AppIcon icon={icon} size={15} className={iconClassName} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium leading-snug">{value}</p>
      </div>
    </div>
  );
}
