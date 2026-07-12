import { Clock, Wallet, CheckCircle2, XCircle, Ban, CheckCheck } from 'lucide-react';
import Badge from '@/components/Badge';

const STATUS = {
  pending:   { label: 'Pendiente',      icon: Clock,        bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  accepted:  { label: 'Esperando seña', icon: Wallet,       bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200' },
  confirmed: { label: 'Confirmada',     icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  rejected:  { label: 'Rechazada',      icon: XCircle,      bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200' },
  cancelled: { label: 'Cancelada',      icon: Ban,          bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200' },
  completed: { label: 'Completada',     icon: CheckCheck,   bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200' },
};

export default function ReservationStatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  return <Badge bg={cfg.bg} text={cfg.text} border={cfg.border} icon={cfg.icon} label={cfg.label} size="sm" />;
}
