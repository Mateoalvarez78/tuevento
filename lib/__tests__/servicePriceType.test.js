// resolveServicePriceTypeOptions — traducción de la configuración declarativa
// de la categoría al enum legacy `services.price_type`.
//
// Por qué existe la traducción, y por qué el mapping NO es arbitrario:
//
//   availability.service.js#calculateQuote, rama legacy SIN paquete:
//       perPerson    = service.price_type === 'per_person'
//       pricingModel = perPerson ? 'per_person' : 'fixed_package'
//
// Solo `per_person` es semánticamente cargado. Marcar como per_person un
// servicio que se vende por unidad haría que el motor multiplique `price_from`
// por la cantidad de invitados — un error de dinero real. Por eso todo lo que
// no multiplica por cabezas cae en `per_event`, y `per_unit`/`custom_quote`
// se reportan aparte como NO representables en vez de disfrazarse.

import { describe, test, expect } from 'vitest';
import {
  resolveServicePriceTypeOptions,
  omittedServiceFields,
  toLegacyPriceType,
} from '../packagePricingField';

// Matriz aprobada (fuente de verdad: backfill-category-pricing-config.js).
const CATERING = {
  allowedPricingModels: ['per_person', 'fixed_package'],
  defaultPricingModel: 'per_person',
  guestUsageMode: 'price', capacityBasis: 'total_guests',
};
const DJ = {
  allowedPricingModels: ['fixed_package', 'per_hour'],
  defaultPricingModel: 'fixed_package',
  guestUsageMode: 'recommendation',
};
const SALON = {
  allowedPricingModels: ['fixed_package', 'per_hour'],
  defaultPricingModel: 'fixed_package',
  guestUsageMode: 'capacity', capacityBasis: 'total_guests',
};
const REPOSTERIA = {
  allowedPricingModels: ['per_unit', 'fixed_package', 'custom_quote'],
  defaultPricingModel: 'per_unit',
  guestUsageMode: 'recommendation',
};
const DECORACION = {
  allowedPricingModels: ['fixed_package', 'per_unit', 'custom_quote'],
  defaultPricingModel: 'fixed_package',
  guestUsageMode: 'recommendation',
};
const SEGURIDAD = {
  allowedPricingModels: ['per_hour', 'fixed_package'],
  defaultPricingModel: 'per_hour',
  guestUsageMode: 'capacity', capacityBasis: 'total_guests',
};
const ANIMACION = {
  allowedPricingModels: ['fixed_package', 'per_hour'],
  defaultPricingModel: 'fixed_package',
  guestUsageMode: 'capacity', capacityBasis: 'children_only',
};

describe('mapping declarativo → legacy', () => {
  test('per_person y per_hour se conservan', () => {
    expect(toLegacyPriceType('per_person')).toBe('per_person');
    expect(toLegacyPriceType('per_hour')).toBe('per_hour');
  });

  test('fixed_package → per_event', () => {
    expect(toLegacyPriceType('fixed_package')).toBe('per_event');
  });

  test('per_unit y custom_quote NUNCA se mapean a per_person', () => {
    // Es la aserción que impide el error de dinero: per_person haría que el
    // motor multiplique price_from por la cantidad de invitados.
    expect(toLegacyPriceType('per_unit')).not.toBe('per_person');
    expect(toLegacyPriceType('custom_quote')).not.toBe('per_person');
    expect(toLegacyPriceType('per_unit')).toBe('per_event');
    expect(toLegacyPriceType('custom_quote')).toBe('per_event');
  });

  test('un modelo desconocido no inventa un valor', () => {
    expect(toLegacyPriceType('lo_que_sea')).toBeNull();
  });
});

describe('Catering', () => {
  const r = resolveServicePriceTypeOptions({ ...CATERING, currentPriceType: '' });

  test('ofrece por persona y por evento, con default por persona', () => {
    expect(r.options.map((o) => o.id)).toEqual(['per_person', 'per_event']);
    expect(r.defaultPriceType).toBe('per_person');
    expect(r.priceType).toBe('per_person');
  });

  test('las personas intervienen en el precio y se piden', () => {
    expect(r.showGuestFields).toBe(true);
    expect(r.guestUsageMode).toBe('price');
    expect(r.guestHelp).toContain('calcular el precio');
    expect(r.priceLabel).toBe('Precio por persona *');
  });

  test('no reporta modelos no representables', () => {
    expect(r.unrepresentableModels).toEqual([]);
  });
});

describe('DJ', () => {
  const r = resolveServicePriceTypeOptions({ ...DJ, currentPriceType: 'per_person' });

  test('NUNCA ofrece por persona', () => {
    expect(r.options.map((o) => o.id)).toEqual(['per_event', 'per_hour']);
    expect(r.options.map((o) => o.id)).not.toContain('per_person');
  });

  test('un per_person heredado se reemplaza por el default de la categoría', () => {
    expect(r.priceType).toBe('per_event');
  });

  test('no muestra mínimo/máximo de personas como requisito de precio', () => {
    expect(r.showGuestFields).toBe(false);
    expect(r.guestUsageMode).toBe('recommendation');
  });
});

