'use client';

// Editar paquete/extras/cantidades particulares/horas extra de UN servicio ya
// agregado al evento — PATCH /me/events/:eventId/items/:itemId (updateItem,
// ya existía en useMyEventState/myEventService, solo faltaba esta UI).
// Distinto de ChangeServiceModal (esa cambia a otro SERVICIO/proveedor por
// completo, PUT atómico) — acá el servicio es el mismo, solo cambia cómo
// está configurado. Reutiliza providerService.getById (mismo catálogo real
// que la ficha de servicio/BookingWizard, nunca datos inventados) para
// mostrar los paquetes/extras REALES de este servicio, y PackageSelector
// (ya usado por BookingWizard) en vez de un radio-group nuevo.
//
// Igual que mobile/EditItemSheet.tsx: el precio nunca se recalcula acá — el
// backend reconstruye quote_snapshot/selection_snapshot enteros al guardar
// (buildQuoteSnapshot), así que la selección previa nunca queda como un
// snapshot desincronizado.

import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Input from '@/components/Input';
import AppIcon from '@/components/AppIcon';
import PackageSelector from '@/components/PackageSelector';
import { providerService } from '@/services/providerService';
import { formatCurrency } from '@/utils/formatters';
import { classifyMyEventError } from '@/services/myEventService';
import { buildEditItemPatch } from '@/lib/myEventItem';

export default function EditItemModal({ open, onClose, event, item, onSave }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [detail, setDetail] = useState(null);

  const [packageId, setPackageId] = useState(null);
  const [extraIds, setExtraIds] = useState([]);
  const [adults, setAdults] = useState('');
  const [children, setChildren] = useState('');
  const [celiacs, setCeliacs] = useState('');
  const [extraHours, setExtraHours] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!open || !item) return;
    let cancelled = false;
    // Promise.resolve().then(...) — nunca setState síncrono dentro del cuerpo
    // del efecto, mismo criterio que ChangeServiceModal.js.
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setPackageId(item.package_id);
      setExtraIds((item.extras_selected || []).map((e) => e.id));
      setAdults(item.adults_count_override != null ? String(item.adults_count_override) : '');
      setChildren(item.children_count_override != null ? String(item.children_count_override) : '');
      setCeliacs(item.celiacs_count != null ? String(item.celiacs_count) : '');
      setExtraHours(item.extra_hours != null ? String(item.extra_hours) : '');
      setNotes(item.notes || '');
      setSaveError('');
      setLoading(true);
      setLoadError('');
      try {
        const service = await providerService.getById(item.service_id);
        if (cancelled) return;
        setDetail(service);
      } catch {
        if (!cancelled) setLoadError('No pudimos cargar los paquetes de este servicio. Probá de nuevo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, item]);

  if (!item) return null;

  const toggleExtra = (id) => {
    setExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (saving || !event) return;
    setSaving(true);
    setSaveError('');
    try {
      const patch = buildEditItemPatch({ packageId, extraIds, adults, children, celiacs, extraHours, notes });
      await onSave(item.id, patch, event.version);
      onClose();
    } catch (err) {
      const classified = classifyMyEventError(err);
      if (classified.kind === 'api' && classified.code === 'AVAILABILITY_CONFLICT') {
        setSaveError('Esa combinación ya no está disponible (fecha, capacidad, extras o zona). Probá con otra.');
      } else {
        setSaveError(classified.message || 'No se pudo guardar. Intentá de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={`Editar ${item.selection_snapshot?.service_title || 'servicio'}`}
      size="lg"
      footer={(
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} className="ml-auto">Guardar cambios</Button>
        </>
      )}
    >
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 rounded-xl skeleton" aria-hidden="true" />)}
        </div>
      )}

      {!loading && loadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AppIcon icon={TriangleAlert} size={16} aria-hidden="true" />
          {loadError}
        </div>
      )}

      {!loading && !loadError && detail && (() => {
        // Campos particulares dirigidos por el MODELO de precio del paquete
        // elegido — nunca los mismos 4 campos fijos para cualquier
        // categoría (antes: Adultos/Niños/Celíacos/Horas extra siempre
        // visibles, aunque el servicio fuera un DJ o una cabina de fotos).
        const selectedPackage = detail.packages.find((p) => p.id === packageId) || null;
        const showPersonFields = !!selectedPackage?.perPerson;
        const showExtraHoursField = !!selectedPackage?.isDurationPackage;
        const showQuantityFields = showPersonFields || showExtraHoursField;
        return (
        <div className="space-y-6">
          {detail.packages.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Elegí tu paquete</h4>
              <PackageSelector packages={detail.packages} selectedId={packageId} onSelect={setPackageId} />
            </div>
          )}

          {detail.extras.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Extras</h4>
              <div className="space-y-2">
                {detail.extras.map((ex) => (
                  <label
                    key={ex.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${extraIds.includes(ex.id) ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={extraIds.includes(ex.id)} onChange={() => toggleExtra(ex.id)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm font-medium text-gray-800">{ex.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">+{formatCurrency(ex.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {showQuantityFields && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Cantidades particulares</h4>
              <p className="text-xs text-gray-500 mb-3">Dejá el campo vacío para usar la cantidad general del evento.</p>
              <div className="grid grid-cols-2 gap-3">
                {showPersonFields && (
                  <>
                    <div>
                      <label htmlFor="edit-item-adults" className="block text-xs font-medium text-gray-700 mb-1.5">Adultos (general: {event.adults_count})</label>
                      <Input id="edit-item-adults" type="number" min="0" placeholder="Usar general" value={adults} onChange={(e) => setAdults(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="edit-item-children" className="block text-xs font-medium text-gray-700 mb-1.5">Niños (general: {event.children_count})</label>
                      <Input id="edit-item-children" type="number" min="0" placeholder="Usar general" value={children} onChange={(e) => setChildren(e.target.value)} />
                    </div>
                    {selectedPackage?.offersCeliacMenu && (
                      <div>
                        <label htmlFor="edit-item-celiacs" className="block text-xs font-medium text-gray-700 mb-1.5">Celíacos (general: {event.celiacs_count})</label>
                        <Input id="edit-item-celiacs" type="number" min="0" placeholder="Usar general" value={celiacs} onChange={(e) => setCeliacs(e.target.value)} />
                      </div>
                    )}
                  </>
                )}
                {showExtraHoursField && (
                  <div>
                    <label htmlFor="edit-item-extra-hours" className="block text-xs font-medium text-gray-700 mb-1.5">Horas extra (general: {event.extra_hours})</label>
                    <Input id="edit-item-extra-hours" type="number" min="0" placeholder="Usar general" value={extraHours} onChange={(e) => setExtraHours(e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="edit-item-notes" className="block text-xs font-medium text-gray-700 mb-1.5">Observación para este servicio</label>
            <textarea
              id="edit-item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {saveError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</div>
          )}
        </div>
        );
      })()}
    </Modal>
  );
}
