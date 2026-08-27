import { describe, test, expect } from 'vitest';
import {
  PRICING_MODELS, getPricingModelLabel, resolveEffectivePricingConfig,
  derivePricingFieldsForModel, validatePackagePricingForm, resolveInitialPricingModel, resolveUnitLabel,
  shouldShowGuestCapacityFields, PRICING_MODEL_LABELS, isModelCheckoutEnabled,
} from '../packagePricingField';

describe('shouldShowGuestCapacityFields', () => {
  test('guestUsageMode price/capacity: siempre se muestran', () => {
    expect(shouldShowGuestCapacityFields('fixed_package', 'price')).toBe(true);
    expect(shouldShowGuestCapacityFields('per_unit', 'capacity')).toBe(true);
  });
  test('paquete per_person: siempre se muestran, aunque la categoría sea recommendation/unused (caso Barra)', () => {
    expect(shouldShowGuestCapacityFields('per_person', 'recommendation')).toBe(true);
    expect(shouldShowGuestCapacityFields('per_person', 'unused')).toBe(true);
  });
  test('recommendation/unused sin per_person: nunca se muestran', () => {
    expect(shouldShowGuestCapacityFields('fixed_package', 'recommendation')).toBe(false);
    expect(shouldShowGuestCapacityFields('per_hour', 'unused')).toBe(false);
  });
});

describe('getPricingModelLabel', () => {
  test('devuelve el label en español para los 5 modelos definitivos', () => {
    expect(getPricingModelLabel('per_person')).toBe('Por persona');
    // "Por evento" sobrevive como ETIQUETA de fixed_package, nunca como valor.
    expect(getPricingModelLabel('fixed_package')).toBe('Por evento (precio fijo)');
    expect(getPricingModelLabel('per_hour')).toBe('Por hora');
    expect(getPricingModelLabel('per_unit')).toBe('Por unidad');
    expect(getPricingModelLabel('custom_quote')).toBe('Presupuesto personalizado');
  });

  test('modelo desconocido: devuelve el valor tal cual, nunca revienta', () => {
    expect(getPricingModelLabel('algo_raro')).toBe('algo_raro');
  });
});

describe('resolveEffectivePricingConfig — precedencia subcategoría > categoría', () => {
  const category = {
    pricingAllowedModels: ['per_person', 'fixed_package'], pricingDefaultModel: 'per_person',
    guestUsageMode: 'price', capacityBasis: 'total_guests',
    unitLabelSingular: '', unitLabelPlural: '', supportsDietaryRestrictions: true,
  };

  test('sin subcategoría: usa la categoría tal cual', () => {
    expect(resolveEffectivePricingConfig(category, null)).toEqual({
      pricingAllowedModels: ['per_person', 'fixed_package'], pricingDefaultModel: 'per_person',
      guestUsageMode: 'price', capacityBasis: 'total_guests',
      unitLabelSingular: '', unitLabelPlural: '', supportsDietaryRestrictions: true,
    });
  });

  test('categoría null: devuelve null', () => {
    expect(resolveEffectivePricingConfig(null, null)).toBeNull();
  });

  test('subcategoría con override de modelo (caso Cupcakes): sobrescribe allowed+default juntos', () => {
    const sub = { pricingAllowedModels: ['per_unit'], pricingDefaultModel: 'per_unit', unitLabelSingular: 'cupcake', unitLabelPlural: 'cupcakes' };
    const effective = resolveEffectivePricingConfig(category, sub);
    expect(effective.pricingAllowedModels).toEqual(['per_unit']);
    expect(effective.pricingDefaultModel).toBe('per_unit');
    expect(effective.unitLabelSingular).toBe('cupcake');
    expect(effective.guestUsageMode).toBe('price'); // heredado, no overrideado
  });

  test('subcategoría con override SOLO de etiqueta (caso Tortas): nunca toca el modelo', () => {
    const sub = { unitLabelSingular: 'torta', unitLabelPlural: 'tortas' };
    const effective = resolveEffectivePricingConfig(category, sub);
    expect(effective.unitLabelSingular).toBe('torta');
    expect(effective.pricingAllowedModels).toBe(category.pricingAllowedModels);
  });
});