describe('Salón', () => {
  const r = resolveServicePriceTypeOptions({ ...SALON, currentPriceType: '' });

  test('ofrece por evento y por hora', () => {
    expect(r.options.map((o) => o.id)).toEqual(['per_event', 'per_hour']);
    expect(r.priceType).toBe('per_event');
  });

  test('muestra capacidad y aclara que NO multiplica el precio', () => {
    expect(r.showGuestFields).toBe(true);
    expect(r.guestUsageMode).toBe('capacity');
    expect(r.guestHelp).toContain('no multiplica el precio');
  });
});

describe('Animación (capacidad por niños)', () => {
  test('la ayuda aclara que la capacidad es de niños', () => {
    const r = resolveServicePriceTypeOptions({ ...ANIMACION, currentPriceType: '' });
    expect(r.capacityBasis).toBe('children_only');
    expect(r.guestHelp).toContain('niños');
  });
});

describe('Repostería', () => {
  const r = resolveServicePriceTypeOptions({ ...REPOSTERIA, currentPriceType: '' });

  test('per_unit no aparece jamás como "por persona"', () => {
    expect(r.options.map((o) => o.id)).not.toContain('per_person');
    expect(r.priceType).toBe('per_event');
  });

  test('reporta explícitamente los modelos que el enum legacy no representa', () => {
    expect(r.unrepresentableModels).toEqual(['per_unit', 'custom_quote']);
    expect(r.priceHelp).toContain('se configura en los paquetes');
  });

  test('no exige límites de invitados', () => {
    expect(r.showGuestFields).toBe(false);
  });
});

describe('Decoración', () => {
  const r = resolveServicePriceTypeOptions({ ...DECORACION, currentPriceType: '' });

  test('custom_quote no se convierte en un precio automático silencioso', () => {
    // La ficha del servicio guarda un precio "desde" de referencia; el
    // presupuesto real es responsabilidad del paquete custom_quote, que el
    // backend nunca deja reservar automáticamente.
    expect(r.unrepresentableModels).toContain('custom_quote');
    expect(r.priceHelp).toContain('paquetes');
  });
});

describe('Seguridad', () => {
  const r = resolveServicePriceTypeOptions({ ...SEGURIDAD, currentPriceType: '' });

  test('default por hora', () => {
    expect(r.defaultPriceType).toBe('per_hour');
    expect(r.priceType).toBe('per_hour');
    expect(r.priceLabel).toBe('Precio por hora *');
  });

  test('capacidad total, sin multiplicar por personas', () => {
    expect(r.showGuestFields).toBe(true);
    expect(r.capacityBasis).toBe('total_guests');
    expect(r.guestHelp).toContain('no multiplica el precio');
  });

  test('por hora no pide duración fija de la ficha', () => {
    expect(r.showDurationHours).toBe(false);
  });
});

describe('configuración ausente', () => {
  test('sin allowed/default/guest: configAvailable=false, NUNCA cae a per_person', () => {
    const r = resolveServicePriceTypeOptions({ currentPriceType: '' });
    expect(r.configAvailable).toBe(false);
    expect(r.options).toEqual([]);
    expect(r.priceType).toBeNull();
    expect(r.defaultPriceType).toBeNull();
  });

  test('array vacío cuenta como sin configuración', () => {
    const r = resolveServicePriceTypeOptions({
      allowedPricingModels: [], defaultPricingModel: 'per_person', guestUsageMode: 'price',
    });
    expect(r.configAvailable).toBe(false);
  });

  test('sin configuración se conserva el valor legacy ya guardado del servicio', () => {
    const r = resolveServicePriceTypeOptions({ currentPriceType: 'per_hour' });
    expect(r.priceType).toBe('per_hour');
  });

  test('sin configuración, un valor guardado inválido no se propaga', () => {
    const r = resolveServicePriceTypeOptions({ currentPriceType: 'fixed_package' });
    expect(r.priceType).toBeNull();
  });
});

describe('modelo actual: válido vs incompatible', () => {
  test('un legacy todavía válido se conserva (no se pisa por gusto)', () => {
    const r = resolveServicePriceTypeOptions({ ...DJ, currentPriceType: 'per_hour' });
    expect(r.priceType).toBe('per_hour');
  });

  test('un legacy incompatible se reemplaza por el default', () => {
    const r = resolveServicePriceTypeOptions({ ...CATERING, currentPriceType: 'per_hour' });
    expect(r.priceType).toBe('per_person');
  });

  test('catering → DJ: per_person deja de ofrecerse', () => {
    const r = resolveServicePriceTypeOptions({ ...DJ, currentPriceType: 'per_person' });
    expect(r.priceType).toBe('per_event');
    expect(r.options.map((o) => o.id)).not.toContain('per_person');
  });

  test('DJ → catering: per_event sigue siendo válido y se conserva', () => {
    const r = resolveServicePriceTypeOptions({ ...CATERING, currentPriceType: 'per_event' });
    expect(r.priceType).toBe('per_event');
  });
});

