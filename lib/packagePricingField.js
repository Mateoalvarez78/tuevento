// ─── MODELO DE PRECIO DE UN PAQUETE — lógica pura ──────────────────────────
// Sin JSX, sin fetch — mismo criterio que packageSubcategoryField.js (ver su
// cabecera para el porqué de este split). Reemplaza el hardcode isSalon/
// isCatering que tenía MenuManager.js: qué campos mostrar/exigir en el
// formulario del proveedor ahora se decide por `pricingModel` (elegido
// dentro de `pricingAllowedModels`, configurado por categoría/subcategoría
// desde Admin > Configuración del catálogo — nunca por slug).
//
// Vocabulario DEFINITIVO — espejo exacto de
// src/modules/services/pricing-schema.js en el backend. 5 valores, sin
// fórmulas ejecutables:
//
//   per_person    → precio por persona × invitados
//   fixed_package → precio fijo; puede declarar duración incluida
//   per_unit      → unit_price × units_count
//   per_hour      → hourly_price × billable_hours (tarifa REAL por hora)
//   custom_quote  → visible, nunca checkout directo, nunca $0
//
// `per_event` NO existe como pricing_model: se fusionó en `fixed_package`
// (calculaban exactamente lo mismo). El único lugar donde ese literal sigue
// siendo válido es el enum legacy `services.price_type`, que es otra columna
// y otro concepto — nunca se manda como `pricing_model`.
export const PRICING_MODELS = ['per_person', 'fixed_package', 'per_unit', 'per_hour', 'custom_quote'];

