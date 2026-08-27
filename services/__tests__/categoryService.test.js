// Cubre categoryService.getSubcategories (Fase B.1) — mismo patrón que
// serviceService.test.js: mockea `global.fetch` directo, sin mockear `api.js`.
import { describe, test, expect, vi, afterEach } from 'vitest';
import { categoryService } from '../categoryService';

const ORIGINAL_FETCH = global.fetch;

function mockSubcategoriesResponse(rows) {
  return { success: true, data: rows };
}

describe('categoryService.getSubcategories', () => {
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  test('nunca dispara la petición con un categoryId vacío/indefinido — devuelve [] directo', async () => {
    global.fetch = vi.fn();
    expect(await categoryService.getSubcategories('')).toEqual([]);
    expect(await categoryService.getSubcategories(undefined)).toEqual([]);
    expect(await categoryService.getSubcategories(null)).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('pega al contrato canónico GET /categories/:id/subcategories', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true, json: async () => mockSubcategoriesResponse([]),
    });
    await categoryService.getSubcategories('cat-catering-id');
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('/categories/cat-catering-id/subcategories');
  });

  test('mapea id/categoryId/slug/name/description/sortOrder desde la fila real del backend', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => mockSubcategoriesResponse([
        { id: 'sub-1', category_id: 'cat-catering-id', slug: 'parrillada-asado', name: 'Parrillada y asado', description: null, sort_order: 1 },
      ]),
    });
    const [sub] = await categoryService.getSubcategories('cat-catering-id');
    expect(sub).toMatchObject({
      id: 'sub-1', categoryId: 'cat-catering-id', slug: 'parrillada-asado',
      name: 'Parrillada y asado', description: '', sortOrder: 1,
    });
  });

  test('respuesta sin data (defensivo): devuelve [] en vez de romper', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ success: true }) });
    expect(await categoryService.getSubcategories('cat-catering-id')).toEqual([]);
  });

  test('mapea los 7 campos de pricing (contrato PÚBLICO, no solo admin) — MenuManager los necesita en vivo', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => mockSubcategoriesResponse([{
        id: 'sub-1', category_id: 'cat-1', slug: 'tortas-personalizadas', name: 'Tortas personalizadas',
        pricing_allowed_models: null, pricing_default_model: null, guest_usage_mode: null, capacity_basis: null,
        unit_label_singular: 'torta', unit_label_plural: 'tortas', supports_dietary_restrictions: null,
      }]),
    });
    const [sub] = await categoryService.getSubcategories('cat-1');
    expect(sub).toMatchObject({
      pricingAllowedModels: null, pricingDefaultModel: null, guestUsageMode: null, capacityBasis: null,
      unitLabelSingular: 'torta', unitLabelPlural: 'tortas', supportsDietaryRestrictions: null,
    });
  });
});

