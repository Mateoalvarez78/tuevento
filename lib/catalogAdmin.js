// ─── ADMIN > CONFIGURACIÓN DEL CATÁLOGO — lógica pura ─────────────────────
// Sin JSX, sin fetch — mismo criterio que packageSubcategoryField.js: se
// extrae acá todo lo que se pueda testear sin depender de renderizar
// app/admin/catalogo/page.js (Vitest en este repo no puede importar un
// archivo .js con JSX, ver docs/DECISIONS.md).

import { PRICING_MODELS, GUEST_USAGE_MODES, CAPACITY_BASIS_VALUES, getPricingModelLabel, GUEST_USAGE_MODE_LABELS } from './packagePricingField';

// Mismo patrón kebab-case que el backend exige (categories.routes.js/
// service-subcategories.routes.js#SLUG_PATTERN) — se valida acá ANTES de
// mandar el request, pero el backend es la autoridad real (nunca se confía
// solo en esto).
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Autogenera un slug kebab-case a partir del nombre — el admin lo ve
 * precompletado y editable antes de crear (nunca se re-genera solo después
 * de la primera vez que el campo se toca a mano, eso lo maneja el
 * componente, no esta función).
 */
export function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // saca acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isSlugFormatValid(slug) {
  return SLUG_PATTERN.test(String(slug || ''));
}

/**
 * Mueve un id una posición arriba/abajo dentro de un array — reemplaza
 * drag&drop (explícitamente fuera de alcance) con controles simples.
 * Devuelve el MISMO array (misma referencia) si ya está en el borde — el
 * caller puede usar esto para deshabilitar el botón sin lógica duplicada.
 */
