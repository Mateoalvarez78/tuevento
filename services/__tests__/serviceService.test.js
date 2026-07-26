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
