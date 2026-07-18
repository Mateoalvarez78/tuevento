'use client';

import { Sparkles, TriangleAlert, CircleOff } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import CategoryLineItem from './CategoryLineItem';
import { formatCurrency } from '@/utils/formatters';
import { PROFILE_LABELS, budgetSharePct } from '@/lib/smartPackages';

/**
 * Una de las 3 propuestas devueltas por el backend (económica/equilibrada/
 * premium). Todos los números (total, restante, overBudget) vienen ya
 * calculados del motor — acá solo se formatean y se decide qué destacar.
 */
export default function ProposalCard({ proposal, budget }) {
  const { profile, totalPrice, remainingBudget, overBudget, recommended, categories, missingCategories } = proposal;
  const pct = budgetSharePct(totalPrice, budget);

  return (
    <Card
      variant={recommended ? 'selected' : 'default'}
      className={recommended ? 'ring-primary' : ''}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-lg font-bold text-gray-900">{PROFILE_LABELS[profile] || profile}</h3>
        {recommended && (
          <Badge variant="primary" icon={Sparkles} label="Recomendada para vos" />
        )}
      </div>

      <div className="mb-4">
        <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(totalPrice)}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {pct}% de tu presupuesto de {formatCurrency(budget)}
        </p>
        {overBudget ? (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AppIcon icon={TriangleAlert} size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>Esta propuesta supera tu presupuesto en {formatCurrency(Math.abs(remainingBudget))}. Igual te la mostramos como alternativa.</span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-emerald-600 font-medium">
            Te queda {formatCurrency(remainingBudget)} disponible
          </p>
        )}
      </div>

      <p className="text-xs font-medium text-gray-400 mb-1">
        {categories.length} categoría{categories.length === 1 ? '' : 's'} cubierta{categories.length === 1 ? '' : 's'}
        {missingCategories?.length > 0 ? ` · ${missingCategories.length} sin cubrir` : ''}
      </p>

      <div>
        {categories.map((cat) => (
          <CategoryLineItem key={cat.categoryId} category={cat} />
        ))}
      </div>

      {missingCategories?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3">
            <AppIcon icon={CircleOff} size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
            <div>
              <p className="font-medium text-gray-700 mb-1">No encontramos opciones compatibles para:</p>
              <ul className="space-y-0.5">
                {missingCategories.map((mc) => (
                  <li key={mc.categoryId}>{mc.categoryName}</li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs text-gray-400">
                Puede deberse a capacidad, disponibilidad, ubicación o falta de proveedores demo en esa categoría.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
