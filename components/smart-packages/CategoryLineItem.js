'use client';

import { Star, MapPinned, Users } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { formatCurrency } from '@/utils/formatters';

/**
 * Una categoría dentro de una propuesta: proveedor elegido, servicio,
 * paquete, precio/traslado/subtotal, rating y la explicación determinística
 * que ya viene armada del backend (nunca se inventa texto acá).
 */
export default function CategoryLineItem({ category }) {
  const {
    categoryName, providerName, serviceTitle, packageName, includes,
    basePrice, travelCost, subtotal, rating, reviewCount, capacity, explanation,
  } = category;

  return (
    <div className="py-4 first:pt-0 last:pb-0 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-0.5">{categoryName}</p>
          <p className="text-base font-bold text-gray-900 truncate">{providerName}</p>
          <p className="text-sm text-gray-500 truncate">{serviceTitle}{packageName ? ` · ${packageName}` : ''}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-gray-900">{formatCurrency(subtotal)}</p>
          <p className="text-xs text-gray-400">
            {formatCurrency(basePrice)}{travelCost > 0 ? ` + ${formatCurrency(travelCost)} traslado` : ''}
          </p>
        </div>
      </div>

      {includes?.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {includes.map((item) => (
            <li key={item} className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {rating > 0 ? (
          <span className="flex items-center gap-1 font-medium text-gray-700">
            <AppIcon icon={Star} size={12} className="text-amber-400 fill-amber-400" aria-hidden="true" />
            {rating.toFixed(1)} ({reviewCount} reseña{reviewCount === 1 ? '' : 's'})
          </span>
        ) : (
          <span className="text-gray-400">Proveedor nuevo, todavía sin reseñas</span>
        )}
        {(capacity?.min != null || capacity?.max != null) && (
          <span className="flex items-center gap-1">
            <AppIcon icon={Users} size={12} aria-hidden="true" />
            {capacity.min ?? '0'}–{capacity.max ?? '∞'} personas
          </span>
        )}
        {travelCost > 0 && (
          <span className="flex items-center gap-1">
            <AppIcon icon={MapPinned} size={12} aria-hidden="true" />
            Traslado incluido
          </span>
        )}
      </div>

      {explanation && (
        <p className="mt-2 text-xs text-gray-500 italic">{explanation}</p>
      )}
    </div>
  );
}
