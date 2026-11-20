'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Check } from 'lucide-react';
import Chip from '@/components/Chip';
import Button from '@/components/Button';
import AppIcon from '@/components/AppIcon';
import { paymentService } from '@/services/paymentService';
import { BALANCE_DUE_DAYS_OPTIONS, paymentTermsLines } from '@/lib/payments';

// El proveedor elige hasta cuántos días antes del evento puede pagar el saldo
// el cliente (3, 7, 14 o 30; por defecto 7). Aplica a reservas NUEVAS: cada
// reserva guarda el plazo vigente al crearse y el cliente lo ve antes de
// reservar.
export default function BalanceDueSettingCard() {
  const [terms, setTerms] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    paymentService.getMyPaymentTerms()
      .then((t) => { setTerms(t); setSelected(t.balance_due_days_before_event); })
      .catch((e) => setError(e?.message || 'No pudimos cargar tu plazo del saldo'))
      .finally(() => setLoading(false));
  }, []);

  const options = terms?.options?.length ? terms.options : BALANCE_DUE_DAYS_OPTIONS;
  const dirty = terms && selected !== terms.balance_due_days_before_event;

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const t = await paymentService.updateMyPaymentTerms(selected);
      setTerms(t);
      setSelected(t.balance_due_days_before_event);
      setSaved(true);
    } catch (e) {
      setError(e?.message || 'No pudimos guardar el plazo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton h-40 w-full rounded-2xl" />;

  const preview = terms ? paymentTermsLines({ ...terms.client_view, balance_due_days_before_event: selected }) : null;

  return (
    <section aria-labelledby="saldo-title" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <AppIcon icon={CalendarClock} size={18} className="text-primary" aria-hidden="true" />
        <h2 id="saldo-title" className="text-base font-bold text-gray-900">Vencimiento del saldo</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        ¿Hasta cuántos días antes del evento puede pagar el saldo tu cliente? Aplica a las reservas
        nuevas; las que ya existen mantienen el plazo con el que se hicieron.
      </p>

      <div role="radiogroup" aria-label="Días antes del evento" className="flex flex-wrap gap-2 mb-4">
        {options.map((n) => (
          <Chip
            key={n}
            role="radio"
            aria-checked={selected === n}
            aria-pressed={undefined}
            selected={selected === n}
            disabled={saving}
            onClick={() => { setSelected(n); setSaved(false); }}
          >
            {n} días antes
          </Chip>
        ))}
      </div>

      {preview && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-4">
          <p className="font-semibold text-gray-700 mb-1">Así lo ve el cliente antes de reservar:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {preview.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger mb-3">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={save} loading={saving} disabled={!dirty || saving}>Guardar plazo</Button>
        {saved && !dirty && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <AppIcon icon={Check} size={14} aria-hidden="true" /> Guardado
          </span>
        )}
      </div>
    </section>
  );
}
