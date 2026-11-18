'use client';

// Panel de conciliación de cobros con dLocal Go (seña + saldo).
// Qué hacer con cada estado: eventonow-back/docs/payments/RUNBOOK.md.

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, Undo2, CreditCard } from 'lucide-react';
import { paymentService, INTENT_STATUS_LABELS, INTENT_REVIEW_STATUSES } from '@/services/paymentService';
import { useApp } from '@/lib/AppContext';
import { safeFormatDate } from '@/lib/date';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

const TABS = [
  { value: 'review', label: 'Requieren revisión' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'paid', label: 'Cobrados' },
  { value: '', label: 'Todos' },
];

const TONE = {
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  review: { bg: 'bg-red-500/10', text: 'text-red-400' },
  other: { bg: 'bg-gray-700', text: 'text-gray-400' },
};

function StatusBadge({ status }) {
  let tone = TONE.other;
  if (status === 'paid') tone = TONE.paid;
  else if (status === 'pending' || status === 'creating') tone = TONE.pending;
  else if (INTENT_REVIEW_STATUSES.includes(status)) tone = TONE.review;
  return <Badge bg={tone.bg} text={tone.text} border="border-transparent" label={INTENT_STATUS_LABELS[status] || status} />;
}

const money = (v, c) => `${c || 'UYU'} ${Number(v).toLocaleString('es-UY', { minimumFractionDigits: 2 })}`;

export default function AdminPagosPage() {
  const { showToast } = useApp();
  const [tab, setTab] = useState('review');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'review') {
        const lists = await Promise.all(INTENT_REVIEW_STATUSES.map((s) => paymentService.adminListIntents(s)));
        setRows(lists.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } else {
        setRows(await paymentService.adminListIntents(tab || undefined));
      }
    } catch (e) {
      showToast(e?.message || 'No se pudieron cargar los cobros', 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab, showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const act = async (id, fn, ok) => {
    setBusy(id);
    try {
      await fn();
      showToast(ok, 'success');
      await load();
    } catch (e) {
      showToast(e?.message || 'No se pudo completar la acción', 'error');
    } finally {
      setBusy(null);
    }
  };

  const confirmAndRun = (message, run) => {
    if (typeof window !== 'undefined' && window.confirm(message)) run();
  };

  return (
    <div className="p-4 sm:p-8">
      <PageHeader theme="dark" title="Pagos" subtitle="Cobros de seña y saldo con dLocal Go" className="mb-5 sm:mb-6" />

      <div className="flex gap-2 mb-5 flex-wrap" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value || 'all'}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t.value ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Cargando…</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={CreditCard} title="Nada por acá" description="No hay cobros en esta vista." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="bg-gray-900 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Reserva</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Importe</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-800">
                  <td className="px-4 py-3 font-mono text-xs">{r.request_number}</td>
                  <td className="px-4 py-3">{r.provider_name}</td>
                  <td className="px-4 py-3">{r.payment_kind === 'balance' ? 'Saldo' : 'Seña'}</td>
                  <td className="px-4 py-3">{money(r.charge_amount, r.currency)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                    {r.failure_reason && <p className="text-[11px] text-gray-500 mt-1">{r.failure_reason}</p>}
                  </td>
                  <td className="px-4 py-3">{safeFormatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {r.external_payment_id && (
                        <Button size="sm" variant="outline" icon={RefreshCw} loading={busy === r.id}
                          onClick={() => act(r.id, () => paymentService.adminResync(r.id), 'Estado actualizado desde dLocal')}>
                          Resincronizar
                        </Button>
                      )}
                      {r.status === 'late_paid' && r.failure_reason !== 'late_paid_amount_mismatch' && (
                        <Button size="sm" variant="success" icon={CheckCircle2} disabled={busy === r.id}
                          onClick={() => confirmAndRun('¿Aplicar este pago tardío a la reserva?',
                            () => act(r.id, () => paymentService.adminResolve(r.id, 'apply_late_payment'), 'Pago aplicado a la reserva'))}>
                          Aplicar pago
                        </Button>
                      )}
                      {['late_paid', 'amount_mismatch', 'paid'].includes(r.status) && (
                        <Button size="sm" variant="danger" icon={Undo2} disabled={busy === r.id}
                          onClick={() => confirmAndRun('Confirmá que YA hiciste el reembolso desde el panel de dLocal Go.',
                            () => act(r.id, () => paymentService.adminResolve(r.id, 'mark_refunded'), 'Marcado como reembolsado'))}>
                          Marcar reembolsado
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
