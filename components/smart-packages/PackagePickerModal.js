'use client';

// Elegir el menú/paquete Y los extras opcionales de UN servicio de una
// propuesta de Smart Packages, ANTES de pulsar "Elegir esta propuesta" — el
// motor arranca cada categoría con el paquete más barato compatible de su
// proveedor y sin extras (sugerido/default, ver smart-packages.service.js
// #fetchCandidatesForCategory), esto permite personalizarlo. Reutiliza
// providerService.getById (mismo catálogo real que la ficha de servicio/
// BookingWizard/EditItemModal) para los paquetes, y PackageSelector (ya
// usado en BookingWizard). Los extras salen de `category.availableExtras`
// — ya vienen en la respuesta de simulate() (fetchCandidatesForCategory los
// arma con el mismo SELECT que usa GET /services/:id), sin fetch nuevo.
//
// Modelo de interacción: paquete y extras se ELIGEN LOCALMENTE (staging) y
// se cotizan/confirman con UN solo "Guardar cambios" — igual que
// EditItemModal.js (Mi evento), a diferencia de la primera versión de este
// modal (que auto-cotizaba y cerraba en cada tap de paquete). Motivo: los
// extras son multi-selección — auto-cotizar en cada checkbox generaría
// varios requests encadenados y abre la puerta a respuestas fuera de orden
// si el usuario tilda varios rápido. Con un solo "Guardar", hay como máximo
// UNA cotización en vuelo por vez — no hace falta abortar ni versionar
// requests. El precio nuevo SIEMPRE sale de availabilityService.quotePreview
// (POST /services/:id/quote-preview) — este componente nunca calcula un
// precio, solo arma el request y aplica el resultado vía
// lib/smartPackages.js#buildServiceOverride.

import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import AppIcon from '@/components/AppIcon';
import PackageSelector from '@/components/PackageSelector';
import { providerService } from '@/services/providerService';
import { availabilityService } from '@/services/availabilityService';
import { formatCurrency } from '@/utils/formatters';
import { buildServiceOverride, buildQuotePreviewEvent, isPackageGuestCompatible } from '@/lib/smartPackages';

export default function PackagePickerModal({ open, onClose, category, totalGuests, eventFormData, onApply }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [service, setService] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Estado local (staging) — nada de esto se cotiza hasta "Guardar cambios".
  const [stagedPackageId, setStagedPackageId] = useState(null);
  const [stagedExtraIds, setStagedExtraIds] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!open || !category) return;
    let cancelled = false;
    // Promise.resolve().then(...) — nunca setState síncrono dentro del cuerpo
    // del efecto, mismo criterio que ChangeServiceModal.js/EditItemModal.js.
    Promise.resolve().then(async () => {
      if (cancelled) return;
      // Reinicia el staging con la selección VIGENTE de esta categoría cada
      // vez que se abre/reabre — nunca arrastra el staging de otra apertura.
      setStagedPackageId(category.packageId);
      setStagedExtraIds((category.extrasSelected || []).map((e) => e.id));
      setSaveError('');
      setLoading(true);
      setLoadError('');
      try {
        const result = await providerService.getById(category.serviceId);
        if (cancelled) return;
        setService(result);
      } catch {
        if (!cancelled) setLoadError('No pudimos cargar las opciones de este servicio. Probá de nuevo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, category, reloadToken]);

  if (!category) return null;

  // No muestra paquetes eliminados/inactivos (providerService.getById ya solo
  // trae is_active=true) ni incompatibles con la cantidad de invitados del
  // evento — ver nota de isPackageGuestCompatible en lib/smartPackages.js
  // sobre por qué quote-preview no alcanza para filtrar esto.
  const eligiblePackages = (service?.packages || [])
    .filter((pkg) => isPackageGuestCompatible(pkg, service, totalGuests));
  // Extras: pertenecen al SERVICIO (no al paquete, sin FK a service_packages
  // en el esquema real) — válidos para cualquier paquete elegido, nunca se
  // filtran por packageId. Se leen del fetch de `service` (ya en curso para
  // los paquetes), NUNCA de `category.availableExtras`: ese campo viene de
  // la propuesta original y queda desactualizado si el usuario cambió de
  // proveedor (ver ProviderPickerModal.js) — usar la lista fresca evita
  // mostrar extras de un servicio que ya no es el vigente.
  const availableExtras = service?.extras || [];

  const toggleExtra = (id) => {
    setStagedExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (saving || !stagedPackageId) return;
    setSaving(true);
    setSaveError('');
    try {
      const pkg = eligiblePackages.find((p) => p.id === stagedPackageId);
      const extrasSelectedWire = stagedExtraIds.map((id) => ({ id, quantity: 1 }));
      const result = await availabilityService.quotePreview(category.serviceId, {
        event: buildQuotePreviewEvent(eventFormData),
        item: { package_id: stagedPackageId, extras_selected: extrasSelectedWire },
      });
      if (!result.available) {
        setSaveError('Esa configuración no está disponible para tu evento (fecha, capacidad o zona). Probá con otra.');
        return;
      }
      const override = buildServiceOverride({
        category,
        pkg: pkg || { id: stagedPackageId, name: category.packageName, includes: category.includes },
        extrasSelected: extrasSelectedWire,
        quotePreviewResult: result,
      });
      onApply(category.categoryId, override);
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'No pudimos cotizar esta configuración. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={`Personalizar — ${category.providerName}`}
      size="lg"
      footer={!loading && !loadError && eligiblePackages.length > 0 ? (
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} className="ml-auto">Guardar cambios</Button>
        </>
      ) : null}
    >
      <p className="text-sm text-gray-500 mb-4">
        {category.serviceTitle}{category.packageName ? ` · Actual: ${category.packageName}` : ''}
      </p>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-40 rounded-2xl skeleton" aria-hidden="true" />)}
        </div>
      )}

      {!loading && loadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AppIcon icon={TriangleAlert} size={16} aria-hidden="true" />
          {loadError}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setReloadToken((t) => t + 1)}>Reintentar</Button>
        </div>
      )}

      {!loading && !loadError && eligiblePackages.length === 0 && (
        <p className="text-sm text-gray-500 py-6 text-center">No encontramos otras opciones compatibles con tu evento para este servicio.</p>
      )}

      {!loading && !loadError && eligiblePackages.length > 0 && (
        <div className="space-y-6">
          <PackageSelector
            packages={eligiblePackages}
            selectedId={stagedPackageId}
            onSelect={setStagedPackageId}
          />

          {availableExtras.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Extras opcionales</h4>
              <div className="space-y-2">
                {availableExtras.map((extra) => (
                  <label
                    key={extra.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${stagedExtraIds.includes(extra.id) ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={stagedExtraIds.includes(extra.id)} onChange={() => toggleExtra(extra.id)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm font-medium text-gray-800">{extra.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">+{formatCurrency(extra.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {saveError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</div>
          )}
        </div>
      )}
    </Modal>
  );
}
