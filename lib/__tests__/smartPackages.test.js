import { describe, test, expect } from 'vitest';
import {
  validateEventStep, validateCategoriesStep, buildSimulatePayload,
  budgetSharePct, budgetBarWidthPct, roundForDisplay, hasNoResultsAtAll,
  DEFAULT_PREFERENCE, isSmartPackagesEnabled,
  buildQuotePreviewEvent, isPackageGuestCompatible, isExtraAvailable,
  buildServiceOverride, buildProviderOverride, currentProviderAsCandidate, isSameProvider,
  applyProposalOverrides,
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

  test('con locationToken vigente: lo reenvía (habilita el filtro de cobertura de zona en el backend)', () => {
    const futureIso = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const payload = buildSimulatePayload({
      budget: '1000', adults: '1', children: '0', eventDate: futureDate,
      location: { ...validLocation, locationToken: 'signed-token-abc', tokenExpiresAt: futureIso },
      categoryIds: ['a'],
    });
    expect(payload.location.locationToken).toBe('signed-token-abc');
  });

  test('con locationToken YA EXPIRADO: nunca lo reenvía', () => {
    const pastIso = new Date(Date.now() - 60 * 1000).toISOString();
    const payload = buildSimulatePayload({
      budget: '1000', adults: '1', children: '0', eventDate: futureDate,
      location: { ...validLocation, locationToken: 'signed-token-abc', tokenExpiresAt: pastIso },
      categoryIds: ['a'],
    });
    expect(payload.location.locationToken).toBeUndefined();
  });

  test('sin locationToken (ubicación no verificada, solo lat/lng): la clave ni aparece', () => {
    const payload = buildSimulatePayload({
      budget: '1000', adults: '1', children: '0', eventDate: futureDate, location: validLocation, categoryIds: ['a'],
    });
    expect(payload.location).not.toHaveProperty('locationToken');
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

describe('budgetBarWidthPct — solo la barra visual, nunca el texto', () => {
  test('dentro de presupuesto: mismo valor que budgetSharePct', () => {
    expect(budgetBarWidthPct(4000, 10000)).toBe(40);
  });
  test('excede el presupuesto: se acota a 100 (la barra nunca desborda)', () => {
    expect(budgetSharePct(15000, 10000)).toBe(150); // el texto SÍ puede mostrar 150%
    expect(budgetBarWidthPct(15000, 10000)).toBe(100); // la barra nunca
  });
  test('presupuesto inválido: 0, nunca negativo ni NaN', () => {
    expect(budgetBarWidthPct(4000, 0)).toBe(0);
    expect(budgetBarWidthPct(4000, null)).toBe(0);
  });
});

describe('roundForDisplay — redondeo solo para mostrar, nunca para calcular', () => {
  test('redondea al entero más cercano', () => {
    expect(roundForDisplay(138206.38)).toBe(138206);
    expect(roundForDisplay(138206.5)).toBe(138207);
    expect(roundForDisplay(63719.6)).toBe(63720);
  });
  test('un entero exacto no cambia', () => {
    expect(roundForDisplay(50000)).toBe(50000);
  });
  test('null/undefined pasan tal cual (formatCurrency ya sabe mostrar "—")', () => {
    expect(roundForDisplay(null)).toBeNull();
    expect(roundForDisplay(undefined)).toBeUndefined();
  });
});

describe('buildQuotePreviewEvent', () => {
  test('arma event_date/adults_count/children_count desde el formulario', () => {
    const event = buildQuotePreviewEvent({ adults: '40', children: '10', eventDate: futureDate, location: null });
    expect(event).toEqual({ event_date: futureDate, adults_count: 40, children_count: 0 + 10 });
  });

  test('location_token vigente: se manda, nunca location_zone también', () => {
    const location = { ...validLocation, locationToken: 'signed.jwt', tokenExpiresAt: new Date(Date.now() + 60_000).toISOString() };
    const event = buildQuotePreviewEvent({ adults: '10', children: '0', eventDate: futureDate, location });
    expect(event.location_token).toBe('signed.jwt');
    expect(event.location_zone).toBeUndefined();
  });

  test('location_token vencido: degrada a location_zone (formattedAddress), nunca manda el token vencido', () => {
    const location = { ...validLocation, locationToken: 'signed.jwt', tokenExpiresAt: new Date(Date.now() - 60_000).toISOString() };
    const event = buildQuotePreviewEvent({ adults: '10', children: '0', eventDate: futureDate, location });
    expect(event.location_token).toBeUndefined();
    expect(event.location_zone).toBe('Montevideo');
  });

  test('sin ubicación: ni location_token ni location_zone, nunca rompe', () => {
    const event = buildQuotePreviewEvent({ adults: '10', children: '0', eventDate: futureDate, location: null });
    expect(event.location_token).toBeUndefined();
    expect(event.location_zone).toBeUndefined();
  });
});

describe('isPackageGuestCompatible', () => {
  test('dentro del rango del paquete: compatible', () => {
    expect(isPackageGuestCompatible({ minGuests: 30, maxGuests: 100 }, null, 50)).toBe(true);
  });
  test('por debajo del mínimo del paquete: no compatible', () => {
    expect(isPackageGuestCompatible({ minGuests: 30, maxGuests: 100 }, null, 20)).toBe(false);
  });
  test('por encima del máximo del paquete: no compatible', () => {
    expect(isPackageGuestCompatible({ minGuests: 30, maxGuests: 100 }, null, 150)).toBe(false);
  });
  test('paquete sin rango propio: cae al rango del servicio', () => {
    expect(isPackageGuestCompatible({ minGuests: null, maxGuests: null }, { minGuests: 10, maxGuests: 20 }, 15)).toBe(true);
    expect(isPackageGuestCompatible({ minGuests: null, maxGuests: null }, { minGuests: 10, maxGuests: 20 }, 25)).toBe(false);
  });
  test('sin rango en ningún lado: siempre compatible', () => {
    expect(isPackageGuestCompatible({ minGuests: null, maxGuests: null }, null, 999)).toBe(true);
  });
});

describe('isExtraAvailable', () => {
  const AVAILABLE = [{ id: 'extra-1', name: 'Bebidas', price: 3000 }, { id: 'extra-2', name: 'Mozos', price: 5000 }];

  test('extra presente en availableExtras: disponible', () => {
    expect(isExtraAvailable('extra-1', AVAILABLE)).toBe(true);
  });
  test('extra ausente: no disponible', () => {
    expect(isExtraAvailable('extra-9', AVAILABLE)).toBe(false);
  });
  test('sin availableExtras: nunca rompe, nada disponible', () => {
    expect(isExtraAvailable('extra-1', null)).toBe(false);
    expect(isExtraAvailable('extra-1', undefined)).toBe(false);
  });
});

// Fixture de categoría vigente (mismo shape que devuelve simulate()) —
// reusado por buildServiceOverride/buildProviderOverride/currentProviderAsCandidate.
const baseCategory = {
  categoryId: 'cat-1', categoryName: 'Catering',
  providerId: 'prov-1', providerName: 'La Mesa Uruguaya', providerLogo: '/logo-1.jpg', providerVerified: true,
  rating: 4.4, reviewCount: 15, capacity: { min: 30, max: 250 }, distanceKm: 5,
  serviceId: 'svc-1', serviceTitle: 'Catering para eventos', servicePrimaryImage: '/svc-1.jpg',
  packageId: 'pkg-1', packageName: 'Menú clásico', includes: ['Entrada', 'Plato principal'],
  extrasSelected: [], subtotal: 30000, travelCost: 1200,
};

describe('buildServiceOverride — cambio de paquete/extras, MISMO proveedor', () => {
  test('recompone el subtotal sumando el travelCost VIGENTE de la categoría (quote-preview no lo incluye)', () => {
    const override = buildServiceOverride({
      category: baseCategory,
      pkg: { id: 'pkg-2', name: 'Pizzas chicas', includes: ['Mesas', 'Sillas'] },
      extrasSelected: [{ id: 'extra-1', quantity: 1 }],
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 48000 } } },
    });
    expect(override).toEqual({
      providerId: 'prov-1', providerName: 'La Mesa Uruguaya', providerLogo: '/logo-1.jpg', providerVerified: true,
      rating: 4.4, reviewCount: 15, capacity: { min: 30, max: 250 }, distanceKm: 5,
      serviceId: 'svc-1', serviceTitle: 'Catering para eventos', servicePrimaryImage: '/svc-1.jpg',
      packageId: 'pkg-2', packageName: 'Pizzas chicas', includes: ['Mesas', 'Sillas'],
      extrasSelected: [{ id: 'extra-1', quantity: 1 }],
      basePrice: 48000, travelCost: 1200, subtotal: 49200, requiresCustomQuote: false,
    });
  });

  test('proveedor/servicio nunca cambian: se copian tal cual de category', () => {
    const override = buildServiceOverride({
      category: baseCategory,
      pkg: { id: 'pkg-1', name: 'Menú clásico', includes: [] },
      extrasSelected: [],
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 30000 } } },
    });
    expect(override.providerId).toBe('prov-1');
    expect(override.serviceId).toBe('svc-1');
  });

  test('sin travelCost vigente (0/null): el subtotal es igual al basePrice', () => {
    const override = buildServiceOverride({
      category: { ...baseCategory, travelCost: null },
      pkg: { id: 'pkg-1', name: 'Menú clásico', includes: [] },
      extrasSelected: [],
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 30000 } } },
    });
    expect(override.subtotal).toBe(30000);
  });

  test('paquete sin includes: se normaliza a array vacío, nunca undefined', () => {
    const override = buildServiceOverride({
      category: { ...baseCategory, travelCost: 0 },
      pkg: { id: 'pkg-1', name: 'Menú clásico' },
      extrasSelected: [],
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 30000 } } },
    });
    expect(override.includes).toEqual([]);
  });

  test('sin extras (deseleccionar todos): extrasSelected queda en [], nunca undefined', () => {
    const override = buildServiceOverride({
      category: { ...baseCategory, travelCost: 0 },
      pkg: { id: 'pkg-1', name: 'Menú clásico', includes: [] },
      extrasSelected: undefined,
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 30000 } } },
    });
    expect(override.extrasSelected).toEqual([]);
  });

  test('con varios extras seleccionados: se preservan tal cual en el override', () => {
    const extras = [{ id: 'extra-1', quantity: 1 }, { id: 'extra-2', quantity: 1 }];
    const override = buildServiceOverride({
      category: { ...baseCategory, travelCost: 0 },
      pkg: { id: 'pkg-1', name: 'Menú clásico', includes: [] },
      extrasSelected: extras,
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 38000 } } },
    });
    expect(override.extrasSelected).toEqual(extras);
  });

  test('paquete custom_quote (estimated_total null): requiresCustomQuote=true, subtotal/travelCost null — nunca $0 inventado', () => {
    const override = buildServiceOverride({
      category: baseCategory,
      pkg: { id: 'pkg-custom', name: 'A medida', includes: [] },
      extrasSelected: [],
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: null } } },
    });
    expect(override.requiresCustomQuote).toBe(true);
    expect(override.subtotal).toBeNull();
    expect(override.travelCost).toBeNull();
    expect(override.basePrice).toBeNull();
  });
});

