'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { availabilityService } from '@/services/availabilityService';
import { todayStr } from '@/lib/date';
import { useApp } from '@/lib/AppContext';

const toInputDate = (v) => (v ? String(v).slice(0, 10) : '');
const toInputTime = (v) => (v ? String(v).slice(11, 16) : '');

// Reserva tomada fuera de Eventonow (WhatsApp, Instagram, teléfono, etc.):
// descuenta disponibilidad pero no genera comisión ni pago.
export default function ExternalEventModal({ open, onClose, event, defaultDate, services = [], onSaved }) {
  const { showToast } = useApp();
  const isEdit = !!event;

  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [guestCount, setGuestCount] = useState('');
  const [capacityUsed, setCapacityUsed] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title || ''); setServiceId(event.serviceId || '');
      setDate(toInputDate(event.startDatetime));
      setStartTime(toInputTime(event.startDatetime) || '18:00');
      setEndTime(toInputTime(event.endDatetime) || '23:00');
      setGuestCount(event.guestCount ?? ''); setCapacityUsed(event.capacityUsed || 1);
      setClientName(event.clientName || ''); setClientPhone(event.clientPhone || ''); setNotes(event.notes || '');
    } else {
      setTitle(''); setServiceId('');
      setDate(defaultDate || todayStr());
      setStartTime('18:00'); setEndTime('23:00');
      setGuestCount(''); setCapacityUsed(1); setClientName(''); setClientPhone(''); setNotes('');
    }
  }, [open, event, defaultDate]);

  const handleSave = async () => {
    if (!title.trim() || !date) { showToast('Completá título y fecha', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        serviceId: serviceId || null,
        startDatetime: `${date} ${startTime}:00`,
        endDatetime: `${date} ${endTime}:00`,
        guestCount: guestCount !== '' ? parseInt(guestCount) : null,
        capacityUsed: parseInt(capacityUsed) || 1,
        clientName: clientName || null,
        clientPhone: clientPhone || null,
        notes: notes || null,
      };
      if (isEdit) await availabilityService.updateExternalEvent(event.id, payload);
      else await availabilityService.createExternalEvent(payload);
      showToast(isEdit ? 'Reserva externa actualizada' : 'Reserva externa creada', 'success');
      onSaved?.();
    } catch (e) {
      showToast(e?.message || 'No se pudo guardar la reserva externa', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? 'Editar reserva externa' : 'Agregar reserva externa'}
      size="md"
      footer={
        <>
          <Button variant="outline" className="flex-1" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Guardar</Button>
        </>
      }
    >
      <p className="text-xs text-gray-500 mb-4">Esta reserva descontará disponibilidad, pero no generará comisión ni pago en Eventonow.</p>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Título interno</label>
          <Input placeholder="Ej: Cumpleaños familia Pérez" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Servicio relacionado</label>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">General (no descuenta de un servicio específico)</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Fecha</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Desde</label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Hasta</label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Cantidad de personas</label>
            <Input type="number" min="0" placeholder="Opcional" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Capacidad que ocupa</label>
            <Input type="number" min="1" value={capacityUsed} onChange={(e) => setCapacityUsed(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nombre del cliente (opcional)</label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Teléfono (opcional)</label>
            <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Notas internas</label>
          <textarea
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
