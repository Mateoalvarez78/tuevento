// Cubre el round-trip de los campos celíacos (offers_celiac_menu/
// celiac_unit_price/celiac_description) por serviceService.createPackage —
// celiacUnitPrice es el precio COMPLETO de reemplazo, nunca un recargo (ver
// docs de negocio en availability.service.js#calculateQuote, backend).
import { describe, test, expect, vi, afterEach } from 'vitest';
import { serviceService } from '../serviceService';

const ORIGINAL_FETCH = global.fetch;

function mockPackageResponse(overrides = {}) {
  return {
    success: true,
    data: {
      id: 'pkg-1', service_id: 'service-1', name: 'Menú clásico',
      adult_price: '350.00', child_price: null, child_age_limit: 14,
      offers_celiac_menu: true, celiac_unit_price: '500.00',
      celiac_description: 'Menú sin TACC, elaboración separada.',
      is_active: true,
      ...overrides,
    },
  };
}

describe('serviceService.createPackage/updatePackage (celiac fields)', () => {
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  test('manda offers_celiac_menu/celiac_unit_price/celiac_description en el body', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => mockPackageResponse() });
    await serviceService.createPackage('service-1', {
      name: 'Menú clásico', adultPrice: 350,
      offersCeliacMenu: true, celiacUnitPrice: 500, celiacDescription: 'Menú sin TACC, elaboración separada.',
    });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.offers_celiac_menu).toBe(true);
    expect(body.celiac_unit_price).toBe(500);
    expect(body.celiac_description).toBe('Menú sin TACC, elaboración separada.');
  });

  test('mapMenu decodifica offersCeliacMenu/celiacUnitPrice/celiacDescription de la respuesta', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => mockPackageResponse() });
    const menu = await serviceService.createPackage('service-1', { name: 'Menú clásico', adultPrice: 350 });
    expect(menu.offersCeliacMenu).toBe(true);
    expect(menu.celiacUnitPrice).toBe(500);
    expect(menu.celiacDescription).toBe('Menú sin TACC, elaboración separada.');
  });

  test('opción no ofrecida: offersCeliacMenu false y celiacUnitPrice null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 201, ok: true,
      json: async () => mockPackageResponse({ offers_celiac_menu: false, celiac_unit_price: null, celiac_description: null }),
    });
    const menu = await serviceService.createPackage('service-1', { name: 'Menú clásico', adultPrice: 350 });
    expect(menu.offersCeliacMenu).toBe(false);
    expect(menu.celiacUnitPrice).toBeNull();
  });
});

// Fase B.1 — subcategory_id/subcategory_name/subcategory_slug (clasificación
// de paquete por subcategoría). Mismo patrón de mock de `global.fetch`.
describe('serviceService — subcategoría (Fase B.1)', () => {
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  test('createPackage manda subcategory_id en el body cuando el payload lo trae', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => mockPackageResponse({ subcategory_id: 'sub-1' }) });
    await serviceService.createPackage('service-1', { name: 'Pizza party', adultPrice: 350, subcategoryId: 'sub-1' });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.subcategory_id).toBe('sub-1');
  });

  test('categoría sin subcategorías: subcategoryId nunca definido en el payload de entrada → subcategory_id NO viaja en el body', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => mockPackageResponse() });
    await serviceService.createPackage('service-1', { name: 'DJ 4 horas', adultPrice: 11000 });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).not.toHaveProperty('subcategory_id');
  });

  test('subcategoryId "" (defensivo — no debería llegar por la validación del form) se traduce a null, nunca viaja como string vacío', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => mockPackageResponse() });
    await serviceService.createPackage('service-1', { name: 'X', adultPrice: 100, subcategoryId: '' });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.subcategory_id).toBeNull();
  });

  test('updatePackage con subcategoryId: null retira la clasificación explícitamente', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => mockPackageResponse({ subcategory_id: null }) });
    await serviceService.updatePackage('service-1', 'pkg-1', { subcategoryId: null });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toHaveProperty('subcategory_id', null);
  });

  test('mapMenu (getPackages) decodifica subcategoryId/subcategoryName/subcategorySlug de la respuesta', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({
        success: true,
        data: [{
          id: 'pkg-1', service_id: 'service-1', name: 'Pizza party', adult_price: '350.00', is_active: true,
          subcategory_id: 'sub-2', subcategory_name: 'Pizza party', subcategory_slug: 'pizza-party',
        }],
      }),
    });
    const [menu] = await serviceService.getPackages('service-1');
    expect(menu).toMatchObject({ subcategoryId: 'sub-2', subcategoryName: 'Pizza party', subcategorySlug: 'pizza-party' });
  });

  test('paquete SIN clasificar (subcategory_id null): mapMenu nunca rompe, todos los campos de subcategoría quedan null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({
        success: true,
        data: [{ id: 'pkg-2', service_id: 'service-1', name: 'Menú sin clasificar', adult_price: '300.00', is_active: true }],
      }),
    });
    const [menu] = await serviceService.getPackages('service-1');
    expect(menu.subcategoryId).toBeNull();
    expect(menu.subcategoryName).toBeNull();
    expect(menu.subcategorySlug).toBeNull();
  });

  test('paquete clasificado en una subcategoría ya INACTIVA: subcategoryName/Slug siguen viniendo (resueltos por LEFT JOIN sin filtrar is_active en el backend) — nunca se pierden', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({
        success: true,
        data: [{
          id: 'pkg-3', service_id: 'service-1', name: 'Menú histórico', adult_price: '300.00', is_active: true,
          subcategory_id: 'sub-legacy', subcategory_name: 'Económico', subcategory_slug: 'economico',
        }],
      }),
    });
    const [menu] = await serviceService.getPackages('service-1');
    expect(menu.subcategoryId).toBe('sub-legacy');
    expect(menu.subcategoryName).toBe('Económico');
  });
});

