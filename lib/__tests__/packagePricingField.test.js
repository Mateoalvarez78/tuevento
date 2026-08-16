import { describe, test, expect } from 'vitest';
import {
  PRICING_MODELS, getPricingModelLabel, resolveEffectivePricingConfig,
  derivePricingFieldsForModel, validatePackagePricingForm, resolveInitialPricingModel, resolveUnitLabel,
  shouldShowGuestCapacityFields,
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
  test('devuelve el label en español para los 6 modelos', () => {
    expect(getPricingModelLabel('per_person')).toBe('Por persona');
    expect(getPricingModelLabel('per_event')).toBe('Por evento');
    expect(getPricingModelLabel('per_hour')).toBe('Por hora');
    expect(getPricingModelLabel('per_unit')).toBe('Por unidad');
    expect(getPricingModelLabel('fixed_package')).toBe('Paquete fijo');
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

  test('per_hour: adulto (precio base) + duración + horas extra, nunca celíaco/unidad', () => {
    expect(derivePricingFieldsForModel('per_hour')).toMatchObject({
      showAdultPrice: true, showDuration: true, showExtraHours: true, showCeliac: false, showUnitPrice: false,
    });
  });

  test.each(['per_event', 'fixed_package'])('%s: solo precio flat, sin duración/unidad/celíaco', (model) => {
    expect(derivePricingFieldsForModel(model)).toMatchObject({
      showAdultPrice: true, showDuration: false, showUnitPrice: false, showCeliac: false,
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

  test('per_hour sin duración: inválido', () => {
    expect(validatePackagePricingForm('per_hour', { adultPrice: '5000', durationHours: '' }, {}))
      .toMatchObject({ valid: false, field: 'durationHours' });
  });

  test('per_hour con duración+precio: ok', () => {
    expect(validatePackagePricingForm('per_hour', { adultPrice: '5000', durationHours: '4' }, {})).toEqual({ valid: true });
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

  test('allowsExtraHours en un modelo que no es per_hour: inválido', () => {
    expect(validatePackagePricingForm('fixed_package', { adultPrice: '5000', allowsExtraHours: true, extraHourPrice: '1000', maxExtraHours: '2' }, {}))
      .toMatchObject({ valid: false, field: 'allowsExtraHours' });
  });

  test('allowsExtraHours en per_hour sin extraHourPrice: inválido', () => {
    expect(validatePackagePricingForm('per_hour', { adultPrice: '5000', durationHours: '4', allowsExtraHours: true, extraHourPrice: '', maxExtraHours: '2' }, {}))
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
  test('vocabulario fijo de 6 valores, mismo orden que el backend', () => {
    expect(PRICING_MODELS).toEqual(['per_person', 'per_event', 'per_hour', 'per_unit', 'fixed_package', 'custom_quote']);
  });
});