// Admin > Configuración del catálogo — mismo patrón de mock de `global.fetch`.
describe('categoryService.admin — categorías', () => {
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
    categoryService.clearCache();
  });

  test('getAll pega a GET /categories?includeInactive=true y mapea contadores + config del campo de paquete', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({
        success: true,
        data: [{
          id: 'cat-1', slug: 'catering', name: 'Catering', emoji: '🍽️', description: null,
          sort_order: 1, is_active: true,
          service_count: '3', provider_count: '2', subcategory_count: '10', subcategory_active_count: '10',
          package_options_enabled: true, package_option_required: true,
          package_option_label: 'Tipo de menú / opción', package_option_help_text: 'Elegí...',
          pricing_allowed_models: ['per_person', 'fixed_package'], pricing_default_model: 'per_person',
          guest_usage_mode: 'price', capacity_basis: 'total_guests',
          unit_label_singular: null, unit_label_plural: null, supports_dietary_restrictions: true,
        }],
      }),
    });
    const [cat] = await categoryService.admin.getAll();
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('/categories?includeInactive=true');
    expect(cat).toMatchObject({
      id: 'cat-1', slug: 'catering', name: 'Catering', isActive: true,
      serviceCount: 3, providerCount: 2, subcategoryCount: 10, subcategoryActiveCount: 10,
      packageOptionsEnabled: true, packageOptionRequired: true,
      packageOptionLabel: 'Tipo de menú / opción', packageOptionHelpText: 'Elegí...',
      pricingAllowedModels: ['per_person', 'fixed_package'], pricingDefaultModel: 'per_person',
      guestUsageMode: 'price', capacityBasis: 'total_guests', supportsDietaryRestrictions: true,
    });
  });

  test('create manda POST /categories con el body en snake_case', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 201, ok: true, json: async () => ({ success: true, data: { id: 'new-id', slug: 'comida-mexicana' } }),
    });
    await categoryService.admin.create({
      slug: 'comida-mexicana', name: 'Comida mexicana', emoji: '🌮',
      packageOptionsEnabled: true, packageOptionRequired: false, packageOptionLabel: 'Tipo', packageOptionHelpText: 'Ayuda',
      pricingAllowedModels: ['per_unit'], pricingDefaultModel: 'per_unit', guestUsageMode: 'recommendation',
      unitLabelSingular: 'torta', unitLabelPlural: 'tortas', supportsDietaryRestrictions: false,
    });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/categories');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      slug: 'comida-mexicana', name: 'Comida mexicana', emoji: '🌮',
      package_options_enabled: true, package_option_required: false,
      package_option_label: 'Tipo', package_option_help_text: 'Ayuda',
      pricing_allowed_models: ['per_unit'], pricing_default_model: 'per_unit', guest_usage_mode: 'recommendation',
      unit_label_singular: 'torta', unit_label_plural: 'tortas', supports_dietary_restrictions: false,
    });
  });

  test('update manda PUT /categories/:id — nunca incluye una clave para un campo no tocado (undefined se omite)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ success: true, data: { id: 'cat-1' } }) });
    await categoryService.admin.update('cat-1', { name: 'Catering renombrado' });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/categories/cat-1');
    const body = JSON.parse(options.body);
    expect(body).toEqual({ name: 'Catering renombrado' });
  });

  test('remove manda DELETE /categories/:id', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ success: true }) });
    await categoryService.admin.remove('cat-1');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/categories/cat-1');
    expect(options.method).toBe('DELETE');
  });

  test('remove propaga el mensaje del 409 (ApiError) tal cual — nunca lo reescribe', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 409, ok: false,
      json: async () => ({ success: false, message: 'No se puede eliminar: la categoría está en uso por 3 servicios. Desactivala para impedir nuevas altas.', code: 'CATEGORY_IN_USE' }),
    });
    await expect(categoryService.admin.remove('cat-1')).rejects.toMatchObject({
      message: expect.stringContaining('3 servicios'),
      code: 'CATEGORY_IN_USE',
    });
  });

  test('reorder manda PUT /categories/reorder con { ids }', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ success: true, data: [] }) });
    await categoryService.admin.reorder(['cat-a', 'cat-b']);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/categories/reorder');
    expect(JSON.parse(options.body)).toEqual({ ids: ['cat-a', 'cat-b'] });
  });

  test('create/update/remove/reorder invalidan el cache público de getAll()', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ success: true, data: [] }) });
    await categoryService.getAll(); // llena el cache público
    await categoryService.getAll(); // desde cache — no debería volver a pegarle a fetch
    expect(global.fetch).toHaveBeenCalledTimes(1);

    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => ({ success: true, data: { id: 'x' } }) });
    await categoryService.admin.create({ slug: 'x', name: 'X' });

    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ success: true, data: [] }) });
    await categoryService.getAll(); // el cache se invalidó -> vuelve a pegarle a fetch
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('categoryService.admin — subcategorías', () => {
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  test('getSubcategories (admin) nunca dispara sin categoryId', async () => {
    global.fetch = vi.fn();
    expect(await categoryService.admin.getSubcategories('')).toEqual([]);
    expect(await categoryService.admin.getSubcategories(undefined)).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('getSubcategories (admin) pega a includeInactive=true y mapea isActive/packagesCount/timestamps', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({
        success: true,
        data: [{
          id: 'sub-1', category_id: 'cat-1', slug: 'economico', name: 'Económico', description: null,
          sort_order: 1, is_active: false, packages_count: '2', created_at: '2026-01-01', updated_at: '2026-01-02',
        }],
      }),
    });
    const [sub] = await categoryService.admin.getSubcategories('cat-1');
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('includeInactive=true');
    expect(sub).toMatchObject({ id: 'sub-1', isActive: false, packagesCount: 2, createdAt: '2026-01-01', updatedAt: '2026-01-02' });
  });

  test('createSubcategory manda POST /service-subcategories con category_id snake_case', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => ({ success: true, data: { id: 'sub-new' } }) });
    await categoryService.admin.createSubcategory({ categoryId: 'cat-1', slug: 'comida-mexicana', name: 'Comida mexicana' });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/service-subcategories');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({ category_id: 'cat-1', slug: 'comida-mexicana', name: 'Comida mexicana' });
  });

  test('createSubcategory con override de pricing (caso Cupcakes): manda los 7 campos en snake_case', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => ({ success: true, data: { id: 'sub-new' } }) });
    await categoryService.admin.createSubcategory({
      categoryId: 'cat-1', slug: 'cupcakes-popcakes', name: 'Cupcakes y popcakes',
      pricingAllowedModels: ['per_unit'], pricingDefaultModel: 'per_unit',
      unitLabelSingular: 'cupcake', unitLabelPlural: 'cupcakes',
    });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      pricing_allowed_models: ['per_unit'], pricing_default_model: 'per_unit',
      unit_label_singular: 'cupcake', unit_label_plural: 'cupcakes',
    });
  });

  test('updateSubcategory con pricingAllowedModels=null explícito: viaja como null (limpia el override), nunca se omite', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ success: true, data: { id: 'sub-1' } }) });
    await categoryService.admin.updateSubcategory('sub-1', { pricingAllowedModels: null, pricingDefaultModel: null });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toEqual({ pricing_allowed_models: null, pricing_default_model: null });
  });

  test('getSubcategories (admin) mapea los 7 campos de pricing con null = hereda', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({
        success: true,
        data: [{
          id: 'sub-1', category_id: 'cat-1', slug: 'tortas-personalizadas', name: 'Tortas personalizadas',
          pricing_allowed_models: null, pricing_default_model: null, guest_usage_mode: null, capacity_basis: null,
          unit_label_singular: 'torta', unit_label_plural: 'tortas', supports_dietary_restrictions: null,
        }],
      }),
    });
    const [sub] = await categoryService.admin.getSubcategories('cat-1');
    expect(sub).toMatchObject({
      pricingAllowedModels: null, pricingDefaultModel: null, guestUsageMode: null,
      unitLabelSingular: 'torta', unitLabelPlural: 'tortas', supportsDietaryRestrictions: null,
    });
  });

  test('removeSubcategory propaga el mensaje 409 con el conteo exacto', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 409, ok: false,
      json: async () => ({ success: false, message: 'No se puede eliminar porque esta opción es utilizada por 12 paquetes. Podés desactivarla para impedir nuevas selecciones.', code: 'SUBCATEGORY_IN_USE' }),
    });
    await expect(categoryService.admin.removeSubcategory('sub-1')).rejects.toMatchObject({
      message: expect.stringContaining('12 paquetes'),
      code: 'SUBCATEGORY_IN_USE',
    });
  });

  test('reorderSubcategories manda PUT /service-subcategories/reorder con { category_id, ids }', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ success: true, data: [] }) });
    await categoryService.admin.reorderSubcategories('cat-1', ['sub-a', 'sub-b']);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/service-subcategories/reorder');
    expect(JSON.parse(options.body)).toEqual({ category_id: 'cat-1', ids: ['sub-a', 'sub-b'] });
  });
});
