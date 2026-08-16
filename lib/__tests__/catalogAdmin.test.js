// Lógica pura de Admin > Configuración del catálogo — sin JSX, corre en el
// entorno "node" por defecto de este proyecto (ver vitest.config.js).
import { describe, test, expect } from 'vitest';
import {
  slugify, isSlugFormatValid, reorderIds, describeDeleteBlock,
  categoryUsageCounts, subcategoryUsageCounts, validateCategoryForm, validateSubcategoryForm,
  needsActiveOptionsWarning, validatePricingConfigForm, describePricingSchema, describeConfigChangeWarning,
} from '../catalogAdmin';

describe('slugify', () => {
  test('minúsculas, espacios -> guiones', () => {
    expect(slugify('Comida Mexicana')).toBe('comida-mexicana');
  });

  test('saca acentos', () => {
    expect(slugify('Repostería')).toBe('reposteria');
  });

  test('colapsa símbolos repetidos y recorta guiones en los bordes', () => {
    expect(slugify('  Pizza & Empanadas!! ')).toBe('pizza-empanadas');
  });

  test('vacío/undefined: string vacío, nunca revienta', () => {
    expect(slugify('')).toBe('');
    expect(slugify(undefined)).toBe('');
  });

  test('el resultado siempre pasa isSlugFormatValid (mismo patrón que el backend exige)', () => {
    expect(isSlugFormatValid(slugify('Comida Mexicana® 2.0'))).toBe(true);
  });
});

describe('isSlugFormatValid', () => {
  test('kebab-case válido: true', () => {
    expect(isSlugFormatValid('comida-mexicana')).toBe(true);
    expect(isSlugFormatValid('finger-food')).toBe(true);
    expect(isSlugFormatValid('a')).toBe(true);
  });

  test('mayúsculas, espacios, acentos: false', () => {
    expect(isSlugFormatValid('Comida Mexicana')).toBe(false);
    expect(isSlugFormatValid('comida_mexicana')).toBe(false);
    expect(isSlugFormatValid('comida--mexicana')).toBe(false);
    expect(isSlugFormatValid('-comida')).toBe(false);
    expect(isSlugFormatValid('comida-')).toBe(false);
  });

  test('vacío/undefined: false', () => {
    expect(isSlugFormatValid('')).toBe(false);
    expect(isSlugFormatValid(undefined)).toBe(false);
  });
});

describe('reorderIds — mover arriba/abajo (reemplaza drag&drop)', () => {
  const ids = ['a', 'b', 'c'];

  test('mover "arriba" el segundo elemento: intercambia con el anterior', () => {
    expect(reorderIds(ids, 1, 'up')).toEqual(['b', 'a', 'c']);
  });

  test('mover "abajo" el segundo elemento: intercambia con el siguiente', () => {
    expect(reorderIds(ids, 1, 'down')).toEqual(['a', 'c', 'b']);
  });

  test('mover "arriba" el primero: no-op, devuelve la MISMA referencia', () => {
    expect(reorderIds(ids, 0, 'up')).toBe(ids);
  });

  test('mover "abajo" el último: no-op, devuelve la MISMA referencia', () => {
    expect(reorderIds(ids, 2, 'down')).toBe(ids);
  });

  test('índice fuera de rango: no-op defensivo', () => {
    expect(reorderIds(ids, -1, 'up')).toBe(ids);
    expect(reorderIds(ids, 5, 'down')).toBe(ids);
  });

  test('nunca muta el array original', () => {
    const original = ['x', 'y'];
    const copy = [...original];
    reorderIds(original, 0, 'down');
    expect(original).toEqual(copy);
  });

  test('input no-array: lo devuelve tal cual, nunca revienta', () => {
    expect(reorderIds(null, 0, 'up')).toBeNull();
    expect(reorderIds(undefined, 0, 'up')).toBeUndefined();
  });
});

