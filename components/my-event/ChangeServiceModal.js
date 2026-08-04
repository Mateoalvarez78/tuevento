'use client';

// "Cambiar un servicio sin perder el resto" — busca alternativas reales de
// la MISMA categoría del item y, al elegir una, llama a replaceItem (PUT
// atómico, ver hooks/useMyEventState.js). Nunca hace DELETE+POST desde acá.

import { useEffect, useState } from 'react';
import { RefreshCw, Star, TriangleAlert } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import AppIcon from '@/components/AppIcon';
import { categoryService } from '@/services/categoryService';
import { providerService } from '@/services/providerService';
import { formatCurrency } from '@/utils/formatters';
import { classifyMyEventError } from '@/services/myEventService';

export default function ChangeServiceModal({ open, onClose, event, item, onReplace }) {
  const [loading, setLoading] = useState(true);
  const [alternatives, setAlternatives] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [replacingId, setReplacingId] = useState(null);
  const [replaceError, setReplaceError] = useState('');

  useEffect(() => {
    if (!open || !item) return;
    let cancelled = false;
    // Promise.resolve().then(...) — nunca setState síncrono dentro del
    // cuerpo del efecto (react-hooks/set-state-in-effect); a diferencia de
    // envolver en un `async () => {}` invocado directo (que sigue
    // ejecutando todo hasta el primer await de forma síncrona), esto sí
    // difiere la primera línea a un microtask real. Mismo criterio que
    // hooks/useMyEventState.js.
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);
      setLoadError('');
      setReplaceError('');
      try {
        const categories = await categoryService.getAll();
        // categoryService.mapCategory() usa `id` para el SLUG (filtro real de
        // /catalogo) y `categoryId` para el UUID real de la tabla categories
        // — client_event_items.category_id es este último, no el slug.
        const category = categories.find((c) => c.categoryId === item.category_id);
        const res = await providerService.getAll({ category: category?.id, limit: 12 });
        if (cancelled) return;
        setAlternatives((res.data || []).filter((s) => s.id !== item.service_id));
      } catch {
        if (!cancelled) setLoadError('No pudimos cargar alternativas. Intentá de nuevo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, item]);

  const handlePick = async (service) => {
    if (replacingId || !event || !item) return;
    setReplacingId(service.id);
    setReplaceError('');
    try {
      await onReplace(item.id, { service_id: service.id }, event.version);
      onClose();
    } catch (err) {
      const classified = classifyMyEventError(err);
      if (classified.kind === 'api' && classified.code === 'AVAILABILITY_CONFLICT') {
        setReplaceError('Ese servicio no está disponible para tu evento (fecha, capacidad o zona). Probá con otro.');
      } else {
        setReplaceError(classified.message || 'No se pudo cambiar el servicio. Intentá de nuevo.');
      }
    } finally {
      setReplacingId(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cambiar este servicio" size="lg">
      <p className="text-sm text-gray-500 mb-4">
        Elegí una alternativa de la misma categoría. El resto de tu evento no se toca.
      </p>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-xl skeleton" aria-hidden="true" />)}
        </div>
      )}

      {!loading && loadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AppIcon icon={TriangleAlert} size={16} aria-hidden="true" />
          {loadError}
        </div>
      )}

      {!loading && !loadError && alternatives.length === 0 && (
        <p className="text-sm text-gray-500 py-6 text-center">No encontramos otras opciones en esta categoría por ahora.</p>
      )}

      {!loading && !loadError && alternatives.length > 0 && (
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
          {alternatives.map((service) => (
            <div key={service.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{service.serviceTitle || service.name}</p>
                <p className="text-xs text-gray-500 truncate">{service.businessName}</p>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                  <AppIcon icon={Star} size={12} className="text-amber-400 fill-current" aria-hidden="true" />
                  {service.rating > 0 ? service.rating.toFixed(1) : 'Nuevo'}
                  {service.priceFrom > 0 && <span>· desde {formatCurrency(service.priceFrom)}</span>}
                </div>
              </div>
              <Button
                size="sm"
                icon={RefreshCw}
                loading={replacingId === service.id}
                disabled={replacingId != null && replacingId !== service.id}
                onClick={() => handlePick(service)}
                className="shrink-0"
              >
                Elegir
              </Button>
            </div>
          ))}
        </div>
      )}

      {replaceError && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{replaceError}</div>
      )}
    </Modal>
  );
}
