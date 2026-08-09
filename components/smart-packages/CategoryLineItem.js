'use client';

import { useState } from 'react';
import { CheckCircle, RefreshCw, SlidersHorizontal, Star, Users } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import { assetUrl } from '@/services/api';
import { getCategoryIcon } from '@/utils/icons';
import { formatCurrency } from '@/utils/formatters';
import { roundForDisplay } from '@/lib/smartPackages';

const MAX_INCLUDES_VISIBLE = 3;
const THUMB_CLASSES = 'w-16 h-16 rounded-xl shrink-0 object-cover bg-gray-100';

/**
 * Miniatura del servicio: usa `servicePrimaryImage` si el backend la trajo
 * (mismo campo que ya resuelve el catálogo, ver services/api.js#assetUrl —
 * nunca se pide una imagen nueva al backend acá). Sin imagen, o si falla la
 * carga, cae a un fallback por categoría (mismo ícono que ya usa
 * ServiceCard.js#Cover en el catálogo — no se inventa un segundo criterio).
 *
 * Nota: a propósito NO hay fade-in con estado `loaded`/`opacity-0→100` (como
 * sí tiene ServiceCard.js#Cover) — ese patrón puede dejar la imagen
 * invisible para siempre si el navegador la resuelve desde caché antes de
 * que React llegue a enganchar el listener `onLoad` (la imagen nunca dispara
 * el evento, `loaded` se queda en `false`). Acá la imagen es visible apenas
 * se monta; solo `onError` decide si cae al fallback.
 */
function ServiceThumbnail({ servicePrimaryImage, categorySlug, alt }) {
  const [errored, setErrored] = useState(false);
  const src = servicePrimaryImage ? assetUrl(servicePrimaryImage) : null;

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setErrored(true)}
        className={THUMB_CLASSES}
      />
    );
  }

  const CategoryIcon = getCategoryIcon(categorySlug);
  return (
    <div className={`${THUMB_CLASSES} flex items-center justify-center bg-gradient-to-br from-primary-light to-gray-50`}>
      <AppIcon icon={CategoryIcon} size={24} strokeWidth={1.5} className="text-primary/50" aria-hidden="true" />
    </div>
  );
}

/**
 * Ficha de un servicio dentro de una propuesta — jerarquía: categoría →
 * identidad del proveedor → info relevante (rating/capacidad) → paquete
 * vigente + subtotal → acciones. La `explanation` del motor NO se muestra
 * acá (ver ProposalCard.js: se agrupan todas en un detalle colapsable "Por
 * qué elegimos estos servicios").
 *
 * Acciones (`onEditPackage`/`onChangeProvider`, ambas opcionales — sin
 * ninguna de las dos, la card queda de solo lectura): dos pesos visuales
 * distintos a propósito, nunca dos botones grandes compitiendo — "Cambiar
 * proveedor" (`ghost`, compacto) es secundaria; "Personalizar" (`outline`,
 * ocupa el resto del ancho) es la principal del servicio — reemplaza
 * conceptualmente a "Elegir opción"/"Editar opciones" de la versión
 * anterior, con el resumen de extras plegado en el propio label
 * ("Personalizar · 2 extras") en vez de una lista permanente en la card.
 */
export default function CategoryLineItem({ category, onEditPackage, onChangeProvider }) {
  const {
    categoryName, categorySlug, providerName, providerVerified, serviceTitle, packageName,
    includes, subtotal, rating, reviewCount, capacity, servicePrimaryImage, extrasSelected,
  } = category;
  const extrasCount = extrasSelected?.length || 0;
  const personalizeLabel = extrasCount > 0
    ? `Personalizar · ${extrasCount} extra${extrasCount === 1 ? '' : 's'}`
    : 'Personalizar';

  const visibleIncludes = includes?.slice(0, MAX_INCLUDES_VISIBLE) || [];
  const extraIncludesCount = (includes?.length || 0) - visibleIncludes.length;

  return (
    <div className="py-3.5 first:pt-0 last:pb-0 border-b border-gray-100 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-2">{categoryName}</p>

      {/* Identidad del proveedor + info relevante */}
      <div className="flex gap-3">
        <ServiceThumbnail servicePrimaryImage={servicePrimaryImage} categorySlug={categorySlug} alt={providerName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{providerName}</p>
            {providerVerified && (
              <AppIcon icon={CheckCircle} size={13} className="text-success shrink-0" aria-label="Proveedor verificado" />
            )}
          </div>
          {serviceTitle && <p className="text-xs text-gray-400 truncate">{serviceTitle}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {rating > 0 ? (
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <AppIcon icon={Star} size={12} className="text-warning fill-current" aria-hidden="true" />
                {rating.toFixed(1)} ({reviewCount})
              </span>
            ) : (
              <span className="text-gray-400">Proveedor nuevo</span>
            )}
            {(capacity?.min != null || capacity?.max != null) && (
              <span className="flex items-center gap-1">
                <AppIcon icon={Users} size={12} aria-hidden="true" />
                {capacity.min ?? '0'}–{capacity.max ?? '∞'} personas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Paquete/configuración vigente + subtotal */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Paquete seleccionado</p>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-gray-900 min-w-0 truncate">{packageName}</p>
          <p className="text-sm font-bold text-gray-900 shrink-0 whitespace-nowrap">{formatCurrency(roundForDisplay(subtotal))}</p>
        </div>
        {visibleIncludes.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {visibleIncludes.join(' · ')}{extraIncludesCount > 0 ? ` +${extraIncludesCount}` : ''}
          </p>
        )}
      </div>

      {/* Acciones — pesos distintos: Personalizar (principal) > Cambiar proveedor (secundaria) */}
      {(onEditPackage || onChangeProvider) && (
        <div className="mt-3 flex items-center gap-2">
          {onChangeProvider && (
            <Button size="sm" variant="ghost" icon={RefreshCw} onClick={onChangeProvider}>
              Cambiar proveedor
            </Button>
          )}
          {onEditPackage && (
            <Button size="sm" variant="outline" icon={SlidersHorizontal} onClick={onEditPackage} className="flex-1">
              {personalizeLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