describe('describeDeleteBlock', () => {
  test('todos los conteos en 0: null (nada bloquea, se puede eliminar)', () => {
    expect(describeDeleteBlock([{ count: 0, singular: 'servicio', plural: 'servicios' }])).toBeNull();
    expect(describeDeleteBlock([])).toBeNull();
  });

  test('un conteo > 0: arma el mensaje con singular/plural correcto', () => {
    const msg = describeDeleteBlock([{ count: 1, singular: 'servicio', plural: 'servicios' }]);
    expect(msg).toMatch(/1 servicio(?!s)/);
    expect(msg).toMatch(/Podés desactivarla/);
  });

  test('varios conteos > 0: los junta todos en un solo mensaje, omite los que están en 0', () => {
    const msg = describeDeleteBlock([
      { count: 3, singular: 'servicio', plural: 'servicios' },
      { count: 0, singular: 'proveedor', plural: 'proveedores' },
      { count: 12, singular: 'paquete', plural: 'paquetes' },
    ]);
    expect(msg).toMatch(/3 servicios/);
    expect(msg).not.toMatch(/proveedor/);
    expect(msg).toMatch(/12 paquetes/);
  });
});

describe('categoryUsageCounts / subcategoryUsageCounts — adaptadores para describeDeleteBlock', () => {
  test('categoryUsageCounts expone servicios/proveedores/subcategorías', () => {
    const category = { serviceCount: 2, providerCount: 1, subcategoryCount: 5 };
    const counts = categoryUsageCounts(category);
    expect(counts.find((c) => c.singular === 'servicio').count).toBe(2);
    expect(counts.find((c) => c.singular === 'proveedor').count).toBe(1);
    expect(counts.find((c) => c.singular === 'subcategoría').count).toBe(5);
  });

  test('categoryUsageCounts con category undefined/campos faltantes: todo en 0, nunca revienta', () => {
    expect(describeDeleteBlock(categoryUsageCounts(undefined))).toBeNull();
    expect(describeDeleteBlock(categoryUsageCounts({}))).toBeNull();
  });

  test('subcategoryUsageCounts expone paquetes — mismo formato que el mensaje 409 real del backend', () => {
    const msg = describeDeleteBlock(subcategoryUsageCounts({ packagesCount: 12 }));
    expect(msg).toMatch(/12 paquetes/);
  });

  test('subcategoryUsageCounts sin uso: describeDeleteBlock devuelve null', () => {
    expect(describeDeleteBlock(subcategoryUsageCounts({ packagesCount: 0 }))).toBeNull();
    expect(describeDeleteBlock(subcategoryUsageCounts(undefined))).toBeNull();
  });
});

describe('validateCategoryForm', () => {
  test('creando: nombre y slug obligatorios', () => {
    expect(validateCategoryForm({ slug: '', name: '' }, { isCreate: true })).toMatchObject({ valid: false, field: 'name' });
    expect(validateCategoryForm({ slug: '', name: 'Comida mexicana' }, { isCreate: true })).toMatchObject({ valid: false, field: 'slug' });
  });

  test('creando: slug con formato inválido rechazado', () => {
    expect(validateCategoryForm({ slug: 'Comida Mexicana', name: 'Comida mexicana' }, { isCreate: true }))
      .toMatchObject({ valid: false, field: 'slug' });
  });

  test('creando: válido con nombre+slug correctos', () => {
    expect(validateCategoryForm({ slug: 'comida-mexicana', name: 'Comida mexicana' }, { isCreate: true })).toEqual({ valid: true });
  });

  test('editando: el slug NUNCA se exige ni se valida (es inmutable)', () => {
    expect(validateCategoryForm({ slug: '', name: 'Catering' }, { isCreate: false })).toEqual({ valid: true });
    expect(validateCategoryForm({ slug: 'SLUG INVÁLIDO', name: 'Catering' }, { isCreate: false })).toEqual({ valid: true });
  });

  test('sortOrder negativo o no-entero: rechazado', () => {
    expect(validateCategoryForm({ name: 'Catering', sortOrder: -1 }, { isCreate: false })).toMatchObject({ valid: false, field: 'sortOrder' });
    expect(validateCategoryForm({ name: 'Catering', sortOrder: 1.5 }, { isCreate: false })).toMatchObject({ valid: false, field: 'sortOrder' });
  });

  test('sortOrder ausente o vacío: no lo exige (es opcional)', () => {
    expect(validateCategoryForm({ name: 'Catering' }, { isCreate: false })).toEqual({ valid: true });
    expect(validateCategoryForm({ name: 'Catering', sortOrder: '' }, { isCreate: false })).toEqual({ valid: true });
  });
});