describe('currentProviderAsCandidate — la categoría vigente con shape de substitute', () => {
  test('mapea category.rating/reviewCount → providerRating/providerTotalReviews (asimetría real de nombres)', () => {
    const candidate = currentProviderAsCandidate(baseCategory);
    expect(candidate.providerRating).toBe(4.4);
    expect(candidate.providerTotalReviews).toBe(15);
    expect(candidate.categoryTotal).toBe(30000); // = category.subtotal
    expect(candidate.providerId).toBe('prov-1');
    expect(candidate.serviceId).toBe('svc-1');
    expect(candidate.packageId).toBe('pkg-1');
    expect(candidate.travelCost).toBe(1200);
  });
});

describe('isSameProvider', () => {
  test('mismo providerId => true', () => {
    expect(isSameProvider({ providerId: 'prov-1' }, baseCategory)).toBe(true);
  });
  test('providerId distinto => false', () => {
    expect(isSameProvider({ providerId: 'prov-2' }, baseCategory)).toBe(false);
  });
  test('candidato o categoría ausentes: nunca rompe, false', () => {
    expect(isSameProvider(null, baseCategory)).toBe(false);
    expect(isSameProvider({ providerId: 'prov-1' }, null)).toBe(false);
  });
});

describe('buildProviderOverride — CAMBIO de proveedor', () => {
  const candidate = {
    providerId: 'prov-2', providerName: 'Catering Express', providerLogo: '/logo-2.jpg', providerVerified: false,
    providerRating: 4.8, providerTotalReviews: 40,
    serviceId: 'svc-2', serviceTitle: 'Catering premium', servicePrimaryImage: '/svc-2.jpg',
    packageId: 'pkg-9', packageName: 'Menú premium', includes: ['Entrada', 'Plato', 'Postre'],
    capacity: { min: 20, max: 300 }, distanceKm: 12, travelCost: 800, categoryTotal: 52000,
  };

  test('toda la identidad de proveedor/servicio se copia del CANDIDATO, nunca de la categoría anterior', () => {
    const override = buildProviderOverride({
      candidate,
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 50000 } } },
    });
    expect(override).toEqual({
      providerId: 'prov-2', providerName: 'Catering Express', providerLogo: '/logo-2.jpg', providerVerified: false,
      rating: 4.8, reviewCount: 40, capacity: { min: 20, max: 300 }, distanceKm: 12,
      serviceId: 'svc-2', serviceTitle: 'Catering premium', servicePrimaryImage: '/svc-2.jpg',
      packageId: 'pkg-9', packageName: 'Menú premium', includes: ['Entrada', 'Plato', 'Postre'],
      extrasSelected: [], basePrice: 50000, travelCost: 800, subtotal: 50800, requiresCustomQuote: false,
    });
  });

  test('travelCost sale del CANDIDATO nuevo, nunca se arrastra el de la categoría/proveedor anterior', () => {
    const override = buildProviderOverride({
      candidate: { ...candidate, travelCost: 800 },
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 50000 } } },
    });
    // baseCategory.travelCost es 1200 — si se hubiese arrastrado por error, el subtotal sería 51200
    expect(override.subtotal).toBe(50800);
    expect(override.subtotal).not.toBe(round(50000 + baseCategory.travelCost));
  });

  test('extrasSelected SIEMPRE arranca en [] — nunca migra ni mapea los extras del proveedor anterior', () => {
    const override = buildProviderOverride({
      candidate,
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 50000 } } },
    });
    expect(override.extrasSelected).toEqual([]);
  });

  test('candidato sin includes: se normaliza a array vacío', () => {
    const override = buildProviderOverride({
      candidate: { ...candidate, includes: undefined },
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 50000 } } },
    });
    expect(override.includes).toEqual([]);
  });

  test('sin travelCost del candidato (0/null): el subtotal es igual al basePrice', () => {
    const override = buildProviderOverride({
      candidate: { ...candidate, travelCost: null },
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: 50000 } } },
    });
    expect(override.subtotal).toBe(50000);
  });

  test('candidato con paquete custom_quote (estimated_total null): requiresCustomQuote=true, subtotal null — nunca suma travelCost sobre null', () => {
    const override = buildProviderOverride({
      candidate,
      quotePreviewResult: { quote_snapshot: { amounts: { estimated_total: null } } },
    });
    expect(override.requiresCustomQuote).toBe(true);
    expect(override.subtotal).toBeNull();
    expect(override.travelCost).toBeNull();
  });
});

