'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Users, Lock, Unlock, AlertTriangle, RefreshCw } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import AppIcon from '@/components/AppIcon';
import { bookingService } from '@/services/bookingService';
import { safeFormatDate } from '@/lib/date';

// Etapa 5: antes de confirmar, muestra cuánto tiene comprometido el proveedor
// para esa fecha y deja elegir si bloquear el resto del día. La validación
// real (autoritativa) siempre ocurre en el backend dentro de la transacción
// de aceptación — esto es solo para informar la decisión del proveedor.
//
// `onChanged` (opcional): se dispara cuando la disponibilidad cambió entre el
// preview y la aceptación (409) — el proveedor debe ver la lista/calendario
// actualizados aunque el modal siga abierto mostrando el error.
export default function AcceptBookingModal({ booking, onClose, onAccepted, onChanged }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [blockFullDay, setBlockFullDay] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPreview = useCallback(() => {
    if (!booking) return;
    setPreview(null);
    setError(null);
    setConflict(false);
    setLoading(true);
    bookingService.getAcceptPreview(booking.id)
      .then(setPreview)
      .catch((e) => setError(e?.message || 'No se pudo calcular la disponibilidad'))
      .finally(() => setLoading(false));
  }, [booking]);

  useEffect(() => {
    setBlockFullDay(false);
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const updated = await bookingService.updateStatus(booking.id, 'accepted', null, { blockFullDay });
      onAccepted?.(updated);
    } catch (e) {
      const isConflict = e?.code === 'AVAILABILITY_CONFLICT' || e?.status === 409;
      setConflict(isConflict);
      setError(e?.message || 'No se pudo aceptar la reserva');
      setSubmitting(false);
      // La disponibilidad cambió por otra acción (otra aceptación, un
      // bloqueo nuevo, etc.) — la lista/calendario del proveedor queda con
      // datos viejos si no se avisa, aunque el modal siga abierto.
      if (isConflict) onChanged?.();
    }
  };

  return (
    <Modal
      open={!!booking}
      onClose={submitting ? undefined : onClose}
      title="Aceptar reserva"
      size="md"
      footer={
        <>
          <Button variant="outline" className="flex-1" disabled={submitting} onClick={onClose}>
            {conflict ? 'Cerrar' : 'Cancelar'}
          </Button>
          {conflict ? (
            <Button variant="primary" className="flex-1" icon={RefreshCw} loading={loading} onClick={loadPreview}>
              Revisar disponibilidad de nuevo
            </Button>
          ) : (
            <Button variant="success" className="flex-1" loading={submitting} disabled={loading || !!error} onClick={confirm}>
              Aceptar reserva
            </Button>
          )}
        </>
      }
    >
      {!booking ? null : loading ? (
        <div className="space-y-2">
          <div className="skeleton h-5 w-3/4 rounded-lg" />
          <div className="skeleton h-20 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-sm text-danger bg-danger/5 rounded-xl p-3">
          <AppIcon icon={AlertTriangle} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{error}{conflict ? ' Volvé a revisar la disponibilidad antes de intentar de nuevo.' : ''}</p>
        </div>
      ) : preview && (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <AppIcon icon={CalendarCheck} size={16} aria-hidden="true" />
            <span>{preview.serviceTitle} · {safeFormatDate(preview.date)}{preview.time ? `, ${preview.time}` : ''}</span>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 mb-4">
            <p className="text-sm text-gray-700">
              Ya tenés <b>{preview.eventsBefore}</b> evento{preview.eventsBefore !== 1 ? 's' : ''} aceptado{preview.eventsBefore !== 1 ? 's' : ''} para esta fecha,
              con un total de <b>{preview.guestsBefore}</b> persona{preview.guestsBefore !== 1 ? 's' : ''}.
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-1.5">
              <AppIcon icon={Users} size={14} className="text-gray-400" aria-hidden="true" />
              Esta nueva reserva es para <b>{preview.guestCount}</b> persona{preview.guestCount !== 1 ? 's' : ''}.
            </p>
            <div className="border-t border-gray-200 pt-2.5 text-sm font-semibold text-gray-900">
              Después de aceptarla tendrás {preview.eventsAfter} evento{preview.eventsAfter !== 1 ? 's' : ''}
              {preview.maxEvents != null ? ` de ${preview.maxEvents}` : ''} y {preview.guestsAfter} persona{preview.guestsAfter !== 1 ? 's' : ''}
              {preview.maxGuests != null ? ` de ${preview.maxGuests}` : ''} comprometidas.
            </div>
          </div>

          {!preview.wouldStillBeAvailable && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl p-3 mb-4">
              <AppIcon icon={AlertTriangle} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>La disponibilidad pudo haber cambiado. Igual podés intentar aceptar: el sistema vuelve a validar todo antes de confirmar.</p>
            </div>
          )}

          <p className="text-sm font-semibold text-gray-800 mb-2">¿Deseás bloquear el resto del día después de aceptar esta reserva?</p>
          <p className="text-xs text-gray-500 mb-3">Al bloquear el día, ningún otro cliente podrá solicitar servicios para esta fecha.</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setBlockFullDay(true)}
              className={`w-full flex items-center gap-2.5 text-left px-3.5 py-3 rounded-xl border text-sm font-medium transition-colors ${blockFullDay ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
            >
              <AppIcon icon={Lock} size={16} aria-hidden="true" /> Sí, aceptar y bloquear el día
            </button>
            <button
              type="button"
              onClick={() => setBlockFullDay(false)}
              className={`w-full flex items-center gap-2.5 text-left px-3.5 py-3 rounded-xl border text-sm font-medium transition-colors ${!blockFullDay ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
            >
              <AppIcon icon={Unlock} size={16} aria-hidden="true" /> No, aceptar y mantener disponibilidad
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
