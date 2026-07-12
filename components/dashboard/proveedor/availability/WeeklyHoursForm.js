'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { availabilityService } from '@/services/availabilityService';
import { useApp } from '@/lib/AppContext';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function WeeklyHoursForm() {
  const { showToast } = useApp();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    availabilityService.getWeeklyRules().then((r) => { if (active) setRules(r); }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const updateDay = (dow, patch) => {
    setRules((prev) => prev.map((r) => (r.dayOfWeek === dow ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    for (const r of rules) {
      if (r.isAvailable && (!r.startTime || !r.endTime)) {
        showToast(`Completá el horario de ${DAY_LABELS[r.dayOfWeek]}`, 'error');
        return;
      }
    }
    setSaving(true);
    try {
      const saved = await availabilityService.replaceWeeklyRules(rules);
      setRules(saved);
      showToast('Horario semanal guardado', 'success');
    } catch (e) {
      showToast(e?.message || 'No se pudo guardar el horario', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton h-96 w-full rounded-2xl" />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
      <p className="text-sm text-gray-500 mb-4">
        Definí tus horarios habituales de trabajo. Si un horario termina después de medianoche (ej. viernes 18:00 a 03:00), ingresá la hora de fin igual — el sistema lo interpreta automáticamente como el día siguiente.
      </p>
      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.dayOfWeek} className="flex flex-wrap items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <label className="flex items-center gap-2 w-36 shrink-0 text-sm font-medium text-gray-800">
              <input type="checkbox" checked={r.isAvailable} onChange={(e) => updateDay(r.dayOfWeek, { isAvailable: e.target.checked })} />
              {DAY_LABELS[r.dayOfWeek]}
            </label>
            {r.isAvailable ? (
              <div className="flex items-center gap-2">
                <Input type="time" value={r.startTime} onChange={(e) => updateDay(r.dayOfWeek, { startTime: e.target.value })} wrapperClassName="w-32" />
                <span className="text-xs text-gray-400">a</span>
                <Input type="time" value={r.endTime} onChange={(e) => updateDay(r.dayOfWeek, { endTime: e.target.value })} wrapperClassName="w-32" />
              </div>
            ) : (
              <span className="text-xs text-gray-400">No disponible</span>
            )}
          </div>
        ))}
      </div>
      <div className="pt-5">
        <Button loading={saving} onClick={handleSave}>Guardar horario semanal</Button>
      </div>
    </div>
  );
}
