'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Circle, AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import AppIcon from '@/components/AppIcon';
import { paymentService } from '@/services/paymentService';

// Estado de la conexión del proveedor con dLocal Go y qué le falta para poder
// aceptar reservas (GET /providers/me/payment-account). El backend decide
// todo: acá solo se muestra. Nunca se ven códigos ni porcentajes.

const STATE_BADGE = {
  enabled: { variant: 'success', label: 'Cobros habilitados' },
  pending_review: { variant: 'info', label: 'En verificación' },
  pending_acceptance: { variant: 'warning', label: 'Falta aceptar la invitación' },
  action_required: { variant: 'danger', label: 'Requiere acción' },
  not_connected: { variant: 'neutral', label: 'Sin conectar' },
};

export default function PaymentAccountStatusCard({ compact = false }) {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAccount = useCallback(() => paymentService.getMyPaymentAccount()
    .then((a) => { setAccount(a); setError(null); })
    .catch((e) => setError(e?.message || 'No pudimos cargar el estado de tus cobros'))
    .finally(() => setLoading(false)), []);

  // Carga inicial: `loading` ya arranca en true, sin setState síncrono en el efecto.
  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  const retry = () => { setLoading(true); setError(null); fetchAccount(); };

  if (loading) return <div className="skeleton h-32 w-full rounded-2xl" />;

  if (error) {
    return (
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{error}</p>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={retry}>Reintentar</Button>
      </section>
    );
  }
  if (!account) return null;

  // En el panel principal solo se muestra si hay algo que hacer.
  if (compact && account.can_receive_payments) return null;

  const badge = STATE_BADGE[account.state] || STATE_BADGE.not_connected;
  const blocked = account.payments_required_to_accept && !account.can_accept_bookings;

  return (
    <section
      id="cobros"
      aria-labelledby="cobros-title"
      className={`bg-white rounded-2xl border shadow-sm p-5 sm:p-6 ${blocked ? 'border-amber-200' : 'border-gray-100'}`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          <AppIcon icon={CreditCard} size={18} className="text-primary" aria-hidden="true" />
          <h2 id="cobros-title" className="text-base font-bold text-gray-900">Cobros online</h2>
        </div>
        <Badge variant={badge.variant} label={badge.label} />
      </div>

      {blocked && (
        <div role="status" className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-xl p-3 mb-4">
          <AppIcon icon={AlertTriangle} size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Todavía no podés aceptar reservas. Tus servicios siguen publicados y te siguen llegando
            solicitudes; para aceptarlas necesitás tus cobros con dLocal Go habilitados.
          </p>
        </div>
      )}

      {account.can_receive_payments ? (
        <p className="text-sm text-gray-600">
          Tu cuenta de dLocal Go está conectada. Cada pago de tus clientes se reparte automáticamente:
          tu parte va directo a tu cuenta.
        </p>
      ) : (
        <>
          <ol className="space-y-2 mb-3">
            {(account.requirements || []).map((r) => (
              <li key={r.key} className="flex items-start gap-2 text-sm">
                <AppIcon
                  icon={r.done ? CheckCircle2 : Circle}
                  size={16}
                  className={`mt-0.5 shrink-0 ${r.done ? 'text-emerald-500' : 'text-gray-300'}`}
                  aria-hidden="true"
                />
                <span className={r.done ? 'text-gray-400 line-through' : 'text-gray-800'}>
                  {r.label}
                  <span className="sr-only">{r.done ? ' (hecho)' : ' (pendiente)'}</span>
                </span>
              </li>
            ))}
          </ol>
          {account.next_step && (
            <p className="text-sm font-medium text-gray-900">
              Próximo paso: <span className="font-normal text-gray-600">{account.next_step}</span>
            </p>
          )}
        </>
      )}
    </section>
  );
}