describe('derivePricingFieldsForModel', () => {
  test('per_person con categoría que admite dietary: muestra adulto/niño/celíaco', () => {
    expect(derivePricingFieldsForModel('per_person', true)).toMatchObject({
      showAdultPrice: true, showChildPrice: true, showCeliac: true, showDuration: false, showUnitPrice: false,
    });
  });

  test('per_person con categoría que NO admite dietary: nunca muestra celíaco', () => {
    expect(derivePricingFieldsForModel('per_person', false).showCeliac).toBe(false);
  });

  test('per_hour: tarifa por hora + duración sugerida, NUNCA duración incluida ni horas extra', () => {
    expect(derivePricingFieldsForModel('per_hour')).toMatchObject({
      showHourlyPrice: true, showDefaultBillableHours: true,
      showDuration: false, showExtraHours: false,
      showAdultPrice: false, showUnitPrice: false, showCeliac: false,
    });
  });

  test('per_hour NUNCA reutiliza duración incluida ni unidades como horas contratadas', () => {
    const f = derivePricingFieldsForModel('per_hour');
    expect(f.showDuration).toBe(false);   // duration_hours es de fixed_package
    expect(f.showUnitFields).toBe(false); // min/max_units no son horas
    expect(f.showUnitPrice).toBe(false);
  });

  test('fixed_package: precio flat + duración INCLUIDA opcional + horas extra', () => {
    expect(derivePricingFieldsForModel('fixed_package')).toMatchObject({
      showAdultPrice: true, showDuration: true, showExtraHours: true,
      showUnitPrice: false, showCeliac: false, showHourlyPrice: false,
    });
  });

  test('per_unit: precio por unidad + campos de unidad, nunca adulto/duración', () => {
    expect(derivePricingFieldsForModel('per_unit')).toMatchObject({
      showUnitPrice: true, showUnitFields: true, showAdultPrice: false, showDuration: false,
    });
  });

  test('custom_quote: ningún campo de precio', () => {
    expect(derivePricingFieldsForModel('custom_quote')).toEqual({
      showAdultPrice: false, showChildPrice: false, showCeliac: false,
      showDuration: false, showExtraHours: false, showUnitPrice: false, showUnitFields: false,
      showHourlyPrice: false, showDefaultBillableHours: false,
    });
  });
});

describe('validatePackagePricingForm', () => {
  test('per_person sin adultPrice: inválido, marca el campo', () => {
    expect(validatePackagePricingForm('per_person', { adultPrice: '' }, {})).toMatchObject({ valid: false, field: 'adultPrice' });
  });

  test('per_person con adultPrice válido: ok', () => {
    expect(validatePackagePricingForm('per_person', { adultPrice: '300' }, {})).toEqual({ valid: true });
  });

  test('per_hour sin tarifa por hora: inválido', () => {
    expect(validatePackagePricingForm('per_hour', { hourlyPrice: '' }, {}))
      .toMatchObject({ valid: false, field: 'hourlyPrice' });
  });

  test('per_hour con tarifa: ok (la cantidad de horas la elige el cliente, no el paquete)', () => {
    expect(validatePackagePricingForm('per_hour', { hourlyPrice: '4000' }, {})).toEqual({ valid: true });
  });

  test('per_unit sin unitPrice: inválido', () => {
    expect(validatePackagePricingForm('per_unit', { unitPrice: '' }, {})).toMatchObject({ valid: false, field: 'unitPrice' });
  });

  test('per_unit con minUnits > maxUnits: inválido', () => {
    expect(validatePackagePricingForm('per_unit', { unitPrice: '8000', minUnits: '5', maxUnits: '2' }, {}))
      .toMatchObject({ valid: false, field: 'maxUnits' });
  });

  test('per_unit con min/max coherentes: ok', () => {
    expect(validatePackagePricingForm('per_unit', { unitPrice: '8000', minUnits: '1', maxUnits: '5' }, {})).toEqual({ valid: true });
  });

  test('custom_quote sin ningún campo: ok', () => {
    expect(validatePackagePricingForm('custom_quote', {}, {})).toEqual({ valid: true });
  });

  test('allowsExtraHours en un modelo que no es fixed_package: inválido', () => {
    expect(validatePackagePricingForm('per_unit', { unitPrice: '8000', allowsExtraHours: true, extraHourPrice: '1000', maxExtraHours: '2' }, {}))
      .toMatchObject({ valid: false, field: 'allowsExtraHours' });
  });

  test('allowsExtraHours en fixed_package sin extraHourPrice: inválido', () => {
    expect(validatePackagePricingForm('fixed_package', { adultPrice: '5000', durationHours: '4', allowsExtraHours: true, extraHourPrice: '', maxExtraHours: '2' }, {}))
      .toMatchObject({ valid: false, field: 'extraHourPrice' });
  });

  test('offersCeliacMenu con categoría que no admite dietary: inválido', () => {
    expect(validatePackagePricingForm('per_person', { adultPrice: '300', offersCeliacMenu: true, celiacUnitPrice: '250' }, { supportsDietaryRestrictions: false }))
      .toMatchObject({ valid: false, field: 'offersCeliacMenu' });
  });

  test('offersCeliacMenu con categoría que admite dietary y precio válido: ok', () => {
    expect(validatePackagePricingForm('per_person', { adultPrice: '300', offersCeliacMenu: true, celiacUnitPrice: '250' }, { supportsDietaryRestrictions: true }))
      .toEqual({ valid: true });
  });
});

