// Selección de adicionales agrupados — lógica pura, sin JSX ni fetch.
//
// Mismo criterio que packagePricingField.js: el frontend NUNCA es autoridad
// de precio. Estas funciones sirven para habilitar/deshabilitar controles y
// mostrar un total PROVISIONAL mientras el cliente elige; el monto real lo
// devuelve el backend en quote-preview y se vuelve a validar al reservar.
//
// El vocabulario espeja el del backend (package-modifiers.js) a propósito:
// si las reglas divergieran, la UI dejaría armar selecciones que el motor
// después rechaza.

// ── Etiquetas de un grupo ────────────────────────────────────────────────────

/**
 * "Obligatorio · Elegí 1" / "Opcional · Elegí hasta 2".
 * Se DERIVA de min/max: no existe una bandera "obligatorio" persistida.
 */
export function describeGroupRule(group) {
  if (!group) return '';
  const min = Number(group.minSelections ?? 0);
  const max = group.maxSelections == null ? null : Number(group.maxSelections);
  const base = min > 0 ? 'Obligatorio' : 'Opcional';

  if (min > 0 && max === min) return `${base} · Elegí ${min}`;
  if (min > 0 && max != null) return `${base} · Elegí entre ${min} y ${max}`;
  if (min > 0) return `${base} · Elegí al menos ${min}`;
  if (max != null) return `${base} · Elegí hasta ${max}`;
  return base;
}

// Un grupo con un solo cupo se comporta como radio; con varios, como checkbox.
export function groupInputType(group) {
  const max = group && group.maxSelections == null ? null : Number(group.maxSelections);
  return max === 1 ? 'radio' : 'checkbox';
}

/** "Incluido" cuando el delta es cero — nunca "$0", que se lee como error. */
export function formatDelta(priceDelta, formatCurrency) {
  const n = Number(priceDelta || 0);
  if (n === 0) return 'Incluido';
  return `+${formatCurrency ? formatCurrency(n) : n}`;
}

// ── Estado de la selección ───────────────────────────────────────────────────

const idsDe = (selections, groupId) =>
  (selections || []).filter((s) => s.groupId === groupId).map((s) => s.itemId);

export function isItemSelected(selections, groupId, itemId) {
  return idsDe(selections, groupId).includes(itemId);
}

export function countSelected(selections, groupId) {
  return idsDe(selections, groupId).length;
}

/**
 * Aplica un click sobre un item y devuelve la selección nueva.
 *
 * En un grupo de cupo 1 elegir reemplaza; en uno de varios cupos, alterna.
 * Al llegar al máximo, la función no agrega — el control además se deshabilita
 * en la UI, pero la regla vive acá para que no dependa del render.
 */
export function toggleItem(selections, group, itemId) {
  const actuales = selections || [];
  const groupId = group.id;
  const max = group.maxSelections == null ? null : Number(group.maxSelections);
  const yaEsta = isItemSelected(actuales, groupId, itemId);
  const otros = actuales.filter((s) => s.groupId !== groupId);
  const propios = actuales.filter((s) => s.groupId === groupId);

  if (yaEsta) {
    // Deseleccionar siempre se permite: la validación del mínimo corre al
    // confirmar, no mientras el cliente reacomoda su elección.
    return [...otros, ...propios.filter((s) => s.itemId !== itemId)];
  }
  if (max === 1) return [...otros, { groupId, itemId }];
  if (max != null && propios.length >= max) return actuales;
  return [...otros, ...propios, { groupId, itemId }];
}

/** ¿Este item se puede marcar, o el grupo ya llegó a su tope? */
export function canSelectMore(selections, group) {
  const max = group.maxSelections == null ? null : Number(group.maxSelections);
  if (max == null) return true;
  return countSelected(selections, group.id) < max;
}

// ── Validación previa al envío ───────────────────────────────────────────────

/**
 * Devuelve los grupos que impiden continuar. Vacío = se puede cotizar.
 * Es la misma regla que el backend, para que el botón no invite a un rechazo.
 */
export function validateSelection(groups, selections) {
  const problemas = [];
  for (const g of groups || []) {
    if (g.isActive === false) continue;
    const elegidos = countSelected(selections, g.id);
    const min = Number(g.minSelections ?? 0);
    const max = g.maxSelections == null ? null : Number(g.maxSelections);

    if (elegidos < min) {
      problemas.push({
        groupId: g.id,
        groupName: g.name,
        message: min === 1
          ? `Elegí una opción en "${g.name}".`
          : `Elegí al menos ${min} en "${g.name}".`,
      });
    } else if (max != null && elegidos > max) {
      problemas.push({
        groupId: g.id,
        groupName: g.name,
        message: `Podés elegir hasta ${max} en "${g.name}".`,
      });
    }
  }
  return problemas;
}

// ── Total provisional ────────────────────────────────────────────────────────

/**
 * Suma de los deltas elegidos. PROVISIONAL: sirve para que el cliente vea el
 * número moverse mientras elige. El total que se cobra sale del backend.
 *
 * Nunca suma el precio del extra base — ese pertenece al flujo legacy plano y
 * sumarlo acá sería el doble cobro que el motor rechaza.
 */
export function modifiersSubtotal(groups, selections) {
  let total = 0;
  for (const g of groups || []) {
    for (const it of g.items || []) {
      if (isItemSelected(selections, g.id, it.id)) total += Number(it.priceDelta || 0);
    }
  }
  return Math.round(total * 100) / 100;
}

/** Líneas para mostrar el desglose mientras se elige. */
export function selectionLines(groups, selections) {
  const lines = [];
  for (const g of groups || []) {
    for (const it of g.items || []) {
      if (isItemSelected(selections, g.id, it.id)) {
        lines.push({
          groupId: g.id, groupName: g.name,
          itemId: it.id, name: it.name,
          amount: Number(it.priceDelta || 0),
        });
      }
    }
  }
  return lines;
}

/** Payload para quote-preview y booking: solo ids, nunca cantidad ni precio. */
export function toModifierPayload(selections) {
  return (selections || []).map((s) => ({ group_id: s.groupId, item_id: s.itemId }));
}

/**
 * Preselección al abrir: en un grupo obligatorio de cupo 1 se marca la primera
 * alternativa (normalmente la variante "Incluido"), para que el cliente vea un
 * precio coherente desde el principio en vez de un error inmediato.
 */
export function defaultSelection(groups) {
  const out = [];
  for (const g of groups || []) {
    if (g.isActive === false) continue;
    const min = Number(g.minSelections ?? 0);
    const max = g.maxSelections == null ? null : Number(g.maxSelections);
    if (min === 1 && max === 1 && (g.items || []).length) {
      out.push({ groupId: g.id, itemId: g.items[0].id });
    }
  }
  return out;
}

/** Precio de entrada de los adicionales, para "Adicionales desde $X". */
export function cheapestPaidAddon(groups) {
  const pagos = (groups || [])
    .flatMap((g) => g.items || [])
    .map((i) => Number(i.priceDelta || 0))
    .filter((n) => n > 0);
  return pagos.length ? Math.min(...pagos) : null;
}
