'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

export default function BookingCancelModal({ requestNumber, acting, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const canConfirm = reason.trim() && !acting;

  return (
    <Modal
      open
      onClose={() => !acting && onClose()}
      theme="dark"
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <AppIcon icon={AlertTriangle} size={16} className="text-red-400" aria-hidden="true" /> Cancelar reserva
        </span>
      }
      footer={
        <>
          <Button variant="outline" theme="dark" className="flex-1" disabled={acting} onClick={onClose}>Volver</Button>
          <Button variant="danger" className="flex-1" disabled={!canConfirm} loading={acting} onClick={() => onConfirm(reason.trim())}>
            Cancelar reserva
          </Button>
        </>
      }
    >
      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 mb-4">
        <p className="text-sm text-red-300">
          Esta acción cancelará la reserva <span className="font-semibold">{requestNumber}</span> y registrará el cambio de estado en el historial.
        </p>
      </div>

      <label className="block text-xs font-medium text-gray-400 mb-1.5">Motivo de la cancelación <span className="text-red-400">(obligatorio)</span></label>
      <textarea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ej: cancelada a pedido del cliente…"
        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 resize-none focus:outline-none focus:border-red-500/60"
      />
    </Modal>
  );
}