function round(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

describe('applyProposalOverrides', () => {
  const baseProposal = {
    profile: 'equilibrada',
    totalPrice: 50000,
    remainingBudget: 50000,
    overBudget: false,
    categories: [
      {
        categoryId: 'cat-1', categoryName: 'Catering',
        providerId: 'prov-1', providerName: 'La Mesa Uruguaya', providerLogo: '/logo-1.jpg', providerVerified: true,
        rating: 4.4, reviewCount: 15, capacity: { min: 30, max: 250 }, distanceKm: 5,
        serviceId: 'svc-1', serviceTitle: 'Catering para eventos', servicePrimaryImage: '/svc-1.jpg',
        packageId: 'pkg-1', packageName: 'Menú clásico', includes: [], subtotal: 30000, travelCost: 1200,
        extrasSelected: [], availableExtras: [{ id: 'extra-1', name: 'Bebidas', price: 3000 }],
      },
      { categoryId: 'cat-2', categoryName: 'DJ', providerId: 'prov-dj', packageId: 'pkg-dj', packageName: 'DJ básico', includes: [], subtotal: 20000 },
    ],
    missingCategories: [],
  };

  // Override con TODOS los campos (mismo shape que produce buildServiceOverride) —
  // desde que applyProposalOverrides reemplaza todos los campos incondicionalmente,
  // un override parcial dejaría campos en `undefined` (comportamiento correcto:
  // fuerza a que quien llama siempre pase el objeto completo que ya arma
  // buildServiceOverride/buildProviderOverride, nunca un literal a mano incompleto).
  const fullServiceOverride = (extra = {}) => ({
    providerId: 'prov-1', providerName: 'La Mesa Uruguaya', providerLogo: '/logo-1.jpg', providerVerified: true,
    rating: 4.4, reviewCount: 15, capacity: { min: 30, max: 250 }, distanceKm: 5,
    serviceId: 'svc-1', serviceTitle: 'Catering para eventos', servicePrimaryImage: '/svc-1.jpg',
    packageId: 'pkg-2', packageName: 'Pizzas chicas', includes: ['Mesas'], extrasSelected: [],
    basePrice: 45000, travelCost: 1200, subtotal: 46200,
    ...extra,
  });

  test('sin overrides: devuelve la propuesta original tal cual (misma referencia)', () => {
    expect(applyProposalOverrides(baseProposal, 100000, {})).toBe(baseProposal);
    expect(applyProposalOverrides(baseProposal, 100000, null)).toBe(baseProposal);
  });

  test('con un override de paquete: reemplaza esa categoría, recalcula total/restante/overBudget', () => {
    const result = applyProposalOverrides(baseProposal, 100000, { 'cat-1': fullServiceOverride() });
    const catering = result.categories.find((c) => c.categoryId === 'cat-1');
    expect(catering.packageId).toBe('pkg-2');
    expect(catering.subtotal).toBe(46200);
    expect(catering.customized).toBe(true);
    // el proveedor no cambió en este caso (mismo servicio/proveedor, solo paquete)
    expect(catering.providerId).toBe('prov-1');
    // la categoría no tocada queda intacta, sin el flag
    const dj = result.categories.find((c) => c.categoryId === 'cat-2');
    expect(dj.subtotal).toBe(20000);
    expect(dj.customized).toBeUndefined();
    expect(result.totalPrice).toBe(66200); // 46200 + 20000
    expect(result.remainingBudget).toBe(33800); // 100000 - 66200
    expect(result.overBudget).toBe(false);
  });

  test('override solo de extras (mismo paquete): también marca customized y expone extrasSelected', () => {
    const result = applyProposalOverrides(baseProposal, 100000, {
      'cat-1': fullServiceOverride({ packageId: 'pkg-1', packageName: 'Menú clásico', includes: [], extrasSelected: [{ id: 'extra-1', quantity: 1 }], basePrice: 33000, subtotal: 34200 }),
    });
    const catering = result.categories.find((c) => c.categoryId === 'cat-1');
    expect(catering.packageId).toBe('pkg-1'); // el paquete no cambió
    expect(catering.extrasSelected).toEqual([{ id: 'extra-1', quantity: 1 }]);
    expect(catering.customized).toBe(true);
  });

  test('override de CAMBIO DE PROVEEDOR: reemplaza TODA la identidad visual, nunca mezcla datos del proveedor anterior', () => {
    const result = applyProposalOverrides(baseProposal, 100000, {
      'cat-1': fullServiceOverride({
        providerId: 'prov-2', providerName: 'Catering Express', providerLogo: '/logo-2.jpg', providerVerified: false,
        rating: 4.8, reviewCount: 40, capacity: { min: 20, max: 300 }, distanceKm: 12,
        serviceId: 'svc-2', serviceTitle: 'Catering premium', servicePrimaryImage: '/svc-2.jpg',
        packageId: 'pkg-9', packageName: 'Menú premium', includes: ['Entrada', 'Plato', 'Postre'],
        extrasSelected: [], basePrice: 50000, travelCost: 800, subtotal: 50800,
      }),
    });
    const catering = result.categories.find((c) => c.categoryId === 'cat-1');
    expect(catering.providerId).toBe('prov-2');
    expect(catering.providerName).toBe('Catering Express');
    expect(catering.serviceId).toBe('svc-2');
    expect(catering.packageId).toBe('pkg-9');
    expect(catering.travelCost).toBe(800); // el del proveedor nuevo, nunca el 1200 del anterior
    expect(catering.subtotal).toBe(50800);
    expect(catering.extrasSelected).toEqual([]); // se resetean al cambiar de proveedor
    expect(catering.customized).toBe(true);
    expect(result.totalPrice).toBe(70800); // 50800 + 20000
  });

  test('el cambio puede hacer que la propuesta pase a overBudget', () => {
    const result = applyProposalOverrides(baseProposal, 40000, {
      'cat-1': fullServiceOverride({ packageId: 'pkg-3', packageName: 'Menú premium', includes: [], extrasSelected: [], basePrice: 60000, subtotal: 60000, travelCost: 0 }),
    });
    expect(result.totalPrice).toBe(80000); // 60000 + 20000
    expect(result.overBudget).toBe(true);
    expect(result.remainingBudget).toBe(-40000);
  });

  test('override en una categoría inexistente en la propuesta: se ignora, no rompe', () => {
    const result = applyProposalOverrides(baseProposal, 100000, { 'cat-inexistente': fullServiceOverride() });
    expect(result).toBe(baseProposal); // ningún override matcheó ninguna categoría real
  });

  test('overrides en dos categorías distintas: cada una independiente, ambas se reflejan en el total', () => {
    const result = applyProposalOverrides(baseProposal, 100000, {
      'cat-1': fullServiceOverride(),
      'cat-2': fullServiceOverride({
        providerId: 'prov-dj-2', providerName: 'DJ Pro', serviceId: 'svc-dj-2', packageId: 'pkg-dj-2', packageName: 'DJ premium',
        basePrice: 25000, travelCost: 0, subtotal: 25000,
      }),
    });
    expect(result.categories.find((c) => c.categoryId === 'cat-1').subtotal).toBe(46200);
    expect(result.categories.find((c) => c.categoryId === 'cat-2').subtotal).toBe(25000);
    expect(result.totalPrice).toBe(71200);
  });

  test('override a un paquete custom_quote: la categoría queda con subtotal null, el total EXCLUYE esa categoría (nunca la trata como $0) y marca hasCustomQuoteCategories', () => {
    const result = applyProposalOverrides(baseProposal, 100000, {
      'cat-1': fullServiceOverride({ subtotal: null, basePrice: null, travelCost: null, requiresCustomQuote: true }),
    });
    const catering = result.categories.find((c) => c.categoryId === 'cat-1');
    expect(catering.requiresCustomQuote).toBe(true);
    expect(catering.subtotal).toBeNull();
    // Solo suma la categoría NO custom_quote (DJ, 20000) — nunca NaN ni un
    // 0 que haga parecer que el catering de este evento salió gratis.
    expect(result.totalPrice).toBe(20000);
    expect(result.hasCustomQuoteCategories).toBe(true);
  });
});
