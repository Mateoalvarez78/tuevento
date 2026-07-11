import { Clock, Wallet, CheckCircle2, XCircle, Ban, CheckCheck } from 'lucide-react';

const STATUS = {
  pending:   { label: 'Pendiente',        className: 'status-pending',   icon: Clock },
  accepted:  { label: 'Esperando seña',   className: 'status-accepted',  icon: Wallet },
  confirmed: { label: 'Confirmada',       className: 'status-confirmed', icon: CheckCircle2 },
  rejected:  { label: 'Rechazada',        className: 'status-rejected',  icon: XCircle },
  cancelled: { label: 'Cancelada',        className: 'status-cancelled', icon: Ban },
  completed: { label: 'Completada',       className: 'status-completed', icon: CheckCheck },
};

export default function ReservationStatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <Icon size={12} className="shrink-0" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