describe('serviceService — modelo comercial declarativo (pricing_model/unit_price)', () => {
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  test('mapService: mapea los 7 campos de pricing de la categoría (solo getMyServices los trae)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({
        success: true,
        data: [{
          id: 'svc-1', title: 'Castillo grande', category_id: 'cat-1',
          category_pricing_allowed_models: ['per_unit', 'per_hour'], category_pricing_default_model: 'per_unit',
          category_guest_usage_mode: 'capacity', category_capacity_basis: 'children_only',
          category_unit_label_singular: 'castillo', category_unit_label_plural: 'castillos',
          category_supports_dietary_restrictions: false,
        }],
      }),
    });
    const [service] = await serviceService.getByProvider('provider-1');
    expect(service).toMatchObject({
      pricingAllowedModels: ['per_unit', 'per_hour'], pricingDefaultModel: 'per_unit',
      guestUsageMode: 'capacity', capacityBasis: 'children_only',
      categoryUnitLabelSingular: 'castillo', categoryUnitLabelPlural: 'castillos',
      supportsDietaryRestrictions: false,
    });
  });

  test('mapService: sin las columnas de categoría en la fila (endpoints que no las traen), cae a defaults seguros', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true, json: async () => ({ success: true, data: { id: 'svc-1', title: 'X' } }),
    });
    const service = await serviceService.getById('svc-1');
    expect(service.pricingAllowedModels).toEqual(['per_person']);
    expect(service.pricingDefaultModel).toBe('per_person');
    expect(service.guestUsageMode).toBe('price');
  });

  test('createPackage manda pricing_model/unit_price/unit_label_*/min_units/max_units en el body (paquete per_unit)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => mockPackageResponse({ pricing_model: 'per_unit', unit_price: '8000.00' }) });
    await serviceService.createPackage('service-1', {
      name: 'Castillo grande', pricingModel: 'per_unit', unitPrice: 8000,
      unitLabelSingular: 'castillo', unitLabelPlural: 'castillos', minUnits: 1, maxUnits: 3,
    });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      pricing_model: 'per_unit', unit_price: 8000,
      unit_label_singular: 'castillo', unit_label_plural: 'castillos', min_units: 1, max_units: 3,
    });
  });

  test('mapMenu decodifica pricingModel/unitPrice/unitLabel*/minUnits/maxUnits de la respuesta', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({
        success: true,
        data: [{
          id: 'pkg-1', service_id: 'service-1', name: 'Castillo grande', adult_price: null, is_active: true,
          pricing_model: 'per_unit', unit_price: '8000.00', unit_label_singular: 'castillo', unit_label_plural: 'castillos',
          min_units: 1, max_units: 3,
          subcategory_unit_label_singular: null, subcategory_unit_label_plural: null,
        }],
      }),
    });
    const [menu] = await serviceService.getPackages('service-1');
    expect(menu).toMatchObject({
      pricingModel: 'per_unit', unitPrice: 8000, unitLabelSingular: 'castillo', unitLabelPlural: 'castillos',
      minUnits: 1, maxUnits: 3,
    });
  });

  test('mapMenu: sin pricing_model (paquete legacy): queda null, nunca inventa un valor', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({ success: true, data: [{ id: 'pkg-1', service_id: 'service-1', name: 'Menú viejo', adult_price: '300.00', is_active: true }] }),
    });
    const [menu] = await serviceService.getPackages('service-1');
    expect(menu.pricingModel).toBeNull();
    expect(menu.unitPrice).toBeNull();
  });
});
