'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

// Transiciones válidas (espejo de la regla del backend; el backend es la autoridad).
const TRANSITIONS = {
  pending:  ['accepted', 'rejected', 'cancelled'],
  accepted: ['completed', 'cancelled'],
};
const LABELS = { pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada', cancelled: 'Cancelada', completed: 'Completada' };
const REASON_REQUIRED = ['cancelled', 'rejected'];

export default function BookingActionsModal({ rawStatus, adminName, acting, onConfirm, onClose }) {
  const options = TRANSITIONS[rawStatus] || [];
  const [target, setTarget] = useState(options[0] || '');
  const [reason, setReason] = useState('');

  const reasonRequired = REASON_REQUIRED.includes(target);
  const canConfirm = target && (!reasonRequired || reason.trim()) && !acting;
  const now = new Date().toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Modal
      open
      onClose={() => !acting && onClose()}
      theme="dark"
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <AppIcon icon={RefreshCw} size={16} className="text-primary" aria-hidden="true" /> Cambiar estado
        </span>
      }
      footer={options.length > 0 ? (
        <>
          <Button variant="outline" theme="dark" className="flex-1" disabled={acting} onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" disabled={!canConfirm} loading={acting} onClick={() => onConfirm(target, reason.trim())}>
            Confirmar
          </Button>
        </>
      ) : null}
    >
      {options.length === 0 ? (
        <div className="text-sm text-gray-400">
          No hay cambios de estado disponibles para una reserva <span className="text-gray-200 font-medium">{LABELS[rawStatus] || rawStatus}</span>.
          Los estados finales (completada, cancelada, rechazada) no pueden modificarse.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm mb-4">
            <span className="text-gray-500">Estado actual:</span>
            <span className="text-gray-200 font-medium">{LABELS[rawStatus] || rawStatus}</span>
          </div>

          <label className="block text-xs font-medium text-gray-400 mb-1.5">Nuevo estado</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary/60 mb-3">
            {options.map((o) => <option key={o} value={o}>{LABELS[o]}</option>)}
          </select>

          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Comentario {reasonRequired ? <span className="text-red-400">(obligatorio)</span> : <span className="text-gray-600">(opcional)</span>}
          </label>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder={reasonRequired ? 'Indicá el motivo…' : 'Nota interna opcional…'}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 resize-none focus:outline-none focus:border-primary/60 mb-3" />

          <p className="text-[11px] text-gray-600">Acción realizada por <span className="text-gray-400">{adminName}</span> · {now}</p>
        </>
      )}
    </Modal>
  );
}