export function reorderIds(ids, index, direction) {
  if (!Array.isArray(ids)) return ids;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= ids.length || targetIndex < 0 || targetIndex >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

/**
 * Mensaje humano PREVENTIVO para el diálogo de confirmación de borrado,
 * construido a partir de los contadores que YA vienen en el listado
 * (`mapAdminCategory`/`mapAdminSubcategory`) — evita un round-trip extra
 * antes de intentar. La respuesta AUTORITATIVA sigue siendo el 409 que
 * arma el backend al intentar de verdad (categories.service.js#remove/
 * service-subcategories.service.js#remove) — esto es solo para no
 * sorprender al admin con un error después de confirmar.
 * `counts`: [{ count, singular, plural }] — genérico, sirve para
 * categorías (servicios/proveedores/eventos en curso/subcategorías) y para
 * subcategorías (paquetes) sin duplicar el armado del mensaje.
 */
export function describeDeleteBlock(counts) {
  const reasons = (counts || [])
    .filter((c) => c.count > 0)
    .map((c) => `${c.count} ${c.count === 1 ? c.singular : c.plural}`);
  if (!reasons.length) return null;
  return `No se puede eliminar: está en uso por ${reasons.join(', ')}. Podés desactivarla para impedir nuevas altas.`;
}

/** Conteos de uso de una CATEGORÍA (fila de mapAdminCategory) en el formato genérico de describeDeleteBlock. */
export function categoryUsageCounts(category) {
  return [
    { count: category?.serviceCount || 0, singular: 'servicio', plural: 'servicios' },
    { count: category?.providerCount || 0, singular: 'proveedor', plural: 'proveedores' },
    { count: category?.subcategoryCount || 0, singular: 'subcategoría', plural: 'subcategorías' },
  ];
}

/** Conteo de uso de una SUBCATEGORÍA (fila de mapAdminSubcategory). */
export function subcategoryUsageCounts(subcategory) {
  return [
    { count: subcategory?.packagesCount || 0, singular: 'paquete', plural: 'paquetes' },
  ];
}

/**
 * Validación del formulario de categoría antes de enviar. `isCreate`
 * decide si el slug es obligatorio (nunca se valida/envía en edición — el
 * backend lo ignora de todas formas, ver categories.service.js#update).
 * Devuelve `{ valid: true }` o `{ valid: false, field, message }` — un
 * único error a la vez, para mostrar cerca del campo que falló.
 */
export function validateCategoryForm(form, { isCreate } = {}) {
  const { slug, name, sortOrder } = form;
  if (!name || !name.trim()) return { valid: false, field: 'name', message: 'El nombre es obligatorio.' };
  if (isCreate) {
    if (!slug || !slug.trim()) return { valid: false, field: 'slug', message: 'El slug es obligatorio.' };
    if (!isSlugFormatValid(slug)) {
      return { valid: false, field: 'slug', message: 'El slug debe ser minúsculas, números y guiones (ej: comida-mexicana).' };
    }
  }
  if (sortOrder !== undefined && sortOrder !== '' && (!Number.isInteger(Number(sortOrder)) || Number(sortOrder) < 0)) {
    return { valid: false, field: 'sortOrder', message: 'El orden debe ser un número entero mayor o igual a 0.' };
  }
  const pricing = validatePricingConfigForm(form);
  if (!pricing.valid) return pricing;
  return { valid: true };
}

/**
 * Validación del formulario de subcategoría. `categoryId` siempre
 * obligatorio (no existe una subcategoría "huérfana"); `slug` solo se
 * valida/exige al crear, mismo criterio que categorías.
 */
export function validateSubcategoryForm(form, { isCreate } = {}) {
  const { categoryId, slug, name, sortOrder } = form;
  if (!categoryId) return { valid: false, field: 'categoryId', message: 'Falta la categoría.' };
  if (!name || !name.trim()) return { valid: false, field: 'name', message: 'El nombre es obligatorio.' };
  if (isCreate) {
    if (!slug || !slug.trim()) return { valid: false, field: 'slug', message: 'El slug es obligatorio.' };
    if (!isSlugFormatValid(slug)) {
      return { valid: false, field: 'slug', message: 'El slug debe ser minúsculas, números y guiones (ej: finger-food).' };
    }
  }
  if (sortOrder !== undefined && sortOrder !== '' && (!Number.isInteger(Number(sortOrder)) || Number(sortOrder) < 0)) {
    return { valid: false, field: 'sortOrder', message: 'El orden debe ser un número entero mayor o igual a 0.' };
  }
  const pricing = validatePricingConfigForm(form);
  if (!pricing.valid) return pricing;
  return { valid: true };
}

/**
 * Validación de la config de pricing de una categoría/subcategoría (no de un
 * paquete individual) — mismo criterio que pricing-schema.js#validatePricingConfigShape
 * del backend: `pricingAllowedModels`/`pricingDefaultModel` se exigen SIEMPRE
 * como par (ambos presentes o ambos null/undefined — NULL es válido para una
 * subcategoría que hereda, nunca para una categoría desde el formulario, que
 * siempre trae al menos el default `['per_person']`).
 */
export function validatePricingConfigForm({ pricingAllowedModels, pricingDefaultModel, guestUsageMode, capacityBasis } = {}) {
  const allowedSet = pricingAllowedModels !== undefined && pricingAllowedModels !== null;
  const defaultSet = pricingDefaultModel !== undefined && pricingDefaultModel !== null;
  if (allowedSet !== defaultSet) {
    return { valid: false, field: 'pricingDefaultModel', message: 'Elegí al menos un modelo de precio permitido y un modelo predeterminado.' };
  }
  if (allowedSet) {
    if (!Array.isArray(pricingAllowedModels) || !pricingAllowedModels.length) {
      return { valid: false, field: 'pricingAllowedModels', message: 'Elegí al menos un modelo de precio permitido.' };
    }
    if (!pricingAllowedModels.every((m) => PRICING_MODELS.includes(m))) {
      return { valid: false, field: 'pricingAllowedModels', message: 'Hay un modelo de precio inválido en la selección.' };
    }
    if (!pricingAllowedModels.includes(pricingDefaultModel)) {
      return { valid: false, field: 'pricingDefaultModel', message: 'El modelo predeterminado debe estar entre los permitidos.' };
    }
  }
  if (guestUsageMode != null && !GUEST_USAGE_MODES.includes(guestUsageMode)) {
    return { valid: false, field: 'guestUsageMode', message: 'El uso de la cantidad de invitados no es válido.' };
  }
  if (capacityBasis != null && !CAPACITY_BASIS_VALUES.includes(capacityBasis)) {
    return { valid: false, field: 'capacityBasis', message: 'La base de capacidad no es válida.' };
  }
  return { valid: true };
}

/**
 * Vista previa en texto plano de "qué va a ver el proveedor" — mostrada en
 * Admin > Configuración del catálogo antes de guardar, para que un admin no
 * técnico entienda el efecto de la config sin tener que abrir el formulario
 * de alta de servicio de un proveedor real.
 */
export function describePricingSchema(config) {
  if (!config || !Array.isArray(config.pricingAllowedModels) || !config.pricingAllowedModels.length) return [];
  const lines = [];
  const modelLabels = config.pricingAllowedModels.map(getPricingModelLabel);
  lines.push(modelLabels.length === 1
    ? `El proveedor va a cargar el precio como "${modelLabels[0]}".`
    : `El proveedor va a poder elegir entre: ${modelLabels.join(', ')} (por defecto "${getPricingModelLabel(config.pricingDefaultModel)}").`);
  if (config.pricingAllowedModels.includes('per_unit')) {
    lines.push(`Unidad: "${config.unitLabelSingular || 'unidad'}" / "${config.unitLabelPlural || 'unidades'}".`);
  }
  if (config.supportsDietaryRestrictions) {
    lines.push('Admite menú celíaco como opción dentro de "Por persona".');
  }
  const usageLabel = GUEST_USAGE_MODE_LABELS[config.guestUsageMode];
  if (usageLabel) lines.push(`Cantidad de invitados: ${usageLabel.toLowerCase()}.`);
  return lines;
}

/**
 * Advertencia (no bloqueante) cuando se edita la config de pricing de una
 * categoría que ya tiene servicios activos — mismo criterio que
 * needsActiveOptionsWarning: informa el impacto, nunca impide guardar
 * (los paquetes ya existentes siguen funcionando con su modelo ya
 * persistido, ver services.service.js — solo los NUEVOS paquetes/ediciones
 * de modelo quedan sujetos a la config nueva).
 */
export function describeConfigChangeWarning(original, edited, serviceCount) {
  if (!serviceCount) return null;
  const keys = ['pricingAllowedModels', 'pricingDefaultModel', 'guestUsageMode', 'capacityBasis'];
  const changed = keys.some((k) => JSON.stringify(original?.[k]) !== JSON.stringify(edited?.[k]));
  if (!changed) return null;
  const plural = serviceCount === 1 ? '' : 's';
  return `Esta categoría tiene ${serviceCount} servicio${plural} activo${plural}. Cambiar el modelo de precio no altera reservas históricas ni paquetes ya creados, pero los paquetes nuevos (o ediciones de modelo) deberán ajustarse a la nueva configuración.`;
}

/**
 * Advertencia mostrada en Admin cuando una categoría tiene el campo de
 * paquete habilitado pero ninguna subcategoría activa que ofrecer — el
 * proveedor nunca vería el campo en ese estado (mismo criterio que
 * deriveSubcategoryFieldState en packageSubcategoryField.js), así que es
 * una configuración a medio terminar, no un error.
 */
export function needsActiveOptionsWarning(category) {
  return !!category?.packageOptionsEnabled && (category?.subcategoryActiveCount || 0) === 0;
}