describe('validateSubcategoryForm', () => {
  test('categoryId siempre obligatorio', () => {
    expect(validateSubcategoryForm({ categoryId: null, name: 'Pizza party' }, { isCreate: true }))
      .toMatchObject({ valid: false, field: 'categoryId' });
  });

  test('creando: nombre y slug obligatorios, formato validado', () => {
    expect(validateSubcategoryForm({ categoryId: 'cat-1', name: '', slug: '' }, { isCreate: true }))
      .toMatchObject({ valid: false, field: 'name' });
    expect(validateSubcategoryForm({ categoryId: 'cat-1', name: 'Pizza party', slug: '' }, { isCreate: true }))
      .toMatchObject({ valid: false, field: 'slug' });
    expect(validateSubcategoryForm({ categoryId: 'cat-1', name: 'Pizza party', slug: 'Pizza Party' }, { isCreate: true }))
      .toMatchObject({ valid: false, field: 'slug' });
  });

  test('creando: válido con todos los campos correctos', () => {
    expect(validateSubcategoryForm({ categoryId: 'cat-1', name: 'Pizza party', slug: 'pizza-party' }, { isCreate: true }))
      .toEqual({ valid: true });
  });

  test('editando: el slug no se exige', () => {
    expect(validateSubcategoryForm({ categoryId: 'cat-1', name: 'Pizza party', slug: '' }, { isCreate: false })).toEqual({ valid: true });
  });
});

describe('needsActiveOptionsWarning', () => {
  test('habilitada pero sin subcategorías activas: true', () => {
    expect(needsActiveOptionsWarning({ packageOptionsEnabled: true, subcategoryActiveCount: 0 })).toBe(true);
  });

  test('habilitada CON subcategorías activas: false', () => {
    expect(needsActiveOptionsWarning({ packageOptionsEnabled: true, subcategoryActiveCount: 3 })).toBe(false);
  });

  test('deshabilitada: false, sin importar cuántas subcategorías activas tenga', () => {
    expect(needsActiveOptionsWarning({ packageOptionsEnabled: false, subcategoryActiveCount: 0 })).toBe(false);
  });

  test('category undefined/campos faltantes: false, nunca revienta', () => {
    expect(needsActiveOptionsWarning(undefined)).toBe(false);
    expect(needsActiveOptionsWarning({})).toBe(false);
  });
});

describe('validatePricingConfigForm', () => {
  test('categoría completa y coherente: ok', () => {
    expect(validatePricingConfigForm({
      pricingAllowedModels: ['per_person', 'fixed_package'], pricingDefaultModel: 'per_person',
      guestUsageMode: 'price', capacityBasis: 'total_guests',
    })).toEqual({ valid: true });
  });

  test('pricingAllowedModels sin pricingDefaultModel (o viceversa): inválido', () => {
    expect(validatePricingConfigForm({ pricingAllowedModels: ['per_person'], pricingDefaultModel: null }))
      .toMatchObject({ valid: false, field: 'pricingDefaultModel' });
    expect(validatePricingConfigForm({ pricingAllowedModels: null, pricingDefaultModel: 'per_person' }))
      .toMatchObject({ valid: false, field: 'pricingDefaultModel' });
  });

  test('ambos ausentes (subcategoría que hereda todo): ok', () => {
    expect(validatePricingConfigForm({})).toEqual({ valid: true });
  });

  test('pricingAllowedModels vacío: inválido', () => {
    expect(validatePricingConfigForm({ pricingAllowedModels: [], pricingDefaultModel: 'per_person' }))
      .toMatchObject({ valid: false, field: 'pricingAllowedModels' });
  });

  test('pricingAllowedModels con un valor fuera del vocabulario fijo: inválido', () => {
    expect(validatePricingConfigForm({ pricingAllowedModels: ['not_a_model'], pricingDefaultModel: 'not_a_model' }))
      .toMatchObject({ valid: false, field: 'pricingAllowedModels' });
  });

  test('pricingDefaultModel fuera del allowed-list: inválido', () => {
    expect(validatePricingConfigForm({ pricingAllowedModels: ['per_person'], pricingDefaultModel: 'per_unit' }))
      .toMatchObject({ valid: false, field: 'pricingDefaultModel' });
  });

  test('guestUsageMode/capacityBasis inválidos: rechazados', () => {
    expect(validatePricingConfigForm({ guestUsageMode: 'urgencia' })).toMatchObject({ valid: false, field: 'guestUsageMode' });
    expect(validatePricingConfigForm({ capacityBasis: 'mascotas' })).toMatchObject({ valid: false, field: 'capacityBasis' });
  });
});

