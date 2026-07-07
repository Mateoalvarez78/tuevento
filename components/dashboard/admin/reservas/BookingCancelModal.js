'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function BookingCancelModal({ requestNumber, acting, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const canConfirm = reason.trim() && !acting;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !acting && onClose()} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm z-10 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold flex items-center gap-2"><AlertTriangle size={16} className="text-red-400" /> Cancelar reserva</h3>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-200 rounded-lg hover:bg-gray-800"><X size={16} /></button>
        </div>

        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 mb-4">
          <p className="text-sm text-red-300">
            Esta acción cancelará la reserva <span className="font-semibold">{requestNumber}</span> y registrará el cambio de estado en el historial.
          </p>
        </div>

        <label className="block text-xs font-medium text-gray-400 mb-1.5">Motivo de la cancelación <span className="text-red-400">(obligatorio)</span></label>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: cancelada a pedido del cliente…"
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 resize-none focus:outline-none focus:border-red-500/60 mb-4" />

        <div className="flex gap-2">
          <button onClick={onClose} disabled={acting} className="flex-1 py-2.5 border border-gray-700 text-gray-300 font-medium rounded-xl hover:bg-gray-800 text-sm transition-colors disabled:opacity-50">Volver</button>
          <button onClick={() => onConfirm(reason.trim())} disabled={!canConfirm}
            className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 text-sm transition-colors disabled:opacity-40">
            {acting ? 'Cancelando…' : 'Cancelar reserva'}
          </button>
        </div>
      </div>
    </div>
  );
}