export const PRICING_MODEL_LABELS = {
  per_person: 'Por persona',
  // "Por evento" es el texto que los proveedores ya conocen para un precio
  // cerrado: se conserva como ETIQUETA de `fixed_package`, nunca como un
  // valor propio que viaje al backend.
  fixed_package: 'Por evento (precio fijo)',
  per_unit: 'Por unidad',
  per_hour: 'Por hora',
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
    showHourlyPrice: false, showDefaultBillableHours: false,
  };
  switch (pricingModel) {
    case 'per_person':
      return { ...base, showAdultPrice: true, showChildPrice: true, showCeliac: !!supportsDietaryRestrictions };
    case 'fixed_package':
      // Precio cerrado. La DURACIÓN INCLUIDA (`duration_hours`) vive acá y
      // solo acá — es un atributo OPCIONAL de un paquete fijo (salón con
      // turno, DJ con bloque de horas), junto con sus horas extra. No
      // convierte al paquete en otro modelo.
      return { ...base, showAdultPrice: true, showDuration: true, showExtraHours: true };
    case 'per_unit':
      return { ...base, showUnitPrice: true, showUnitFields: true };
    case 'per_hour':
      // Tarifa REAL por hora: la cantidad de horas la elige el cliente al
      // reservar (`billable_hours`), no se declara en el paquete. Por eso
      // acá NO hay duración incluida ni horas extra — `default_billable_hours`
      // es solo una duración de referencia para mostrar un precio estimado.
      return { ...base, showHourlyPrice: true, showDefaultBillableHours: true };
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
  if (fields.showUnitPrice && !(toNumber(form.unitPrice) > 0)) {
    return { valid: false, field: 'unitPrice', message: 'El precio por unidad es obligatorio y debe ser mayor que cero' };
  }
  if (fields.showHourlyPrice && !(toNumber(form.hourlyPrice) > 0)) {
    return { valid: false, field: 'hourlyPrice', message: 'El precio por hora es obligatorio y debe ser mayor que cero' };
  }
  // Duración predeterminada: opcional, pero si se completa debe ser > 0 y
  // solo aplica a per_hour (nunca es la cantidad real de horas contratadas).
  if (form.defaultBillableHours !== '' && form.defaultBillableHours != null) {
    if (!fields.showDefaultBillableHours) {
      return { valid: false, field: 'defaultBillableHours', message: 'La duración predeterminada solo aplica al modelo "por hora"' };
    }
    if (!(toNumber(form.defaultBillableHours) > 0)) {
      return { valid: false, field: 'defaultBillableHours', message: 'La duración predeterminada debe ser mayor que cero' };
    }
  }
  // Duración INCLUIDA: opcional, exclusiva de fixed_package.
  if (form.durationHours !== '' && form.durationHours != null) {
    if (!fields.showDuration) {
      return { valid: false, field: 'durationHours', message: 'Las horas incluidas solo aplican a un paquete de precio fijo' };
    }
    if (!(toNumber(form.durationHours) > 0)) {
      return { valid: false, field: 'durationHours', message: 'Las horas incluidas deben ser mayores que cero' };
    }
  }
  if (fields.showUnitFields && form.minUnits !== '' && form.minUnits != null && form.maxUnits !== '' && form.maxUnits != null) {
    if (toNumber(form.minUnits) > toNumber(form.maxUnits)) {
      return { valid: false, field: 'maxUnits', message: 'La cantidad máxima no puede ser menor que la mínima' };
    }
  }
  if (form.allowsExtraHours && !fields.showExtraHours) {
    return { valid: false, field: 'allowsExtraHours', message: 'Las horas extra solo aplican a un paquete de precio fijo con horas incluidas' };
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

/**
 * ¿Este modelo se puede contratar por el flujo normal de checkout?
 *
 * `capabilities` es la respuesta de GET /services/pricing-capabilities
 * (ver services/pricingCapabilitiesService.js): la ÚNICA fuente de verdad
 * sobre qué está habilitado. La web nunca mantiene su propia copia de los
 * flags — si no pudo leer las capacidades, se asume lo más restrictivo para
 * los modelos que dependen de un flag, y nunca se bloquea a los que no
 * dependen de ninguno (per_person/fixed_package, que siempre funcionaron).
 *
 * `custom_quote` nunca es contratable directo: no es una limitación
 * temporal, es la definición del modelo (se pide presupuesto, no se
 * reserva). Por eso no depende de ninguna capability.
 */
export function isModelCheckoutEnabled(pricingModel, capabilities) {
  if (pricingModel === 'custom_quote') return false;
  if (pricingModel !== 'per_unit' && pricingModel !== 'per_hour') return true;

  const bookable = capabilities?.directBookable?.[pricingModel];
  const supported = capabilities?.supportedByChannel?.[pricingModel];
  // Sin respuesta del backend => no habilitar un modelo que quizá rechace.
  if (bookable == null) return false;
  return !!bookable && supported !== false;
}

/** Etiqueta de unidad resuelta — paquete (override) > subcategoría/categoría > fallback genérico. */
export function resolveUnitLabel(packageUnitLabel, effectiveConfig, plural = false) {
  const field = plural ? 'unitLabelPlural' : 'unitLabelSingular';
  const packageValue = plural ? packageUnitLabel?.plural : packageUnitLabel?.singular;
  return packageValue || effectiveConfig?.[field] || (plural ? 'unidades' : 'unidad');
}

// ─── Ficha de SERVICIO: traducción declarativo → enum legacy ──────────────
//
// `services.price_type` y `service_packages.pricing_model` NO son el mismo
// campo y no deben unificarse:
//
//   services.price_type       enum legacy de 3 valores, CHECK en base:
//                             per_person | per_event | per_hour
//   service_packages.pricing_model  vocabulario declarativo de 5 valores
//
// El servicio es la ficha GRUESA del proveedor (catálogo, filtros, "desde
// $X"). El paquete es la estructura comercial real con la que se cotiza y
// se reserva. Las horas incluidas, la hora extra y el precio unitario viven
// en el PAQUETE y se editan en MenuManager, nunca acá.
//
// Qué significa realmente `price_type`, verificado en el backend:
//   - availability.service.js#calculateQuote, rama legacy SIN paquete:
//       perPerson  = service.price_type === 'per_person'
//       pricingModel = perPerson ? 'per_person' : 'fixed_package'
//     O sea: SOLO `per_person` es semánticamente cargado. `per_event` y
//     `per_hour` son indistinguibles para el motor — los dos colapsan al
//     mismo cálculo de precio cerrado.
//   - serviceService.js#mapService: price_type === 'per_person'
//       ? 'por persona' : 'por evento'  (etiqueta "desde")
//
// De ahí sale el mapping, que NO es arbitrario: marcar como `per_person` un
// servicio que se vende por unidad haría que el motor multiplique
// `price_from` por la cantidad de invitados. Cualquier valor distinto de
// per_person evita ese error de dinero, y entre los dos restantes
// `per_event` es el que produce menos información falsa.
const LEGACY_PRICE_TYPES = ['per_person', 'per_event', 'per_hour'];

export const LEGACY_PRICE_TYPE_LABELS = {
  per_person: 'Por persona',
  per_event: 'Por evento',
  per_hour: 'Por hora',
};

const LEGACY_BY_PRICING_MODEL = {
  per_person: 'per_person',
  per_hour: 'per_hour',
  fixed_package: 'per_event',
  // per_unit y custom_quote NO son representables en el enum viejo. Se
  // mapean a per_event porque es el único valor que no miente sobre el
  // cálculo (precio cerrado, sin multiplicar por cabezas), pero el
  // resolvedor los reporta aparte en `unrepresentableModels` para que la UI
  // lo diga en vez de disfrazarlos.
  per_unit: 'per_event',
  custom_quote: 'per_event',
};

/** Modelos que el enum legacy no puede expresar con fidelidad. */
const NOT_REPRESENTABLE = ['per_unit', 'custom_quote'];

/** Traduce un modelo declarativo al enum legacy. `null` si no se conoce. */
export function toLegacyPriceType(pricingModel) {
  return LEGACY_BY_PRICING_MODEL[pricingModel] || null;
}

/**
 * Resuelve TODO lo que el modal de servicio necesita, a partir de la
 * configuración declarativa de la categoría. Función pura, sin I/O, sin
 * depender del nombre ni del slug visible de la categoría.
 *
 * Devuelve `configAvailable: false` cuando la categoría no trae
 * configuración utilizable — el formulario debe avisarlo, NUNCA caer en
 * silencio a "por persona" (regla UX 12).
 */
export function resolveServicePriceTypeOptions({
  allowedPricingModels,
  defaultPricingModel,
  guestUsageMode,
  capacityBasis,
  currentPriceType,
} = {}) {
  const allowed = Array.isArray(allowedPricingModels) && allowedPricingModels.length
    ? allowedPricingModels
    : null;
  const configAvailable = !!(allowed && defaultPricingModel && guestUsageMode);

  if (!configAvailable) {
    // Sin configuración no se inventa nada: se conserva lo que ya tenía el
    // servicio (si es un valor legacy válido) y se marca el estado para que
    // la UI lo muestre y bloquee el guardado.
    const conservado = LEGACY_PRICE_TYPES.includes(currentPriceType) ? currentPriceType : null;
    return {
      configAvailable: false,
      options: [],
      priceType: conservado,
      defaultPriceType: null,
      unrepresentableModels: [],
      guestUsageMode: null,
      capacityBasis: null,
      showGuestFields: false,
      showDurationHours: false,
      priceLabel: 'Precio base',
      priceHelp: '',
      guestHelp: '',
    };
  }

  // Traducción + deduplicación, en el orden estable del enum legacy (nunca
  // el orden en que la categoría listó sus modelos).
  const traducidos = new Set(allowed.map(toLegacyPriceType).filter(Boolean));
  const options = LEGACY_PRICE_TYPES
    .filter((t) => traducidos.has(t))
    .map((id) => ({ id, label: LEGACY_PRICE_TYPE_LABELS[id] }));

  const defaultTraducido = toLegacyPriceType(defaultPricingModel);
  const defaultPriceType = options.some((o) => o.id === defaultTraducido)
    ? defaultTraducido
    : (options[0] ? options[0].id : null);

  // Al EDITAR se conserva el valor guardado solo si sigue siendo ofrecido.
  const priceType = options.some((o) => o.id === currentPriceType)
    ? currentPriceType
    : defaultPriceType;

  const unrepresentableModels = allowed.filter((m) => NOT_REPRESENTABLE.includes(m));

  // Invitados: lo decide guest_usage_mode, jamás el slug.
  const showGuestFields = guestUsageMode === 'price' || guestUsageMode === 'capacity';
  const guestHelp = guestUsageMode === 'price'
    ? 'La cantidad de invitados se utiliza para calcular el precio.'
    : guestUsageMode === 'capacity'
      ? (capacityBasis === 'children_only'
        ? 'La capacidad corresponde a la cantidad de niños.'
        : 'La cantidad de invitados limita la capacidad, pero no multiplica el precio.')
      : guestUsageMode === 'recommendation'
        ? 'Los invitados no afectan el precio. La recomendación de tamaño se define en cada paquete.'
        : '';

  const priceLabel = priceType === 'per_person' ? 'Precio por persona *'
    : priceType === 'per_hour' ? 'Precio por hora *'
      : 'Precio por evento *';

  const base = priceType === 'per_person'
    ? 'Se multiplica por la cantidad de invitados.'
    : priceType === 'per_hour'
      ? 'Se multiplica por las horas contratadas.'
      : 'Precio de referencia del servicio, sin multiplicadores.';
  const priceHelp = unrepresentableModels.length
    ? `${base} Esta categoría también admite ${unrepresentableModels.map(getPricingModelLabel).join(' y ').toLowerCase()}: ese detalle se configura en los paquetes.`
    : base;

  return {
    configAvailable: true,
    options,
    priceType,
    defaultPriceType,
    unrepresentableModels,
    guestUsageMode,
    capacityBasis: capacityBasis || null,
    showGuestFields,
    // En per_hour la duración es lo que se contrata, no un dato fijo de la
    // ficha del servicio.
    showDurationHours: priceType !== 'per_hour',
    priceLabel,
    priceHelp,
    guestHelp,
  };
}

/**
 * Campos del formulario de servicio que deben quedar FUERA del payload por
 * no aplicar a la resolución vigente. Devuelve solo las claves a excluir —
 * el estado no se toca, para no perder datos de un servicio existente
 * mientras se está editando.
 */
export function omittedServiceFields(resolution) {
  const omitidos = [];
  if (!resolution || !resolution.configAvailable) return omitidos;
  if (!resolution.showGuestFields) omitidos.push('min_guests', 'max_guests');
  if (!resolution.showDurationHours) omitidos.push('duration_hours');
  return omitidos;
}
