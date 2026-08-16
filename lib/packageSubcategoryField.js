// ─── CAMPO DE SUBCATEGORÍA (Menú/Opción) — lógica pura ────────────────────
// Sin JSX, sin fetch — extraída de MenuManager.js para poder testearla con
// Vitest en su entorno por defecto ("node", sin jsdom). Ver docs/DECISIONS.md
// sobre por qué este proyecto no tiene tests de render de componentes: un
// archivo con JSX (incluidos los ya existentes como AppIcon.js/Button.js) no
// se puede importar hoy desde un test de Vitest en este repo.
//
// Configuración administrable del catálogo (Admin > Configuración del
// catálogo): label/ayuda/obligatoriedad/habilitación YA NO se hardcodean por
// `slug` acá — vienen de 4 columnas de `categories`
// (package_options_enabled/package_option_required/package_option_label/
// package_option_help_text) que un admin edita desde el panel, resueltas
// directo en la fila del `service` (ver serviceService.js#mapService). Este
// archivo solo aplica el fallback genérico cuando el admin dejó el label/
// ayuda vacíos — nunca vuelve a depender de un slug específico.
const DEFAULT_FIELD_LABEL = 'Tipo de servicio / opción';

/** Label del campo — el que cargó el admin para la categoría, o el fallback genérico si lo dejó vacío. */
export function getSubcategoryFieldLabel(configuredLabel) {
  return configuredLabel || DEFAULT_FIELD_LABEL;
}

/**
 * Ayuda breve opcional debajo del campo. `null` si el admin no cargó una —
 * nunca se inventa un texto genérico no pedido.
 */
export function getSubcategoryHelpText(configuredHelpText) {
  return configuredHelpText || null;
}

/**
 * Una categoría exige clasificación si y solo si tiene subcategorías
 * activas — nunca hardcodeado a "es catering o repostería". Cualquier
 * categoría futura con subcategorías activas queda cubierta sin tocar este
 * archivo.
 */
export function isSubcategoryRequired(subcategories) {
  return Array.isArray(subcategories) && subcategories.length > 0;
}

/**
 * Traduce el `status` de `useSubcategories` ('idle' | 'loading' | 'success' |
 * 'error') MÁS la configuración administrable de la categoría
 * (`optionsEnabled`/`requiredConfig`, de `category.package_options_enabled`/
 * `package_option_required`) a las 3 banderas que necesita el resto del
 * formulario. Único lugar que hace esta traducción — MenuManager.js la
 * consume en vez de repetirla inline, así la lógica real que decide "¿puedo
 * guardar?" queda cubierta por test (Vitest no puede importar
 * MenuManager.js, que sí tiene JSX — ver cabecera del archivo).
 *
 * En la práctica, MenuManager solo llama a `useSubcategories` cuando
 * `optionsEnabled` es true (categoryId es `null` si no), así que `status`
 * ya queda en 'idle' cuando está deshabilitada — pero esta función igual
 * chequea `optionsEnabled` explícitamente, para ser correcta por sí sola
 * sin depender de cómo la llame el caller.
 *
 *   resolved:   true solo con 'success' o 'idle' — 'loading'/'error' NUNCA
 *               son "resueltos" (ver validateSubcategorySelection: bloquea
 *               guardar mientras no estén resueltos, para no confundir una
 *               carga en curso o un error de red con "sin subcategorías").
 *   required:   true solo si la categoría lo tiene habilitado+requerido Y
 *               'success' trajo al menos una subcategoría activa. Si el
 *               admin no las tiene activas, nunca es obligatorio (mismo
 *               criterio que antes: no forzar una selección imposible).
 *   showField:  true si la categoría tiene la función habilitada Y
 *               ('loading'/'error' — todavía no sabemos si hay opciones,
 *               pero hay que mostrar el estado — o terminó habiendo
 *               opciones activas). Nunca true si `optionsEnabled` es false.
 */
export function deriveSubcategoryFieldState(status, subcategories, optionsEnabled, requiredConfig) {
  const resolved = status === 'success' || status === 'idle';
  const hasActiveOptions = status === 'success' && isSubcategoryRequired(subcategories);
  const required = !!optionsEnabled && !!requiredConfig && hasActiveOptions;
  const showField = !!optionsEnabled && (status === 'loading' || status === 'error' || hasActiveOptions);
  return { resolved, required, showField };
}

/**
 * Arma las opciones a renderizar en el <select>, en el mismo orden que ya
 * devuelve el backend (sort_order). Si el paquete tiene una subcategoría
 * persistida (`currentSubcategoryId`) que NO está entre las activas
 * cargadas — típicamente una de las 6 legacy inactivas de Catering, o
 * cualquier subcategoría desactivada después — se antepone una opción
 * sintética identificable ("<Nombre> (ya no disponible)") en vez de
 * perderla del selector o reasignarla en silencio. `currentSubcategoryName`
 * viene de `subcategory_name` (columna resuelta en el backend con LEFT JOIN,
 * SIN filtrar por is_active — por eso está disponible incluso para una fila
 * inactiva). Nunca reactiva la fila ni inventa un nombre.
 */
export function buildSubcategoryOptions(subcategories, currentSubcategoryId, currentSubcategoryName) {
  const active = Array.isArray(subcategories) ? subcategories : [];
  const options = active.map((s) => ({ value: s.id, label: s.name }));
  const isCurrentAmongActive = currentSubcategoryId
    ? active.some((s) => s.id === currentSubcategoryId)
    : true; // sin subcategory_id persistido: no hay nada "histórico" que preservar
  if (currentSubcategoryId && !isCurrentAmongActive) {
    options.unshift({
      value: currentSubcategoryId,
      label: `${currentSubcategoryName || 'Subcategoría'} (ya no disponible)`,
      historical: true,
    });
  }
  return options;
}

/**
 * Valida la selección antes de guardar. Nunca confunde un error de red (o
 * una carga todavía en curso) con "esta categoría no tiene subcategorías":
 * si `resolved` es false, bloquea el guardado sin importar `required` — no
 * hay forma de confirmar que la clasificación no hace falta sin una
 * respuesta exitosa del backend. `validOptionIds` son los `value` que el
 * <select> realmente está renderizando (activas + la opción histórica
 * sintética, si aplica) — reenviar exactamente el mismo id histórico que ya
 * tenía el paquete es válido (el backend lo trata como "sin cambios"), pero
 * ningún id fuera de esa lista puede viajar.
 */
export function validateSubcategorySelection({ resolved, required, subcategoryId, validOptionIds }) {
  if (!resolved) {
    return { valid: false, message: 'No se pudieron cargar las opciones. Reintentá antes de guardar.' };
  }
  if (!required) return { valid: true };
  if (!subcategoryId) {
    return { valid: false, message: 'Seleccioná una opción.' };
  }
  if (Array.isArray(validOptionIds) && !validOptionIds.includes(subcategoryId)) {
    return { valid: false, message: 'La opción seleccionada ya no está disponible. Elegí otra.' };
  }
  return { valid: true };
}
