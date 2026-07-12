'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { availabilityService } from '@/services/availabilityService';
import { useApp } from '@/lib/AppContext';

export default function AvailabilitySettingsForm() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maxEvents, setMaxEvents] = useState(1);
  const [maxGuests, setMaxGuests] = useState('');
  const [minNotice, setMinNotice] = useState(0);

  useEffect(() => {
    let active = true;
    availabilityService.getSettings().then((s) => {
      if (!active || !s) return;
      setMaxEvents(s.maxConcurrentEvents);
      setMaxGuests(s.maxConcurrentGuests ?? '');
      setMinNotice(s.defaultMinBookingNoticeHours);
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await availabilityService.updateSettings({
        maxConcurrentEvents: parseInt(maxEvents) || 1,
        maxConcurrentGuests: maxGuests === '' ? null : parseInt(maxGuests),
        defaultMinBookingNoticeHours: parseInt(minNotice) || 0,
      });
      showToast('Configuración de capacidad guardada', 'success');
    } catch (e) {
      showToast(e?.message || 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton h-64 w-full rounded-2xl" />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-xl">
      <div>
        <label className="text-sm font-semibold text-gray-800 mb-1 block">¿Cuántos eventos podés atender al mismo tiempo?</label>
        <p className="text-xs text-gray-500 mb-2">Se usa como capacidad por defecto para todos tus servicios.</p>
        <Input type="number" min="1" value={maxEvents} onChange={(e) => setMaxEvents(e.target.value)} wrapperClassName="max-w-[140px]" />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-800 mb-1 block">¿Cuántas personas podés atender simultáneamente entre todos tus eventos?</label>
        <p className="text-xs text-gray-500 mb-2">Dejá vacío si no querés límite de personas.</p>
        <Input type="number" min="1" placeholder="Sin límite" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} wrapperClassName="max-w-[140px]" />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-800 mb-1 block">Anticipación mínima para reservar (horas)</label>
        <p className="text-xs text-gray-500 mb-2">Un cliente no podrá reservar con menos anticipación que esta, salvo que un servicio defina su propio valor.</p>
        <Input type="number" min="0" value={minNotice} onChange={(e) => setMinNotice(e.target.value)} wrapperClassName="max-w-[140px]" />
      </div>

      <div className="pt-2">
        <Button loading={saving} onClick={handleSave}>Guardar configuración</Button>
      </div>
    </div>
  );
}