describe('validateCategoryForm — integra la validación de pricing', () => {
  test('nombre/slug válidos pero pricing incoherente: rechazado por el campo de pricing', () => {
    expect(validateCategoryForm({
      slug: 'comida-mexicana', name: 'Comida mexicana',
      pricingAllowedModels: ['per_person'], pricingDefaultModel: 'per_unit',
    }, { isCreate: true })).toMatchObject({ valid: false, field: 'pricingDefaultModel' });
  });
});

describe('validateSubcategoryForm — integra la validación de pricing', () => {
  test('override de modelo sin default: rechazado', () => {
    expect(validateSubcategoryForm({
      categoryId: 'cat-1', name: 'Cupcakes', slug: 'cupcakes', pricingAllowedModels: ['per_unit'],
    }, { isCreate: true })).toMatchObject({ valid: false, field: 'pricingDefaultModel' });
  });
});

describe('describePricingSchema', () => {
  test('un solo modelo permitido: describe el precio directo', () => {
    const lines = describePricingSchema({ pricingAllowedModels: ['per_person'], pricingDefaultModel: 'per_person' });
    expect(lines[0]).toMatch(/Por persona/);
  });

  test('varios modelos permitidos: los lista y marca el default', () => {
    const lines = describePricingSchema({ pricingAllowedModels: ['per_hour', 'fixed_package'], pricingDefaultModel: 'fixed_package' });
    expect(lines[0]).toMatch(/Por hora/);
    expect(lines[0]).toMatch(/Paquete fijo/);
    expect(lines[0]).toMatch(/Paquete fijo"\)\.$/);
  });

  test('per_unit permitido: agrega la línea de etiqueta de unidad', () => {
    const lines = describePricingSchema({
      pricingAllowedModels: ['per_unit'], pricingDefaultModel: 'per_unit',
      unitLabelSingular: 'torta', unitLabelPlural: 'tortas',
    });
    expect(lines.some((l) => l.includes('torta') && l.includes('tortas'))).toBe(true);
  });

  test('supportsDietaryRestrictions=true: agrega la línea de menú celíaco', () => {
    const lines = describePricingSchema({ pricingAllowedModels: ['per_person'], pricingDefaultModel: 'per_person', supportsDietaryRestrictions: true });
    expect(lines.some((l) => l.includes('celíaco'))).toBe(true);
  });

  test('guestUsageMode: agrega una línea describiendo el uso de invitados', () => {
    const lines = describePricingSchema({ pricingAllowedModels: ['per_hour'], pricingDefaultModel: 'per_hour', guestUsageMode: 'capacity' });
    expect(lines.some((l) => l.toLowerCase().includes('capacidad'))).toBe(true);
  });

  test('sin config o sin modelos permitidos: array vacío, nunca revienta', () => {
    expect(describePricingSchema(null)).toEqual([]);
    expect(describePricingSchema({})).toEqual([]);
    expect(describePricingSchema({ pricingAllowedModels: [] })).toEqual([]);
  });
});

describe('describeConfigChangeWarning', () => {
  const original = { pricingAllowedModels: ['per_person'], pricingDefaultModel: 'per_person', guestUsageMode: 'price', capacityBasis: 'total_guests' };

  test('sin servicios activos: nunca advierte, aunque el modelo cambie', () => {
    const edited = { ...original, pricingDefaultModel: 'fixed_package', pricingAllowedModels: ['per_person', 'fixed_package'] };
    expect(describeConfigChangeWarning(original, edited, 0)).toBeNull();
  });

  test('con servicios activos pero SIN cambios reales de pricing: nunca advierte', () => {
    const edited = { ...original };
    expect(describeConfigChangeWarning(original, edited, 5)).toBeNull();
  });

  test('con servicios activos Y un cambio real de pricing: advierte, menciona la cantidad', () => {
    const edited = { ...original, pricingDefaultModel: 'fixed_package', pricingAllowedModels: ['per_person', 'fixed_package'] };
    const warning = describeConfigChangeWarning(original, edited, 5);
    expect(warning).toMatch(/5 servicios/);
  });

  test('singular correcto con exactamente 1 servicio', () => {
    const edited = { ...original, guestUsageMode: 'capacity' };
    const warning = describeConfigChangeWarning(original, edited, 1);
    expect(warning).toMatch(/1 servicio activo\./);
  });
});
