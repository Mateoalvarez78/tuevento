'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ban, ExternalLink, Plus, Check, X, Trash2, Users, CalendarDays } from 'lucide-react';
import Drawer from '@/components/Drawer';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import AppIcon from '@/components/AppIcon';
import { availabilityService } from '@/services/availabilityService';
import { bookingService } from '@/services/bookingService';
import { useApp } from '@/lib/AppContext';
import { parseApiDate } from '@/lib/date';
import AcceptBookingModal from './AcceptBookingModal';
import BlockDateModal from './availability/BlockDateModal';
import ExternalEventModal from './availability/ExternalEventModal';

const STATUS_LABELS = {
  available: { label: 'Disponible', className: 'bg-emerald-100 text-emerald-700' },
  partial: { label: 'Parcialmente ocupado', className: 'bg-amber-100 text-amber-700' },
  full: { label: 'Completo', className: 'bg-red-100 text-red-600' },
  blocked: { label: 'Bloqueado', className: 'bg-gray-200 text-gray-700' },
};

// Panel/drawer del día (Etapa 6.2): reemplaza el click únicamente sobre
// reservas por un detalle completo del día, con acciones de escritura.
export default function DayDetailDrawer({ date, onClose, onChanged, services = [] }) {
  const { showToast } = useApp();
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [externalModal, setExternalModal] = useState(null);

  const reload = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const d = await availabilityService.getCalendarDay(date);
      setDay(d);
    } catch (e) {
      showToast(e?.message || 'No se pudo cargar el día', 'error');
    } finally {
      setLoading(false);
    }
  }, [date, showToast]);

  useEffect(() => { reload(); }, [reload]);

  const dateLabel = date
    ? parseApiDate(date).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const statusInfo = day ? (STATUS_LABELS[day.status] || STATUS_LABELS.available) : null;

  const handleReject = async () => {
    setBusyId(rejectTarget.id);
    try {
      await bookingService.updateStatus(rejectTarget.id, 'rejected', rejectReason);
      showToast('Reserva rechazada', 'info');
      setRejectTarget(null); setRejectReason('');
      await reload();
      onChanged?.();
    } catch (e) {
      showToast(e?.message || 'No se pudo rechazar', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const removeException = async (id) => {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    await availabilityService.deleteException(id);
    showToast('Bloqueo eliminado', 'success');
    await reload();
    onChanged?.();
  };

  const removeExternalEvent = async (id) => {
    if (!confirm('¿Eliminar esta reserva externa?')) return;
    await availabilityService.deleteExternalEvent(id);
    showToast('Reserva externa eliminada', 'success');
    await reload();
    onChanged?.();
  };

  return (
    <>
      <Drawer
        open={!!date}
        onClose={onClose}
        title={statusInfo && (
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.className}`}>{statusInfo.label}</span>
        )}
      >
        {loading && <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}</div>}

        {!loading && day && (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 capitalize">{dateLabel}</h3>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Eventos</span>
                <span className="font-bold text-gray-900">{day.capacity.eventsUsed} / {day.capacity.maxEvents}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Personas</span>
                <span className="font-bold text-gray-900">{day.capacity.guestsUsed}{day.capacity.maxGuests != null ? ` / ${day.capacity.maxGuests}` : ''}</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" icon={Ban} onClick={() => setBlockModalOpen(true)}>Bloquear fecha</Button>
              <Button size="sm" variant="outline" icon={ExternalLink} onClick={() => setExternalModal({})}>Reserva externa</Button>
            </div>

            {day.pendingRequests.length > 0 && (
              <Section title="Solicitudes pendientes">
                {day.pendingRequests.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-amber-50 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{b.service_title} {b.event_time ? `· ${b.event_time}` : ''}</p>
                      <p className="text-xs text-gray-500">{b.guest_count || 0} personas · {b.client_name}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button iconOnly icon={X} variant="ghost" size="sm" className="!text-danger" aria-label="Rechazar" onClick={() => setRejectTarget(b)} />
                      <Button iconOnly icon={Check} variant="ghost" size="sm" className="!text-emerald-600" aria-label="Aceptar" onClick={() => setAcceptTarget({ id: b.id })} />
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {day.bookings.length > 0 && (
              <Section title="Reservas Eventonow">
                {day.bookings.map((b) => (
                  <div key={b.id} className="px-3 py-2.5 rounded-xl bg-gray-50 text-sm">
                    <p className="font-medium text-gray-800">{b.service_title} {b.event_time ? `· ${b.event_time}` : ''}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><AppIcon icon={Users} size={11} aria-hidden="true" /> {b.guest_count || 0} personas · {b.client_name}</p>
                  </div>
                ))}
              </Section>
            )}

            {day.externalEvents.length > 0 && (
              <Section title="Reservas externas">
                {day.externalEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-blue-50 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{ev.title}</p>
                      <p className="text-xs text-gray-500">{ev.guestCount != null ? `${ev.guestCount} personas` : 'Sin detalle de personas'}</p>
                    </div>
                    <Button iconOnly icon={Trash2} variant="ghost" size="sm" className="!text-danger" aria-label="Eliminar" onClick={() => removeExternalEvent(ev.id)} />
                  </div>
                ))}
              </Section>
            )}

            {day.exceptions.length > 0 && (
              <Section title="Bloqueos / overrides">
                {day.exceptions.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-gray-100 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{ex.exception_type === 'override' ? 'Capacidad especial' : 'Bloqueo'}</p>
                      <p className="text-xs text-gray-500">{ex.reason || '—'}</p>
                    </div>
                    <Button iconOnly icon={Trash2} variant="ghost" size="sm" className="!text-danger" aria-label="Eliminar" onClick={() => removeException(ex.id)} />
                  </div>
                ))}
              </Section>
            )}

            {day.bookings.length === 0 && day.pendingRequests.length === 0 && day.externalEvents.length === 0 && day.exceptions.length === 0 && (
              <div className="text-center py-8">
                <AppIcon icon={CalendarDays} size={28} className="mx-auto text-gray-300 mb-2" aria-hidden="true" />
                <p className="text-sm text-gray-400">Sin actividad para este día.</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <AcceptBookingModal
        booking={acceptTarget}
        onClose={() => setAcceptTarget(null)}
        onAccepted={async () => { setAcceptTarget(null); showToast('Reserva aceptada', 'success'); await reload(); onChanged?.(); }}
        onChanged={async () => { await reload(); onChanged?.(); }}
      />

      {rejectTarget && (
        <Modal
          open
          onClose={() => setRejectTarget(null)}
          title="Rechazar reserva"
          size="sm"
          footer={
            <>
              <Button variant="outline" className="flex-1" onClick={() => setRejectTarget(null)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" loading={busyId === rejectTarget.id} onClick={handleReject}>Rechazar</Button>
            </>
          }
        >
          <p className="text-sm text-gray-500 mb-4">Indicá el motivo del rechazo para que el cliente lo sepa.</p>
          <textarea
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </Modal>
      )}

      <BlockDateModal
        open={blockModalOpen}
        exception={null}
        services={services}
        onClose={() => setBlockModalOpen(false)}
        onSaved={async () => { setBlockModalOpen(false); await reload(); onChanged?.(); }}
      />
      <ExternalEventModal
        open={!!externalModal}
        event={null}
        defaultDate={date}
        services={services}
        onClose={() => setExternalModal(null)}
        onSaved={async () => { setExternalModal(null); await reload(); onChanged?.(); }}
      />
    </>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
