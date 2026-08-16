// ─── MODELO DE PRECIO DE UN PAQUETE — lógica pura ──────────────────────────
// Sin JSX, sin fetch — mismo criterio que packageSubcategoryField.js (ver su
// cabecera para el porqué de este split). Reemplaza el hardcode isSalon/
// isCatering que tenía MenuManager.js: qué campos mostrar/exigir en el
// formulario del proveedor ahora se decide por `pricingModel` (elegido
// dentro de `pricingAllowedModels`, configurado por categoría/subcategoría
// desde Admin > Configuración del catálogo — nunca por slug).
//
// Vocabulario fijo (mismo que src/modules/services/pricing-schema.js en el
// backend) — 6 valores, sin fórmulas ejecutables.
export const PRICING_MODELS = ['per_person', 'per_event', 'per_hour', 'per_unit', 'fixed_package', 'custom_quote'];

export const PRICING_MODEL_LABELS = {
  per_person: 'Por persona',
  per_event: 'Por evento',
  per_hour: 'Por hora',
  per_unit: 'Por unidad',
  fixed_package: 'Paquete fijo',
  custom_quote: 'Presupuesto personalizado',
};

export function getPricingModelLabel(model) {
  return PRICING_MODEL_LABELS[model] || model;
}

export const GUEST_USAGE_MODES = ['price', 'capacity', 'recommendation', 'unused'];

export const GUEST_USAGE_MODE_LABELS = {
  price: 'Participa en el precio',
  capacity: 'Valida capacidad',
  recommendation: 'Solo recomendación',
  unused: 'No aplica',
};

export const CAPACITY_BASIS_VALUES = ['total_guests', 'children_only', 'adults_only'];

export const CAPACITY_BASIS_LABELS = {
  total_guests: 'Total de invitados',
  children_only: 'Solo niños',
  adults_only: 'Solo adultos',
};

/**
 * Config EFECTIVA de categoría/subcategoría — mismo criterio de precedencia
 * que el backend (pricing-schema.js#resolveEffectivePricingConfig):
 * `pricingAllowedModels`/`pricingDefaultModel` se leen SIEMPRE como par
 * (si la subcategoría define uno, define ambos); el resto de los campos se
 * heredan independientemente, campo por campo. Se usa en vivo apenas el
 * proveedor elige una subcategoría en el formulario — el backend vuelve a
 * resolver esto de forma autoritativa al guardar, esto es solo para no
 * hacerlo esperar a un round-trip.
 */
export function resolveEffectivePricingConfig(category, subcategory) {
  if (!category) return null;
  const subOverridesModel = !!(subcategory && subcategory.pricingAllowedModels != null);
  const pick = (field) => (subcategory && subcategory[field] != null ? subcategory[field] : category[field]);

  return {
    pricingAllowedModels: subOverridesModel ? subcategory.pricingAllowedModels : category.pricingAllowedModels,
    pricingDefaultModel: subOverridesModel ? subcategory.pricingDefaultModel : category.pricingDefaultModel,
    guestUsageMode: pick('guestUsageMode'),
    capacityBasis: pick('capacityBasis'),
    unitLabelSingular: pick('unitLabelSingular'),
    unitLabelPlural: pick('unitLabelPlural'),
    supportsDietaryRestrictions: pick('supportsDietaryRestrictions'),
  };
}

/**
 * Qué campos mostrar/exigir en el formulario para un modelo dado. Espejo
 * exacto de pricing-schema.js#validatePricingModelFields del lado de la
 * FORMA (no de la validación en sí, ver validatePackagePricingForm más
 * abajo) — el switch vive acá y solo acá, ningún otro archivo vuelve a
 * decidir "¿qué campos tiene este modelo?".
 */
export function derivePricingFieldsForModel(pricingModel, supportsDietaryRestrictions) {
  const base = {
    showAdultPrice: false, showChildPrice: false, showCeliac: false,
    showDuration: false, showExtraHours: false,
    showUnitPrice: false, showUnitFields: false,
  };
  switch (pricingModel) {
    case 'per_person':
      return { ...base, showAdultPrice: true, showChildPrice: true, showCeliac: !!supportsDietaryRestrictions };
    case 'per_hour':
      return { ...base, showAdultPrice: true, showDuration: true, showExtraHours: true };
    case 'per_event':
    case 'fixed_package':
      return { ...base, showAdultPrice: true };
    case 'per_unit':
      return { ...base, showUnitPrice: true, showUnitFields: true };
    case 'custom_quote':
    default:
      return base;
  }
}

