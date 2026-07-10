'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, CalendarDays, Clock, MapPin, User, Store, Users,
  RefreshCw, Ban, UserCog, Mail, Phone, AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import ReservationStatusBadge from '@/components/ReservationStatusBadge';
import { bookingAdminService } from '@/services/bookingAdminService';
import BookingActionsModal from './BookingActionsModal';
import BookingCancelModal from './BookingCancelModal';
import { safeFormatDate, safeFormatDateTime } from '@/lib/date';

const money = (n) => `$${Number(n || 0).toLocaleString('es-UY')}`;
const fmtDate = (d) => d ? safeFormatDate(d) : '—';
const fmtDateTime = (d) => d ? safeFormatDateTime(d) : '';

const STATUS_LABEL = { pending: 'Reserva creada', confirmed: 'Proveedor aceptó', rejected: 'Proveedor rechazó', cancelled: 'Reserva cancelada', completed: 'Evento completado' };

function Row({ label, children }) {
  if (!children) return null;
  return (
    <div className="flex justify-between gap-3 text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 text-right">{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-t border-gray-800 pt-4">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</h4>
      {children}
    </div>
  );
}

export default function BookingDetailDrawer({ bookingId, onClose, onChanged }) {
  const { showToast, user } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // 'change' | 'cancel' | null
  const [acting, setActing] = useState(false);

  const reload = useCallback(() => {
    if (!bookingId) return Promise.resolve();
    setLoading(true); setError(null);
    return bookingAdminService.getDetail(bookingId)
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e?.message || 'No se pudo cargar la reserva'); setLoading(false); });
  }, [bookingId]);

  useEffect(() => { setData(null); reload(); }, [reload]);

  const applyStatus = async (status, reason) => {
    setActing(true);
    try {
      await bookingAdminService.changeStatus(bookingId, status, reason);
      setModal(null);
      await reload();       // refresca el drawer (badge, timeline, fecha)
      onChanged?.();        // refresca tabla + KPIs de la pantalla
      showToast('Reserva actualizada', 'success');
    } catch (e) {
      showToast(e?.message || 'No se pudo actualizar la reserva', 'error');
    } finally {
      setActing(false);
    }
  };

  const soon = () => showToast('Función en preparación', 'info');

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-md bg-gray-950 border-l border-gray-800 h-full overflow-y-auto z-10">
        {/* Header */}
        <div className="sticky top-0 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-5 py-4 flex items-center justify-between z-10">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Reserva</p>
            <p className="font-bold text-white truncate">{data?.requestNumber || '…'}</p>
          </div>
          <div className="flex items-center gap-2">
            {data && <ReservationStatusBadge status={data.status} />}
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors"><X size={18} /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {loading && <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded-lg bg-gray-800" />)}</div>}

          {error && (
            <div className="py-10 text-center">
              <AlertTriangle size={28} className="mx-auto text-amber-400 mb-2" />
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Evento */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-200"><CalendarDays size={15} className="text-gray-500" /> <span className="capitalize">{fmtDate(data.eventDate)}</span></div>
                {data.eventTime && <div className="flex items-center gap-2 text-sm text-gray-400"><Clock size={15} className="text-gray-500" /> {data.eventTime} hs</div>}
                {data.location && <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin size={15} className="text-gray-500" /> {data.location}</div>}
                {data.eventType && <div className="text-xs text-gray-500 ml-6">Tipo: {data.eventType}</div>}
              </div>

              {/* Servicio */}
              <Section title="Servicio">
                <div className="flex items-center gap-2 text-sm text-gray-200"><span>{data.categoryEmoji || '📦'}</span> {data.serviceTitle}</div>
                <Row label="Categoría">{data.category}</Row>
                <Row label="Menú">{data.packageName || '—'}</Row>
                {data.adults != null && <Row label="Invitados"><Users size={12} className="inline mr-1" />{data.adults} adultos{data.children ? ` + ${data.children} niños` : ''}</Row>}
                {data.extras?.length > 0 && <Row label="Extras">{data.extras.length} seleccionado(s)</Row>}
              </Section>

              {/* Cliente */}
              <Section title="Cliente">
                <div className="flex items-center gap-2 text-sm text-gray-200"><User size={14} className="text-gray-500" /> {data.clientName}</div>
                {data.clientEmail && <div className="flex items-center gap-2 text-xs text-gray-400 mt-1"><Mail size={12} className="text-gray-500" /> {data.clientEmail}</div>}
                {data.clientPhone && <div className="flex items-center gap-2 text-xs text-gray-400"><Phone size={12} className="text-gray-500" /> {data.clientPhone}</div>}
              </Section>

              {/* Proveedor */}
              <Section title="Proveedor">
                <div className="flex items-center gap-2 text-sm text-gray-200"><Store size={14} className="text-gray-500" /> {data.providerName}</div>
                {data.providerPhone && <div className="flex items-center gap-2 text-xs text-gray-400 mt-1"><Phone size={12} className="text-gray-500" /> {data.providerPhone}</div>}
              </Section>

              {/* Financiero */}
              <Section title="Desglose económico">
                {data.subtotalAdults > 0 && <Row label="Subtotal adultos">{money(data.subtotalAdults)}</Row>}
                {data.subtotalChildren > 0 && <Row label="Subtotal niños">{money(data.subtotalChildren)}</Row>}
                {data.extrasTotal > 0 && <Row label="Extras">{money(data.extrasTotal)}</Row>}
                <Row label="Subtotal">{money(data.subtotal)}</Row>
                <div className="flex justify-between text-sm py-1 border-t border-gray-800/60 mt-1 pt-2">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-white font-bold">{money(data.total)}</span>
                </div>
                <Row label={`Comisión Eventonow (${Math.round(data.commissionRate * 100)}%)`}><span className="text-amber-400">{money(data.commission)}</span></Row>
                <Row label="Neto proveedor"><span className="text-emerald-400">{money(data.providerNet)}</span></Row>
                {data.deposit > 0 && <Row label="Seña (30%)">{money(data.deposit)}</Row>}
              </Section>

              {/* Observaciones */}
              {(data.message || data.rejectionReason || data.cancellationReason) && (
                <Section title="Observaciones">
                  {data.message && <p className="text-sm text-gray-300 italic">“{data.message}”</p>}
                  {data.rejectionReason && <p className="text-xs text-red-400 mt-1">Rechazo: {data.rejectionReason}</p>}
                  {data.cancellationReason && <p className="text-xs text-gray-400 mt-1">Cancelación: {data.cancellationReason}</p>}
                </Section>
              )}

              {/* Timeline */}
              <Section title="Historial">
                {data.history?.length > 0 ? (
                  <ol className="relative border-l border-gray-800 ml-1 space-y-3 mt-1">
                    {data.history.map((h, i) => (
                      <li key={i} className="ml-3">
                        <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-primary" />
                        <p className="text-sm text-gray-200 leading-tight">{STATUS_LABEL[h.status] || h.status}</p>
                        <p className="text-[11px] text-gray-500">{fmtDateTime(h.date)}{h.changedBy ? ` · ${h.changedBy}` : ''}</p>
                        {h.reason && <p className="text-[11px] text-gray-500 italic">{h.reason}</p>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-gray-500">Sin historial de cambios registrado.</p>
                )}
              </Section>

              {/* Acciones administrativas (preparadas) */}
              <Section title="Acciones administrativas">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setModal('change')} className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-200 border border-gray-700 rounded-xl py-2 hover:border-primary/50 transition-colors"><RefreshCw size={13} /> Cambiar estado</button>
                  <button onClick={() => setModal('cancel')} className="flex items-center justify-center gap-1.5 text-xs font-medium text-red-400 border border-gray-700 rounded-xl py-2 hover:border-red-500/50 transition-colors"><Ban size={13} /> Cancelar</button>
                  <button onClick={soon} className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 border border-gray-800 rounded-xl py-2 hover:border-gray-600 transition-colors"><UserCog size={13} /> Reasignar</button>
                  <button onClick={soon} className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 border border-gray-800 rounded-xl py-2 hover:border-gray-600 transition-colors"><Mail size={13} /> Contactar</button>
                </div>
                <p className="text-[11px] text-gray-600 mt-2">Reasignar y contactar estarán disponibles próximamente.</p>
              </Section>
            </>
          )}
        </div>
      </aside>

      {modal === 'change' && data && (
        <BookingActionsModal
          rawStatus={data.rawStatus}
          adminName={user?.name || 'Admin'}
          acting={acting}
          onConfirm={applyStatus}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'cancel' && data && (
        <BookingCancelModal
          requestNumber={data.requestNumber}
          acting={acting}
          onConfirm={(reason) => applyStatus('cancelled', reason)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
