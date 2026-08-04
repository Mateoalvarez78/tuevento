'use client';

// "Agregar a Mi evento" desde la ficha de servicio — deliberadamente
// SEPARADO de BookingWizard/reservar: acá se agrega un componente al
// borrador (client_event_item), nunca se crea una reserva. Nunca toca
// BookingWizard.js ni /reservar.

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PartyPopper, CalendarDays, TriangleAlert, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Input from '@/components/Input';
import AppIcon from '@/components/AppIcon';
import { useApp } from '@/lib/AppContext';
import { useMyEvent } from '@/lib/MyEventContext';
import { useAddToMyEvent } from '@/hooks/useAddToMyEvent';
import { classifyMyEventError } from '@/services/myEventService';
import { todayStr } from '@/lib/date';

export default function AddToMyEventModal({ open, onClose, serviceId, packageId, extras = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useApp();
  const { event, status: myEventStatus, createEvent, updateEvent, addItem } = useMyEvent();
  const { addToMyEvent, status, error } = useAddToMyEvent({
    user, event, myEventStatus, createEvent, updateEvent, addItem, router, loginNextPath: pathname,
  });
  const [selectedExtraIds, setSelectedExtraIds] = useState([]);
  const [eventDate, setEventDate] = useState('');

  const needsDate = !event || !event.event_date;
  const toggleExtra = (id) => {
    setSelectedExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleConfirm = async () => {
    if (needsDate && !eventDate) return;
    try {
      await addToMyEvent({
        serviceId,
        packageId,
        extrasSelected: selectedExtraIds.map((id) => ({ id, quantity: 1 })),
        eventDate: needsDate ? eventDate : undefined,
      });
    } catch {
      // el error ya queda expuesto vía `error`/`status`
    }
  };

  const classified = error ? classifyMyEventError(error) : null;
  const availabilityMessage = classified?.code === 'AVAILABILITY_CONFLICT'
    ? 'Este servicio no está disponible para tu evento (fecha, capacidad o zona).'
    : classified?.message;

  return (
    <Modal open={open} onClose={onClose} title="Agregar a mi evento">
      {status === 'done' ? (
        <div className="text-center py-6">
          <AppIcon icon={CheckCircle2} size={40} className="text-emerald-500 mx-auto mb-3" aria-hidden="true" />
          <p className="font-semibold text-gray-900 mb-1">¡Agregado a tu evento!</p>
          <p className="text-sm text-gray-500 mb-5">Podés seguir explorando o revisar tu evento ahora.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={onClose}>Seguir explorando</Button>
            <Button href="/mi-evento">Ver mi evento</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {extras.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Extras (opcional)</p>
              <div className="space-y-2">
                {extras.map((ex) => (
                  <label key={ex.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-3 py-2 cursor-pointer">
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" className="w-4 h-4 accent-primary" checked={selectedExtraIds.includes(ex.id)} onChange={() => toggleExtra(ex.id)} />
                      {ex.name}
                    </span>
                    <span className="text-xs text-gray-400">+${(ex.price || 0).toLocaleString('es-UY')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {needsDate && (
            <div>
              <label htmlFor="add-event-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                {event ? 'Tu evento todavía no tiene fecha — elegí una para poder cotizar' : '¿Cuándo es tu evento?'}
              </label>
              <Input id="add-event-date" type="date" icon={CalendarDays} min={todayStr()} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AppIcon icon={TriangleAlert} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {availabilityMessage || 'No pudimos agregarlo a tu evento. Intentá de nuevo.'}
            </div>
          )}

          <Button
            className="w-full"
            icon={PartyPopper}
            loading={status === 'working'}
            disabled={needsDate && !eventDate}
            onClick={handleConfirm}
          >
            Confirmar y agregar
          </Button>
        </div>
      )}
    </Modal>
  );
}
