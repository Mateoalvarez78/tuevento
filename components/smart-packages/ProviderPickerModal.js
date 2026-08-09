'use client';

// Cambiar el PROVEEDOR de un servicio de una propuesta de Smart Packages,
// ANTES de pulsar "Elegir esta propuesta" — hasta ahora esto solo era
// posible después de importar a "Mi evento" (ChangeServiceModal.js). Las
// alternativas salen de `category.substitutes` — ya vienen en la respuesta
// de simulate() (el motor ya calcula todos los candidatos de la categoría,
// ya filtrados por capacidad/cobertura/disponibilidad/estado activo, ver
// smart-packages.service.js#fetchCandidatesForCategory/#toSubstitute), sin
// fetch nuevo. Nunca se muestra un proveedor incompatible "para llenar la
// lista": la lista es exactamente lo que el motor ya validó.
//
// Mismo modelo de interacción que PackagePickerModal.js: selección LOCAL
// (staging) + una sola confirmación explícita ("Usar este proveedor") que
// dispara UNA cotización real. Si el usuario vuelve a elegir el proveedor
// ya vigente, no se cotiza de nuevo (ver isSameProvider en lib/smartPackages.js).

import { useEffect, useState } from 'react';
import { CheckCircle2, Star, TriangleAlert, Users } from 'lucide-react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import AppIcon from '@/components/AppIcon';
import { assetUrl } from '@/services/api';
import { availabilityService } from '@/services/availabilityService';
import { formatCurrency } from '@/utils/formatters';
import {
  buildProviderOverride, buildQuotePreviewEvent, currentProviderAsCandidate, isSameProvider, roundForDisplay,
} from '@/lib/smartPackages';

function CandidateThumbnail({ servicePrimaryImage, alt }) {
  const [errored, setErrored] = useState(false);
  const src = servicePrimaryImage ? assetUrl(servicePrimaryImage) : null;
  if (src && !errored) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" onError={() => setErrored(true)} className="w-14 h-14 rounded-xl shrink-0 object-cover bg-gray-100" />;
  }
  return <div className="w-14 h-14 rounded-xl shrink-0 bg-gray-100" aria-hidden="true" />;
}

function capacityLabel(capacity) {
  if (!capacity) return null;
  if (capacity.min != null && capacity.max != null) return `${capacity.min}–${capacity.max} personas`;
  if (capacity.max != null) return `Hasta ${capacity.max} personas`;
  if (capacity.min != null) return `Desde ${capacity.min} personas`;
  return null;
}

export default function ProviderPickerModal({ open, onClose, category, eventFormData, onApply }) {
  const [stagedProviderId, setStagedProviderId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!open || !category) return;
    let cancelled = false;
    // Promise.resolve().then(...) — nunca setState síncrono dentro del cuerpo
    // del efecto, mismo criterio que PackagePickerModal.js/EditItemModal.js.
    // Reinicia el staging con el proveedor VIGENTE cada vez que se (re)abre.
    Promise.resolve().then(() => {
      if (cancelled) return;
      setStagedProviderId(category.providerId);
      setSaveError('');
    });
    return () => { cancelled = true; };
  }, [open, category]);

  if (!category) return null;

  const current = currentProviderAsCandidate(category);
  // El actual siempre primero — nunca duplicado si por algún motivo apareciera también en substitutes.
  const options = [current, ...(category.substitutes || []).filter((s) => s.providerId !== category.providerId)];
  const hasAlternatives = options.length > 1;
  const stagedCandidate = options.find((o) => o.providerId === stagedProviderId) || current;
  const willChangeProvider = !isSameProvider(stagedCandidate, category);
  const willLoseExtras = willChangeProvider && (category.extrasSelected || []).length > 0;

  const handleConfirm = async () => {
    if (saving) return;
    if (!willChangeProvider) { onClose(); return; } // no-op: no recotiza innecesariamente
    setSaving(true);
    setSaveError('');
    try {
      const result = await availabilityService.quotePreview(stagedCandidate.serviceId, {
        event: buildQuotePreviewEvent(eventFormData),
        item: { package_id: stagedCandidate.packageId, extras_selected: [] },
      });
      if (!result.available) {
        setSaveError('Ese proveedor no está disponible para tu evento (fecha, capacidad o zona). Probá con otro.');
        return;
      }
      const override = buildProviderOverride({ candidate: stagedCandidate, quotePreviewResult: result });
      onApply(category.categoryId, override);
      onClose();
    } catch (err) {
      setSaveError(err?.message || 'No pudimos cotizar este proveedor. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={`Cambiar proveedor — ${category.categoryName}`}
      size="lg"
      footer={hasAlternatives ? (
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleConfirm} loading={saving} className="ml-auto">
            {willChangeProvider ? 'Usar este proveedor' : 'Cerrar'}
          </Button>
        </>
      ) : null}
    >
      {!hasAlternatives && (
        <p className="text-sm text-gray-500 py-6 text-center">
          No encontramos otros proveedores compatibles con la fecha, ubicación y cantidad de invitados de este evento.
        </p>
      )}

      {hasAlternatives && (
        <div className="space-y-2.5">
          {options.map((candidate) => {
            const selected = candidate.providerId === stagedProviderId;
            const isCurrent = candidate.providerId === category.providerId;
            const priceDiff = roundForDisplay(candidate.categoryTotal) - roundForDisplay(category.subtotal);
            return (
              <button
                key={candidate.providerId}
                type="button"
                disabled={saving}
                onClick={() => setStagedProviderId(candidate.providerId)}
                aria-pressed={selected}
                className={`w-full flex items-start gap-3 text-left p-3 rounded-xl border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  selected ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CandidateThumbnail servicePrimaryImage={candidate.servicePrimaryImage} alt={candidate.providerName} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-900 truncate">{candidate.providerName}</p>
                    {candidate.providerVerified && (
                      <AppIcon icon={CheckCircle2} size={14} className="text-success shrink-0" aria-label="Proveedor verificado" />
                    )}
                    {isCurrent && <Badge variant="neutral" size="sm">Actual</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{candidate.serviceTitle}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    {candidate.providerTotalReviews > 0 ? (
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <AppIcon icon={Star} size={12} className="text-warning fill-current" aria-hidden="true" />
                        {candidate.providerRating.toFixed(1)} ({candidate.providerTotalReviews})
                      </span>
                    ) : (
                      <span className="text-gray-400">Proveedor nuevo</span>
                    )}
                    {capacityLabel(candidate.capacity) && (
                      <span className="flex items-center gap-1">
                        <AppIcon icon={Users} size={12} aria-hidden="true" />
                        {capacityLabel(candidate.capacity)}
                      </span>
                    )}
                  </div>
                  {candidate.packageName && (
                    <p className="mt-1 text-xs text-gray-500 truncate">Paquete: {candidate.packageName}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(roundForDisplay(candidate.categoryTotal))}</p>
                  {!isCurrent && priceDiff !== 0 && (
                    <p className={`text-xs whitespace-nowrap ${priceDiff > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {willLoseExtras && (
        <div className="mt-4 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AppIcon icon={TriangleAlert} size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Al cambiar de proveedor se quitarán los extras seleccionados para el servicio actual.
        </div>
      )}

      {saveError && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</div>
      )}
    </Modal>
  );
}
