'use client';

// Un `client_event_item` — muestra únicamente lo que ya vino canónico del
// backend (selection_snapshot/quote_snapshot), nunca recalcula nada. El
// precio de línea es SIEMPRE quote_snapshot.amounts.estimated_total.

import { useState } from 'react';
import { Pencil, RefreshCw, Trash2, TriangleAlert, CheckCircle2 } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import AppIcon from '@/components/AppIcon';
import { formatCurrency } from '@/utils/formatters';
import { classifyMyEventError } from '@/services/myEventService';

const INVALID_REASON_LABELS = {
  service_unavailable: 'Este servicio ya no está disponible',
  in_the_past: 'La fecha del evento ya pasó',
  insufficient_notice: 'Falta tiempo mínimo de anticipación',
  blocked: 'El proveedor bloqueó esta fecha',
  fully_booked: 'El proveedor ya no tiene cupo',
  guest_capacity_exceeded: 'La cantidad de invitados excede la capacidad',
  zone_not_covered: 'El proveedor no cubre tu zona',
  service_not_found: 'Este servicio ya no existe',
  package_unavailable: 'El paquete elegido ya no está disponible',
  extras_unavailable: 'Alguno de los extras ya no está disponible',
  extra_hours_invalid: 'Las horas extra ya no son válidas para este paquete',
  celiac_invalid: 'El menú celíaco ya no está disponible',
  celiacs_exceed_effective_guests: 'La cantidad de celíacos supera a los invitados',
};

export default function MyEventItemCard({ event, item, onRemove, onOpenChange, onOpenEdit }) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  const snapshot = item.selection_snapshot || {};
  const amounts = item.quote_snapshot?.amounts;
  const isValid = item.validity_status === 'valid';

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    setError('');
    try {
      await onRemove(item.id, event.version);
    } catch (err) {
      setError(classifyMyEventError(err).message || 'No se pudo eliminar. Intentá de nuevo.');
      setRemoving(false);
    }
  };

  return (
    <Card className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-32 h-24 shrink-0 rounded-xl bg-gray-100 overflow-hidden">
        {snapshot.service_primary_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={snapshot.service_primary_image} alt={snapshot.service_title || ''} className="w-full h-full object-cover" />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">{snapshot.category_name}</p>
            <h4 className="font-bold text-gray-900 truncate">{snapshot.service_title || 'Servicio'}</h4>
            <p className="text-sm text-gray-500 truncate">{snapshot.provider_name}{snapshot.package_name ? ` · ${snapshot.package_name}` : ''}</p>
          </div>
          <Badge variant={isValid ? 'success' : 'danger'} icon={isValid ? CheckCircle2 : TriangleAlert} label={isValid ? 'Disponible' : 'Revisar'} />
        </div>

        {!isValid && (
          <p className="mt-1.5 text-xs text-red-600">
            {INVALID_REASON_LABELS[item.invalid_reason] || 'Este componente necesita revisión.'}
          </p>
        )}

        {snapshot.extras?.length > 0 && (
          <p className="mt-1.5 text-xs text-gray-400">Extras: {snapshot.extras.map((e) => e.name).join(', ')}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className={`text-base font-bold ${isValid ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            {amounts ? formatCurrency(amounts.estimated_total) : '—'}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" icon={Pencil} onClick={() => onOpenEdit(item)}>
              Editar opciones
            </Button>
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => onOpenChange(item)}>
              Cambiar
            </Button>
            <Button size="sm" variant="ghost" icon={Trash2} loading={removing} className="!text-red-500 hover:!bg-red-50" onClick={handleRemove}>
              Eliminar
            </Button>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {!isValid && (
          <p className="mt-1 text-[11px] text-gray-400">No incluido en el total mientras no esté disponible.</p>
        )}
      </div>
    </Card>
  );
}