describe('resolveInitialPricingModel', () => {
  test('paquete existente: usa el modelo ya persistido, nunca el default de la categoría', () => {
    expect(resolveInitialPricingModel('per_unit', { pricingDefaultModel: 'per_person' })).toBe('per_unit');
  });

  test('paquete nuevo (sin modelo existente): usa el default de la config resuelta', () => {
    expect(resolveInitialPricingModel(null, { pricingDefaultModel: 'fixed_package' })).toBe('fixed_package');
  });

  test('sin config resuelta: fallback final a per_person, nunca revienta', () => {
    expect(resolveInitialPricingModel(null, null)).toBe('per_person');
  });
});

describe('resolveUnitLabel', () => {
  const config = { unitLabelSingular: 'producto', unitLabelPlural: 'productos' };

  test('el paquete tiene su propia etiqueta: gana sobre la de la config', () => {
    expect(resolveUnitLabel({ singular: 'torta', plural: 'tortas' }, config, false)).toBe('torta');
    expect(resolveUnitLabel({ singular: 'torta', plural: 'tortas' }, config, true)).toBe('tortas');
  });

  test('sin etiqueta propia del paquete: usa la de la config resuelta', () => {
    expect(resolveUnitLabel(null, config, false)).toBe('producto');
    expect(resolveUnitLabel(null, config, true)).toBe('productos');
  });

  test('sin ninguna etiqueta configurada: fallback genérico', () => {
    expect(resolveUnitLabel(null, {}, false)).toBe('unidad');
    expect(resolveUnitLabel(null, {}, true)).toBe('unidades');
  });
});

describe('PRICING_MODELS', () => {
  test('vocabulario DEFINITIVO de 5 valores, mismo orden que el backend', () => {
    expect(PRICING_MODELS).toEqual(['per_person', 'fixed_package', 'per_unit', 'per_hour', 'custom_quote']);
  });
});

