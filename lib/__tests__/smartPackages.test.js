import { describe, test, expect } from 'vitest';
import {
  validateEventStep, validateCategoriesStep, buildSimulatePayload,
  budgetSharePct, hasNoResultsAtAll, DEFAULT_PREFERENCE, isSmartPackagesEnabled,
} from '../smartPackages';

const validLocation = { lat: -34.9011, lng: -56.1645, formattedAddress: 'Montevideo' };
const futureDate = '2099-01-01';

describe('validateEventStep', () => {
  test('caso válido no devuelve errores', () => {
    const errors = validateEventStep({ budget: '150000', adults: '40', children: '10', eventDate: futureDate, location: validLocation });
    expect(errors).toEqual({});
  });

  test('presupuesto inválido: vacío, cero o negativo', () => {
    expect(validateEventStep({ budget: '', adults: '1', children: '0', eventDate: futureDate, location: validLocation }).budget).toBeTruthy();
    expect(validateEventStep({ budget: '0', adults: '1', children: '0', eventDate: futureDate, location: validLocation }).budget).toBeTruthy();
    expect(validateEventStep({ budget: '-100', adults: '1', children: '0', eventDate: futureDate, location: validLocation }).budget).toBeTruthy();
  });

  test('adultos y niños en cero => error de invitados', () => {
    const errors = validateEventStep({ budget: '10000', adults: '0', children: '0', eventDate: futureDate, location: validLocation });
    expect(errors.guests).toBeTruthy();
  });

  test('adultos o niños negativos => error propio de ese campo', () => {
    expect(validateEventStep({ budget: '10000', adults: '-1', children: '0', eventDate: futureDate, location: validLocation }).adults).toBeTruthy();
    expect(validateEventStep({ budget: '10000', adults: '1', children: '-1', eventDate: futureDate, location: validLocation }).children).toBeTruthy();
  });

  test('fecha pasada => error', () => {
    const errors = validateEventStep({ budget: '10000', adults: '1', children: '0', eventDate: '2000-01-01', location: validLocation });
    expect(errors.eventDate).toBeTruthy();
  });

  test('sin fecha => error', () => {
    const errors = validateEventStep({ budget: '10000', adults: '1', children: '0', eventDate: '', location: validLocation });
    expect(errors.eventDate).toBeTruthy();
  });

  test('sin ubicación válida => error', () => {
    expect(validateEventStep({ budget: '10000', adults: '1', children: '0', eventDate: futureDate, location: null }).location).toBeTruthy();
    expect(validateEventStep({ budget: '10000', adults: '1', children: '0', eventDate: futureDate, location: {} }).location).toBeTruthy();
  });
});

describe('validateCategoriesStep', () => {
  test('sin categorías seleccionadas => error', () => {
    expect(validateCategoriesStep({ categoryIds: [] }).categoryIds).toBeTruthy();
  });
  test('con al menos una categoría => sin error', () => {
    expect(validateCategoriesStep({ categoryIds: ['abc'] })).toEqual({});
  });
  test('más de 12 categorías => error', () => {
    const ids = Array.from({ length: 13 }, (_, i) => `id-${i}`);
    expect(validateCategoriesStep({ categoryIds: ids }).categoryIds).toBeTruthy();
  });
});

describe('buildSimulatePayload', () => {
  test('arma exactamente el contrato esperado por el backend, sin calcular precios', () => {
    const payload = buildSimulatePayload({
      budget: '150000', adults: '40', children: '10', eventDate: futureDate,
      location: validLocation, categoryIds: ['cat-1', 'cat-2'], preference: 'economica',
    });
    expect(payload).toEqual({
      budget: 150000,
      adults: 40,
      children: 10,
      eventDate: futureDate,
      location: { lat: -34.9011, lng: -56.1645, formattedAddress: 'Montevideo' },
      categoryIds: ['cat-1', 'cat-2'],
      preference: 'economica',
    });
    // Nada de "totalPrice"/"subtotal"/"travelCost" — eso lo calcula el backend.
    expect(payload.totalPrice).toBeUndefined();
    expect(payload.travelCost).toBeUndefined();
  });

  test('usa la preferencia por defecto si no se especifica', () => {
    const payload = buildSimulatePayload({
      budget: '1000', adults: '1', children: '0', eventDate: futureDate, location: validLocation, categoryIds: ['a'],
    });
    expect(payload.preference).toBe(DEFAULT_PREFERENCE);
  });

  test('normaliza strings numéricos de los inputs a number', () => {
    const payload = buildSimulatePayload({
      budget: '5000', adults: '3', children: '2', eventDate: futureDate, location: validLocation, categoryIds: ['a'],
    });
    expect(typeof payload.budget).toBe('number');
    expect(typeof payload.adults).toBe('number');
    expect(typeof payload.children).toBe('number');
  });
});

describe('budgetSharePct', () => {
  test('calcula el porcentaje redondeado', () => {
    expect(budgetSharePct(4000, 10000)).toBe(40);
  });
  test('presupuesto 0 o inválido no rompe (devuelve 0)', () => {
    expect(budgetSharePct(4000, 0)).toBe(0);
    expect(budgetSharePct(4000, null)).toBe(0);
  });
});

describe('isSmartPackagesEnabled — misma lógica que usa /armar-evento/page.js', () => {
  test('"true" habilita', () => expect(isSmartPackagesEnabled('true')).toBe(true));
  test('"false" no habilita', () => expect(isSmartPackagesEnabled('false')).toBe(false));
  test('ausente (undefined) no habilita — default seguro', () => expect(isSmartPackagesEnabled(undefined)).toBe(false));
  test('cualquier otro valor no habilita', () => expect(isSmartPackagesEnabled('1')).toBe(false));
});

describe('hasNoResultsAtAll', () => {
  test('true si las 3 propuestas no tienen categorías', () => {
    const proposals = [{ categories: [] }, { categories: [] }, { categories: [] }];
    expect(hasNoResultsAtAll(proposals)).toBe(true);
  });
  test('false si al menos una propuesta tiene alguna categoría', () => {
    const proposals = [{ categories: [] }, { categories: [{ categoryId: '1' }] }, { categories: [] }];
    expect(hasNoResultsAtAll(proposals)).toBe(false);
  });
});
