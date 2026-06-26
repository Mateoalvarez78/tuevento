const STATUS = {
  pending:   { label: 'Pendiente',  className: 'status-pending' },
  confirmed: { label: 'Confirmada', className: 'status-confirmed' },
  rejected:  { label: 'Rechazada',  className: 'status-rejected' },
  cancelled: { label: 'Cancelada',  className: 'status-cancelled' },
  completed: { label: 'Completada', className: 'status-completed' },
};

export default function ReservationStatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
