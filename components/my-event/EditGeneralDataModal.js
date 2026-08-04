'use client';

// Editar datos generales del borrador (PATCH /me/events/:eventId). Nunca
// toca items — el propio backend lo garantiza (ver my-events README). La
// `version` se lee de `event.version` recién al confirmar (prop, no un
// estado local copiado al abrir) — si el modal quedó abierto un rato y el
// evento cambió por otro lado, se manda la versión más fresca igual.

import { useState } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LocationPicker from '@/components/LocationPicker';
import { EVENT_TYPES } from '@/components/smart-packages/EventStepForm';
import { todayStr } from '@/lib/date';
import { classifyMyEventError } from '@/services/myEventService';

export default function EditGeneralDataModal({ open, onClose, event, onSave }) {
  const [form, setForm] = useState(() => ({
    event_type: event?.event_type || '',
    event_date: event?.event_date || '',
    adults_count: event?.adults_count ?? 0,
    children_count: event?.children_count ?? 0,
    budget_approx: event?.budget_approx ?? '',
    location: event?.location_formatted_address
      ? { formattedAddress: event.location_formatted_address, lat: event.location_lat, lng: event.location_lng }
      : null,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !event) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        event_type: form.event_type || null,
        event_date: form.event_date || null,
        adults_count: Number(form.adults_count) || 0,
        children_count: Number(form.children_count) || 0,
        budget_approx: form.budget_approx !== '' ? Number(form.budget_approx) : null,
      };
      // location_token vencido nunca se manda como si siguiera siendo válido.
      if (form.location?.locationToken && form.location?.tokenExpiresAt
          && new Date(form.location.tokenExpiresAt).getTime() > Date.now()) {
        payload.location_token = form.location.locationToken;
      } else if (form.location?.formattedAddress) {
        payload.location_zone = form.location.formattedAddress;
      }
      await onSave(payload, event.version); // version tomada del prop `event` recién acá
      onClose();
    } catch (err) {
      const classified = classifyMyEventError(err);
      setError(classified.message || 'No se pudo guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title="Editar datos de mi evento"
      footer={(
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving} className="ml-auto">Guardar</Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="edit-event-type" className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de evento</label>
          <select
            id="edit-event-type"
            value={form.event_type}
            onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Sin especificar</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
          <Input id="edit-date" type="date" min={todayStr()} value={form.event_date || ''} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-adults" className="block text-sm font-medium text-gray-700 mb-1.5">Adultos</label>
            <Input id="edit-adults" type="number" min="0" value={form.adults_count} onChange={(e) => setForm((f) => ({ ...f, adults_count: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="edit-children" className="block text-sm font-medium text-gray-700 mb-1.5">Niños</label>
            <Input id="edit-children" type="number" min="0" value={form.children_count} onChange={(e) => setForm((f) => ({ ...f, children_count: e.target.value }))} />
          </div>
        </div>
        <div>
          <label htmlFor="edit-budget" className="block text-sm font-medium text-gray-700 mb-1.5">Presupuesto (UYU)</label>
          <Input id="edit-budget" type="number" min="0" value={form.budget_approx} onChange={(e) => setForm((f) => ({ ...f, budget_approx: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ubicación</label>
          <LocationPicker value={form.location} onChange={(loc) => setForm((f) => ({ ...f, location: loc }))} />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}
      </form>
    </Modal>
  );
}
