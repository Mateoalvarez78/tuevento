'use client';

import { useState } from 'react';
import { Star, Users, CheckCircle } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Badge from '@/components/Badge';
import { assetUrl } from '@/services/api';
import { getCategoryIcon } from '@/utils/icons';
import { formatCurrency } from '@/utils/formatters';
import { roundForDisplay } from '@/lib/smartPackages';

const MAX_INCLUDES_VISIBLE = 4;
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
 * Mini ficha de un servicio dentro de una propuesta: proveedor, paquete,
 * rating, capacidad, qué incluye y precio — pensada para leerse en 2-3
 * segundos, no como una fila de tabla. La `explanation` del motor NO se
 * muestra acá (ver ProposalCard.js: se agrupan todas en un detalle
 * colapsable "Por qué elegimos estos servicios").
 *
 * El nombre del proveedor va en su PROPIA fila a ancho completo (no
 * comparte fila con el precio) — a diferencia de la primera versión, donde
 * precio+categoría competían por el mismo ancho que el nombre y provocaban
 * truncados innecesarios en nombres largos ("Casona del..."). El precio baja
 * a la fila de "incluye", alineado a la derecha — mismo criterio que el
 * layout de referencia del pedido de diseño.
 */
export default function CategoryLineItem({ category }) {
  const {
    categoryName, categorySlug, providerName, providerVerified, serviceTitle, packageName,
    includes, subtotal, rating, reviewCount, capacity, servicePrimaryImage,
  } = category;

  const visibleIncludes = includes?.slice(0, MAX_INCLUDES_VISIBLE) || [];
  const extraIncludesCount = (includes?.length || 0) - visibleIncludes.length;

  return (
    <div className="flex gap-3 py-3.5 first:pt-0 last:pb-0 border-b border-gray-100 last:border-0">
      <ServiceThumbnail servicePrimaryImage={servicePrimaryImage} categorySlug={categorySlug} alt={providerName} />

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-0.5">{categoryName}</p>

        <div className="flex items-center gap-1">
          <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{providerName}</p>
          {providerVerified && (
            <AppIcon icon={CheckCircle} size={13} className="text-success shrink-0" aria-label="Proveedor verificado" />
          )}
        </div>
        {(serviceTitle || packageName) && (
          <p className="text-xs text-gray-400 truncate">
            {serviceTitle}{packageName ? ` · ${packageName}` : ''}
          </p>
        )}

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

        <div className="mt-2 flex items-end justify-between gap-2">
          {visibleIncludes.length > 0 ? (
            <div className="flex flex-wrap gap-1 min-w-0">
              {visibleIncludes.map((item) => (
                <Badge key={item} variant="neutral" size="sm">{item}</Badge>
              ))}
              {extraIncludesCount > 0 && (
                <Badge variant="neutral" size="sm">+{extraIncludesCount}</Badge>
              )}
            </div>
          ) : <span />}
          <p className="text-sm font-bold text-gray-900 shrink-0 whitespace-nowrap">{formatCurrency(roundForDisplay(subtotal))}</p>
        </div>
      </div>
    </div>
  );
}
