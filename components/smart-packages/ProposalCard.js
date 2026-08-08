'use client';

import { Sparkles, TriangleAlert, CircleOff, PartyPopper, Wallet, Scale, Gem, ChevronDown } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import CategoryLineItem from './CategoryLineItem';
import { formatCurrency } from '@/utils/formatters';
import { PROFILE_LABELS, PROFILE_DESCRIPTIONS, budgetSharePct, budgetBarWidthPct, roundForDisplay } from '@/lib/smartPackages';

// Identidad visual sutil por perfil — independiente de cuál sea la
// "recomendada" (`proposal.recommended`, que depende de la preferencia que
// eligió el usuario en el paso 2, no siempre es "equilibrada": ver
// smart-packages.service.js#simulate). Un solo ícono chico junto al título,
// nunca un tratamiento que compita con el borde/fondo de la recomendada.
const PROFILE_ICONS = { economica: Wallet, equilibrada: Scale, premium: Gem };

/**
 * Una de las 3 propuestas devueltas por el backend (económica/equilibrada/
 * premium). Todos los números (total, restante, overBudget) vienen ya
 * calculados del motor — acá solo se formatean y se decide qué destacar.
 * `roundForDisplay`/`budgetBarWidthPct` son puramente presentacionales
 * (ver lib/smartPackages.js): nunca alteran el valor real usado para % o
 * "te queda", solo el string que se muestra.
 *
 * `onSelect`: si se pasa, muestra el botón "Elegir esta propuesta" — el
 * componente no persiste nada por sí mismo, solo delega en el callback
 * (ver components/smart-packages/SmartPackagesGenerator.js#handleSelect,
 * que usa hooks/useAcceptProposal.js). Comportamiento sin cambios.
 */
export default function ProposalCard({ proposal, budget, onSelect, selecting = false, disabled = false }) {
  const { profile, totalPrice, remainingBudget, overBudget, recommended, categories, missingCategories } = proposal;
  const pct = budgetSharePct(totalPrice, budget);
  const barPct = budgetBarWidthPct(totalPrice, budget);
  const ProfileIcon = PROFILE_ICONS[profile];
  const explained = categories.filter((c) => c.explanation);

  return (
    <Card
      variant={recommended ? 'selected' : 'default'}
      // h-full + flex-col: dentro del grid de 3 columnas, las 3 cards ya
      // estiran a la altura de la fila (comportamiento default de CSS
      // Grid) — esto hace que el CONTENIDO interno seteé esa misma altura
      // como límite y empuje el CTA al fondo con `mt-auto` más abajo, así
      // las 3 acciones quedan alineadas aunque una card tenga más
      // categorías/explicaciones que otra.
      className={`h-full flex flex-col ${recommended ? 'bg-primary-light/30 shadow-md' : ''}`}
    >
      {/* ── Encabezado: qué opción es ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {ProfileIcon && <AppIcon icon={ProfileIcon} size={16} className="text-gray-400 shrink-0" aria-hidden="true" />}
          <h3 className="text-lg font-bold text-gray-900 truncate">{PROFILE_LABELS[profile] || profile}</h3>
        </div>
        {recommended && (
          <Badge variant="primary" icon={Sparkles} label="Recomendada" className="shrink-0" />
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">{PROFILE_DESCRIPTIONS[profile]}</p>

      {/* ── Resumen económico: lo más importante de la card ───────────── */}
      <div className="mb-5">
        <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{formatCurrency(roundForDisplay(totalPrice))}</p>

        <div className="mt-2.5 h-1.5 rounded-full bg-gray-100 overflow-hidden" role="presentation">
          <div
            className={`h-full rounded-full ${overBudget ? 'bg-amber-400' : 'bg-primary'}`}
            style={{ width: `${barPct}%` }}
          />
        </div>

        {overBudget ? (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
            <AppIcon icon={TriangleAlert} size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>Supera tu presupuesto en {formatCurrency(roundForDisplay(Math.abs(remainingBudget)))} ({pct}%). Te la mostramos igual como alternativa.</span>
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{pct}%</span> de tu presupuesto · Te quedan <span className="font-semibold text-gray-700">{formatCurrency(roundForDisplay(remainingBudget))}</span>
          </p>
        )}
      </div>

      {/* ── Servicios incluidos: qué incluye / quién lo brinda ────────── */}
      {/* border-t propio (además del mb-5 del bloque económico de arriba):
          separa visualmente "cuánto cuesta" de "qué incluye" — antes ambos
          bloques quedaban demasiado pegados. */}
      <p className="text-xs font-semibold text-gray-400 mb-1 pt-4 border-t border-gray-100">
        {categories.length} servicio{categories.length === 1 ? '' : 's'} incluido{categories.length === 1 ? '' : 's'}
      </p>

      <div>
        {categories.map((cat) => (
          <CategoryLineItem key={cat.categoryId} category={cat} />
        ))}
      </div>

      {missingCategories?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
            <AppIcon icon={CircleOff} size={14} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
            <p>
              Sin opciones compatibles para <span className="font-medium text-gray-700">{missingCategories.map((mc) => mc.categoryName).join(', ')}</span> (capacidad, disponibilidad o ubicación).
            </p>
          </div>
        </div>
      )}

      {/* ── Por qué (secundario, a pedido) ─────────────────────────────── */}
      {explained.length > 0 && (
        <details className="group mt-3 pt-3 border-t border-gray-100">
          <summary className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
            Por qué elegimos estos servicios
            <AppIcon icon={ChevronDown} size={13} className="transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="mt-2 space-y-1.5">
            {explained.map((cat) => (
              <li key={cat.categoryId} className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-600">{cat.categoryName}:</span> {cat.explanation}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* ── Acción ──────────────────────────────────────────────────────── */}
      {/* mt-auto (no mt-5 fijo): empuja el CTA al fondo de la card — con
          `h-full flex flex-col` en <Card> de arriba, las 3 propuestas del
          grid quedan con la misma altura de fila, así que esto alinea el
          botón entre las 3 aunque tengan distinta cantidad de categorías/
          categorías faltantes/explicaciones arriba. */}
      {onSelect && categories.length > 0 && (
        <div className="mt-auto pt-4 border-t border-gray-100">
          <Button
            className="w-full"
            variant={recommended ? 'primary' : 'outline'}
            icon={PartyPopper}
            loading={selecting}
            disabled={disabled && !selecting}
            onClick={onSelect}
          >
            {selecting ? 'Agregando a tu evento…' : 'Elegir esta propuesta'}
          </Button>
        </div>
      )}
    </Card>
  );
}
