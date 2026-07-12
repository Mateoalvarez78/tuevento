'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Input from '@/components/Input';
import AppIcon from '@/components/AppIcon';
import { availabilityService } from '@/services/availabilityService';
import { todayStr } from '@/lib/date';
import { useApp } from '@/lib/AppContext';

const REASON_OPTIONS = [
  { value: 'Feriado', label: 'Feriado' },
  { value: 'Vacaciones', label: 'Vacaciones' },
  { value: 'Evento privado', label: 'Evento privado' },
  { value: 'Compromiso personal', label: 'Compromiso personal' },
  { value: 'Mantenimiento', label: 'Mantenimiento' },
  { value: 'Falta de personal', label: 'Falta de personal' },
  { value: 'Otro', label: 'Otro' },
];

const toInputDate = (v) => (v ? String(v).slice(0, 10) : '');
const toInputTime = (v) => (v ? String(v).slice(11, 16) : '');

export default function BlockDateModal({ open, onClose, exception, services = [], onSaved }) {
  const { showToast } = useApp();
  const isEdit = !!exception;

  const [serviceId, setServiceId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('Feriado');
  const [saving, setSaving] = useState(false);
  const [impact, setImpact] = useState([]);
  const [checkingImpact, setCheckingImpact] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (exception) {
      setServiceId(exception.serviceId || '');
      setStartDate(toInputDate(exception.startDatetime));
      setEndDate(toInputDate(exception.endDatetime));
      setIsFullDay(exception.isFullDay);
      setStartTime(toInputTime(exception.startDatetime) || '14:00');
      setEndTime(toInputTime(exception.endDatetime) || '18:00');
      setReason(exception.reason || 'Feriado');
    } else {
      const today = todayStr();
      setServiceId(''); setStartDate(today); setEndDate(today);
      setIsFullDay(true); setStartTime('14:00'); setEndTime('18:00'); setReason('Feriado');
    }
    setImpact([]);
  }, [open, exception]);

  const buildRange = useCallback(() => {
    if (!startDate || !endDate) return null;
    if (isFullDay) {
      return { startDatetime: `${startDate} 00:00:00`, endDatetime: `${endDate} 23:59:59` };
    }
    return { startDatetime: `${startDate} ${startTime}:00`, endDatetime: `${endDate} ${endTime}:00` };
  }, [startDate, endDate, isFullDay, startTime, endTime]);

  const checkImpact = useCallback(async () => {
    const range = buildRange();
    if (!range) return;
    setCheckingImpact(true);
    try {
      const rows = await availabilityService.previewExceptionImpact({ ...range, serviceId: serviceId || undefined });
      setImpact(rows);
    } catch {
      // no bloquea el flujo si falla el preview
    } finally {
      setCheckingImpact(false);
    }
  }, [buildRange, serviceId]);

  const handleSave = async () => {
    const range = buildRange();
    if (!range) { showToast('Completá las fechas', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...range, serviceId: serviceId || null, exceptionType: 'block', isFullDay, reason };
      if (isEdit) await availabilityService.updateException(exception.id, payload);
      else await availabilityService.createException(payload);
      showToast(isEdit ? 'Bloqueo actualizado' : 'Bloqueo creado', 'success');
      onSaved?.();
    } catch (e) {
      showToast(e?.message || 'No se pudo guardar el bloqueo', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? 'Editar bloqueo' : 'Bloquear fecha'}
      size="md"
      footer={
        <>
          <Button variant="outline" className="flex-1" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1" loading={saving} onClick={handleSave}>Guardar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Servicio</label>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            onBlur={checkImpact}
          >
            <option value="">Todos los servicios</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Desde</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} onBlur={checkImpact} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Hasta</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} onBlur={checkImpact} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={isFullDay} onChange={(e) => { setIsFullDay(e.target.checked); }} onBlur={checkImpact} />
          Bloquear el/los día(s) completo(s)
        </label>

        {!isFullDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Desde hora</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} onBlur={checkImpact} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Hasta hora</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} onBlur={checkImpact} />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Motivo (interno, el cliente no lo ve)</label>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASON_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {checkingImpact && <p className="text-xs text-gray-400">Verificando reservas afectadas…</p>}
        {!checkingImpact && impact.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
            <AppIcon icon={AlertTriangle} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold mb-1">Este rango afecta {impact.length} reserva{impact.length !== 1 ? 's' : ''} ya aceptada{impact.length !== 1 ? 's' : ''}:</p>
              <ul className="space-y-0.5">
                {impact.map((b) => (
                  <li key={b.id}>#{b.requestNumber} · {b.serviceTitle} · {b.date} {b.time}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
