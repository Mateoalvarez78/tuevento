'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Ban, ExternalLink, Trash2, Pencil } from 'lucide-react';
import Button from '@/components/Button';
import AppIcon from '@/components/AppIcon';
import EmptyState from '@/components/EmptyState';
import { availabilityService } from '@/services/availabilityService';
import { serviceService } from '@/services/serviceService';
import { useApp } from '@/lib/AppContext';
import { safeFormatDateTime, localDateStr } from '@/lib/date';
import BlockDateModal from './BlockDateModal';
import ExternalEventModal from './ExternalEventModal';

export default function AvailabilityPanel() {
  const { showToast } = useApp();
  const [services, setServices] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [externalEvents, setExternalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockModal, setBlockModal] = useState(null); // {} nuevo | exception a editar
  const [externalModal, setExternalModal] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date();
      const to = new Date(); to.setMonth(to.getMonth() + 6);
      const range = { from: localDateStr(from), to: localDateStr(to) };
      const [svc, exc, ext] = await Promise.all([
        serviceService.getByProvider(),
        availabilityService.listExceptions(range),
        availabilityService.listExternalEvents(range),
      ]);
      setServices(svc || []);
      setExceptions(exc || []);
      setExternalEvents(ext || []);
    } catch (e) {
      showToast(e?.message || 'No se pudo cargar la disponibilidad', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { reload(); }, [reload]);

  const removeException = async (id) => {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    try {
      await availabilityService.deleteException(id);
      showToast('Bloqueo eliminado', 'success');
      reload();
    } catch (e) { showToast(e?.message || 'No se pudo eliminar', 'error'); }
  };

  const removeExternalEvent = async (id) => {
    if (!confirm('¿Eliminar esta reserva externa?')) return;
    try {
      await availabilityService.deleteExternalEvent(id);
      showToast('Reserva externa eliminada', 'success');
      reload();
    } catch (e) { showToast(e?.message || 'No se pudo eliminar', 'error'); }
  };

  if (loading) return <div className="skeleton h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Bloqueos y vacaciones</h3>
            <p className="text-xs text-gray-500">Fechas, rangos u horarios en los que no aceptás reservas.</p>
          </div>
          <Button size="sm" icon={Plus} onClick={() => setBlockModal({})}>Bloquear fecha</Button>
        </div>
        {exceptions.length === 0 ? (
          <EmptyState icon={Ban} title="Sin bloqueos" description="No tenés fechas bloqueadas próximamente." />
        ) : (
          <div className="space-y-2">
            {exceptions.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 text-sm">
                <div>
                  <p className="font-medium text-gray-800">
                    {ex.exceptionType === 'override' ? 'Capacidad especial' : 'Bloqueo'}{ex.serviceId ? '' : ' · Todos los servicios'}
                  </p>
                  <p className="text-xs text-gray-500">{safeFormatDateTime(ex.startDatetime)} — {safeFormatDateTime(ex.endDatetime)}{ex.reason ? ` · ${ex.reason}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button iconOnly icon={Pencil} variant="ghost" size="sm" aria-label="Editar" onClick={() => setBlockModal(ex)} />
                  <Button iconOnly icon={Trash2} variant="ghost" size="sm" aria-label="Eliminar" className="!text-danger" onClick={() => removeException(ex.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Reservas externas</h3>
            <p className="text-xs text-gray-500">Reservas que recibiste fuera de Eventonow (WhatsApp, Instagram, teléfono). Descuentan disponibilidad, no generan comisión.</p>
          </div>
          <Button size="sm" icon={Plus} onClick={() => setExternalModal({})}>Agregar reserva externa</Button>
        </div>
        {externalEvents.length === 0 ? (
          <EmptyState icon={ExternalLink} title="Sin reservas externas" description="No cargaste reservas externas próximamente." />
        ) : (
          <div className="space-y-2">
            {externalEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 text-sm">
                <div>
                  <p className="font-medium text-gray-800">{ev.title}{ev.clientName ? ` · ${ev.clientName}` : ''}</p>
                  <p className="text-xs text-gray-500">{safeFormatDateTime(ev.startDatetime)} — {safeFormatDateTime(ev.endDatetime)}{ev.guestCount != null ? ` · ${ev.guestCount} personas` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button iconOnly icon={Pencil} variant="ghost" size="sm" aria-label="Editar" onClick={() => setExternalModal(ev)} />
                  <Button iconOnly icon={Trash2} variant="ghost" size="sm" aria-label="Eliminar" className="!text-danger" onClick={() => removeExternalEvent(ev.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BlockDateModal
        open={!!blockModal}
        exception={blockModal?.id ? blockModal : null}
        services={services}
        onClose={() => setBlockModal(null)}
        onSaved={() => { setBlockModal(null); reload(); }}
      />
      <ExternalEventModal
        open={!!externalModal}
        event={externalModal?.id ? externalModal : null}
        services={services}
        onClose={() => setExternalModal(null)}
        onSaved={() => { setExternalModal(null); reload(); }}
      />
    </div>
  );
}