const toNumber = (v) => (v === '' || v == null ? NaN : Number(v));

/**
 * Valida el formulario ANTES de guardar (el backend vuelve a validar todo,
 * autoritativo) — mismas reglas que pricing-schema.js#validatePricingModelFields,
 * traducidas a nombres de campo del formulario para poder marcar el campo
 * exacto con error.
 */
export function validatePackagePricingForm(pricingModel, form = {}, config = {}) {
  const fields = derivePricingFieldsForModel(pricingModel, config.supportsDietaryRestrictions);

  if (fields.showAdultPrice && !(toNumber(form.adultPrice) > 0)) {
    return { valid: false, field: 'adultPrice', message: 'El precio es obligatorio y debe ser mayor que cero' };
  }
  if (pricingModel === 'per_hour' && !(toNumber(form.durationHours) > 0)) {
    return { valid: false, field: 'durationHours', message: 'La duración es obligatoria y debe ser mayor que cero' };
  }
  if (fields.showUnitPrice && !(toNumber(form.unitPrice) > 0)) {
    return { valid: false, field: 'unitPrice', message: 'El precio por unidad es obligatorio y debe ser mayor que cero' };
  }
  if (fields.showUnitFields && form.minUnits !== '' && form.minUnits != null && form.maxUnits !== '' && form.maxUnits != null) {
    if (toNumber(form.minUnits) > toNumber(form.maxUnits)) {
      return { valid: false, field: 'maxUnits', message: 'La cantidad máxima no puede ser menor que la mínima' };
    }
  }
  if (form.allowsExtraHours && !fields.showExtraHours) {
    return { valid: false, field: 'allowsExtraHours', message: 'Las horas extra solo aplican al modelo "por hora"' };
  }
  if (form.allowsExtraHours) {
    if (!(toNumber(form.extraHourPrice) >= 0)) {
      return { valid: false, field: 'extraHourPrice', message: 'El precio por hora extra es obligatorio si se permiten horas extra' };
    }
    const maxExtra = toNumber(form.maxExtraHours);
    if (!(Number.isInteger(maxExtra) && maxExtra > 0)) {
      return { valid: false, field: 'maxExtraHours', message: 'El máximo de horas extra debe ser mayor que cero si se permiten horas extra' };
    }
  }
  if (form.offersCeliacMenu) {
    if (!fields.showCeliac) {
      return { valid: false, field: 'offersCeliacMenu', message: 'El menú celíaco no está disponible para este modelo o categoría' };
    }
    if (!(toNumber(form.celiacUnitPrice) >= 0)) {
      return { valid: false, field: 'celiacUnitPrice', message: 'El precio del menú celíaco es obligatorio si se ofrece la opción' };
    }
  }
  return { valid: true };
}

/**
 * Modelo de precio EFECTIVO a preseleccionar en el formulario: el que ya
 * tenía el paquete (edición) o el default de la config resuelta (alta).
 * Nunca asume 'per_person' si la categoría no lo permite.
 */
export function resolveInitialPricingModel(existingPricingModel, effectiveConfig) {
  if (existingPricingModel) return existingPricingModel;
  return effectiveConfig?.pricingDefaultModel || 'per_person';
}

/**
 * ¿Corresponde mostrar los campos de capacidad (mín./máx. invitados) en el
 * formulario del paquete? Mismo criterio EXACTO que pricing-schema.js#shouldValidateGuestCapacity
 * en el backend (mismo par de condiciones) — un paquete per_person siempre
 * los muestra (caso Barra: puede variar por paquete, no por categoría),
 * cualquier otro modelo los muestra solo si la categoría/subcategoría
 * efectiva usa la cantidad de invitados para precio o capacidad.
 */
export function shouldShowGuestCapacityFields(pricingModel, guestUsageMode) {
  return guestUsageMode === 'price' || guestUsageMode === 'capacity' || pricingModel === 'per_person';
}

/** Etiqueta de unidad resuelta — paquete (override) > subcategoría/categoría > fallback genérico. */
export function resolveUnitLabel(packageUnitLabel, effectiveConfig, plural = false) {
  const field = plural ? 'unitLabelPlural' : 'unitLabelSingular';
  const packageValue = plural ? packageUnitLabel?.plural : packageUnitLabel?.singular;
  return packageValue || effectiveConfig?.[field] || (plural ? 'unidades' : 'unidad');
}