// ─── Contrato de sincronización con el backend (Fase 1) ────────────────────
// Estos tests existen para que una desincronización futura falle acá y no en
// producción con un 400 del backend.
describe('contrato: vocabulario definitivo, sin per_event', () => {
  test('expone EXACTAMENTE cinco modelos', () => {
    expect(PRICING_MODELS).toHaveLength(5);
  });

  test('per_event NO es un pricing_model válido en ninguna forma', () => {
    expect(PRICING_MODELS).not.toContain('per_event');
    expect(Object.keys(PRICING_MODEL_LABELS)).not.toContain('per_event');
  });

  test('el texto "Por evento" existe, pero pertenece a fixed_package', () => {
    const conEseTexto = Object.entries(PRICING_MODEL_LABELS)
      .filter(([, label]) => /por evento/i.test(label))
      .map(([model]) => model);
    expect(conEseTexto).toEqual(['fixed_package']);
  });

  test('cada modelo del vocabulario tiene etiqueta y forma de campos definidas', () => {
    PRICING_MODELS.forEach((m) => {
      expect(PRICING_MODEL_LABELS[m]).toBeTruthy();
      expect(derivePricingFieldsForModel(m)).toBeTruthy();
    });
  });

  test('la duración incluida pertenece SOLO a fixed_package', () => {
    const conDuracion = PRICING_MODELS.filter((m) => derivePricingFieldsForModel(m).showDuration);
    expect(conDuracion).toEqual(['fixed_package']);
  });

  test('la tarifa por hora pertenece SOLO a per_hour', () => {
    const conTarifa = PRICING_MODELS.filter((m) => derivePricingFieldsForModel(m).showHourlyPrice);
    expect(conTarifa).toEqual(['per_hour']);
  });

  test('los campos de unidad pertenecen SOLO a per_unit', () => {
    const conUnidad = PRICING_MODELS.filter((m) => derivePricingFieldsForModel(m).showUnitFields);
    expect(conUnidad).toEqual(['per_unit']);
  });

  test('custom_quote no declara ningún campo de precio', () => {
    const f = derivePricingFieldsForModel('custom_quote');
    expect(Object.values(f).every((v) => v === false)).toBe(true);
  });

  test('per_hour rechaza duración incluida (es de fixed_package)', () => {
    expect(validatePackagePricingForm('per_hour', { hourlyPrice: '4000', durationHours: '5' }, {}))
      .toMatchObject({ valid: false, field: 'durationHours' });
  });

  test('fixed_package acepta duración incluida y también funciona sin ella', () => {
    expect(validatePackagePricingForm('fixed_package', { adultPrice: '20000' }, {})).toEqual({ valid: true });
    expect(validatePackagePricingForm('fixed_package', { adultPrice: '20000', durationHours: '5' }, {})).toEqual({ valid: true });
  });

  test('la duración sugerida solo aplica a per_hour', () => {
    expect(validatePackagePricingForm('fixed_package', { adultPrice: '20000', defaultBillableHours: '6' }, {}))
      .toMatchObject({ valid: false, field: 'defaultBillableHours' });
    expect(validatePackagePricingForm('per_hour', { hourlyPrice: '4000', defaultBillableHours: '6' }, {}))
      .toEqual({ valid: true });
  });
});

describe('isModelCheckoutEnabled — bloqueo de checkout por flags/canal', () => {
  const habilitado = {
    directBookable: { per_unit: true, per_hour: true },
    supportedByChannel: { per_unit: true, per_hour: false },
  };
  const apagado = {
    directBookable: { per_unit: false, per_hour: false },
    supportedByChannel: { per_unit: true, per_hour: false },
  };

  test('per_person y fixed_package siempre se pueden contratar (compatibilidad legacy)', () => {
    [null, apagado, habilitado].forEach((caps) => {
      expect(isModelCheckoutEnabled('per_person', caps)).toBe(true);
      expect(isModelCheckoutEnabled('fixed_package', caps)).toBe(true);
    });
  });

  test('custom_quote NUNCA es checkout directo, con o sin capacidades', () => {
    [null, apagado, habilitado].forEach((caps) => {
      expect(isModelCheckoutEnabled('custom_quote', caps)).toBe(false);
    });
  });

  test('flags APAGADOS: per_unit y per_hour bloqueados', () => {
    expect(isModelCheckoutEnabled('per_unit', apagado)).toBe(false);
    expect(isModelCheckoutEnabled('per_hour', apagado)).toBe(false);
  });

  test('flag encendido + canal soportado: per_unit habilitado', () => {
    expect(isModelCheckoutEnabled('per_unit', habilitado)).toBe(true);
  });

  test('flag encendido pero canal NO soportado: sigue bloqueado', () => {
    expect(isModelCheckoutEnabled('per_hour', habilitado)).toBe(false);
  });

  test('sin capacidades resueltas: lo restrictivo para los modelos con flag', () => {
    expect(isModelCheckoutEnabled('per_unit', null)).toBe(false);
    expect(isModelCheckoutEnabled('per_hour', null)).toBe(false);
  });
});
