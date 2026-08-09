// ─── Helpers puros de EditItemModal ─────────────────────────────────────
// Separados de components/my-event/EditItemModal.js porque Vitest en este
// repo no puede importar archivos .js con JSX (ver docs/DECISIONS.md,
// mismo límite que documenta lib/MyEventContext.js) — mismo criterio que
// lib/smartPackages.js concentra la lógica pura de SmartPackagesGenerator.js.
// Nunca calcula precio/disponibilidad: solo arma el body que después
// PATCH /me/events/:eventId/items/:itemId recotiza server-side.

/** '' (o null/undefined) = sin override, hereda del evento (se manda `null`
 * en el patch); cualquier otro string = override explícito propio. */
export function overrideFieldToPatchValue(text) {
  return text === '' || text == null ? null : Number(text);
}

/** Arma el body de PATCH .../items/:itemId a partir del estado del form de
 * EditItemModal — misma forma que espera updateItem (myEventService.js). */
export function buildEditItemPatch({ packageId, extraIds, adults, children, celiacs, extraHours, notes }) {
  return {
    package_id: packageId,
    extras_selected: (extraIds || []).map((id) => ({ id, quantity: 1 })),
    adults_count_override: overrideFieldToPatchValue(adults),
    children_count_override: overrideFieldToPatchValue(children),
    celiacs_count: overrideFieldToPatchValue(celiacs),
    extra_hours: overrideFieldToPatchValue(extraHours),
    notes: notes && notes.trim() ? notes.trim() : null,
  };
}