describe('orden y duplicados', () => {
  test('el orden es el estable del enum legacy, no el de la categoría', () => {
    const r = resolveServicePriceTypeOptions({
      allowedPricingModels: ['per_hour', 'per_person'], defaultPricingModel: 'per_person',
      guestUsageMode: 'price',
    });
    expect(r.options.map((o) => o.id)).toEqual(['per_person', 'per_hour']);
  });

  test('varios modelos que traducen al mismo legacy no duplican la opción', () => {
    const r = resolveServicePriceTypeOptions({
      allowedPricingModels: ['fixed_package', 'per_unit', 'custom_quote'],
      defaultPricingModel: 'fixed_package', guestUsageMode: 'recommendation',
    });
    expect(r.options.map((o) => o.id)).toEqual(['per_event']);
  });

  test('si el default declarado no es representable, cae a una opción ofrecida', () => {
    const r = resolveServicePriceTypeOptions({ ...REPOSTERIA, currentPriceType: '' });
    expect(r.options.map((o) => o.id)).toContain(r.defaultPriceType);
  });
});

describe('normalización del payload', () => {
  test('sin campos de invitados, se omiten del payload', () => {
    const r = resolveServicePriceTypeOptions({ ...DJ, currentPriceType: '' });
    expect(omittedServiceFields(r)).toEqual(expect.arrayContaining(['min_guests', 'max_guests']));
  });

  test('por hora omite la duración fija', () => {
    const r = resolveServicePriceTypeOptions({ ...SEGURIDAD, currentPriceType: '' });
    expect(omittedServiceFields(r)).toContain('duration_hours');
  });

  test('catering no omite nada', () => {
    const r = resolveServicePriceTypeOptions({ ...CATERING, currentPriceType: '' });
    expect(omittedServiceFields(r)).toEqual([]);
  });

  test('sin configuración no se omite nada (no se borra información a ciegas)', () => {
    const r = resolveServicePriceTypeOptions({ currentPriceType: 'per_person' });
    expect(omittedServiceFields(r)).toEqual([]);
  });
});

describe('exclusión del payload — nunca borra datos existentes', () => {
  // Regresión de un defecto real: services.service.js#update aplica cualquier
  // valor `!== undefined`, así que mandar `duration_hours: null` para un
  // servicio existente le SOBREESCRIBE la columna con NULL. La exclusión
  // tiene que borrar la clave, no anularla.
  const construirPayload = (form, resolution) => {
    const payload = {
      min_guests: form.min_guests !== '' ? Number(form.min_guests) : null,
      max_guests: form.max_guests !== '' ? Number(form.max_guests) : null,
      duration_hours: form.duration_hours !== '' ? Number(form.duration_hours) : null,
    };
    omittedServiceFields(resolution).forEach((campo) => { delete payload[campo]; });
    return payload;
  };

  test('DJ: las claves de invitados quedan AUSENTES, no en null', () => {
    const r = resolveServicePriceTypeOptions({ ...DJ, currentPriceType: '' });
    const payload = construirPayload({ min_guests: '80', max_guests: '200', duration_hours: '5' }, r);

    expect('min_guests' in payload).toBe(false);
    expect('max_guests' in payload).toBe(false);
    expect(payload.min_guests).toBeUndefined();
    // La duración sí aplica en per_event y se conserva.
    expect(payload.duration_hours).toBe(5);
  });

  test('Seguridad (per_hour): duration_hours queda AUSENTE, no en null', () => {
    const r = resolveServicePriceTypeOptions({ ...SEGURIDAD, currentPriceType: '' });
    const payload = construirPayload({ min_guests: '', max_guests: '500', duration_hours: '8' }, r);

    expect('duration_hours' in payload).toBe(false);
    // La capacidad sí aplica y viaja.
    expect(payload.max_guests).toBe(500);
  });

  test('Catering: no se excluye nada, todo viaja', () => {
    const r = resolveServicePriceTypeOptions({ ...CATERING, currentPriceType: '' });
    const payload = construirPayload({ min_guests: '20', max_guests: '150', duration_hours: '4' }, r);

    expect(payload).toEqual({ min_guests: 20, max_guests: 150, duration_hours: 4 });
  });

  test('ninguna clave excluida viaja jamás con valor null', () => {
    for (const cfg of [DJ, SEGURIDAD, REPOSTERIA, DECORACION]) {
      const r = resolveServicePriceTypeOptions({ ...cfg, currentPriceType: '' });
      const payload = construirPayload({ min_guests: '10', max_guests: '20', duration_hours: '3' }, r);
      omittedServiceFields(r).forEach((campo) => {
        expect(campo in payload).toBe(false);
      });
    }
  });
});
