'use client';

import Chip from '@/components/Chip';
import { PREFERENCE_OPTIONS } from '@/lib/smartPackages';

/**
 * Paso 2 del generador: selección múltiple de categorías (patrón Chip, igual
 * que /catalogo y FilterSidebar — no existe un componente MultiSelect en el
 * Design System, ver docs/COMPONENT_LIBRARY.md) + preferencia de propuesta.
 */
export default function CategoriesStepForm({ categories, selectedIds, onToggleCategory, preference, onPreferenceChange, errors = {} }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            ¿Qué servicios necesitás? *
          </label>
          <span className="text-xs text-gray-400">
            {selectedIds.length} seleccionada{selectedIds.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías de servicio">
          {categories.map((cat) => (
            <Chip
              key={cat.categoryId}
              icon={cat.icon}
              selected={selectedIds.includes(cat.categoryId)}
              onClick={() => onToggleCategory(cat.categoryId)}
            >
              {cat.label}
            </Chip>
          ))}
        </div>
        {errors.categoryIds && <p className="mt-2 text-xs text-danger">{errors.categoryIds}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Qué tipo de propuesta preferís?
        </label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Preferencia de propuesta">
          {PREFERENCE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              selected={preference === opt.value}
              onClick={() => onPreferenceChange(opt.value)}
              aria-checked={preference === opt.value}
              role="radio"
            >
              {opt.label}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Igual te mostramos las 3 propuestas — esto solo destaca la que mejor se ajusta a lo que preferís.
        </p>
      </div>
    </div>
  );
}
