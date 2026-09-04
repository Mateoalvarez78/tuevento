// Lógica pura del campo de subcategoría (el constructor de opciones) — sin JSX, corre en
// el entorno "node" por defecto de este proyecto (ver vitest.config.js).
import { describe, test, expect } from 'vitest';
import {
  getSubcategoryFieldLabel, getSubcategoryHelpText, isSubcategoryRequired,
  buildSubcategoryOptions, validateSubcategorySelection, deriveSubcategoryFieldState,
} from '../packageSubcategoryField';

describe('getSubcategoryFieldLabel — el label lo carga el admin, ya no hay mapa por slug', () => {
  test('devuelve el label configurado tal cual', () => {
    expect(getSubcategoryFieldLabel('Tipo de menú / opción')).toBe('Tipo de menú / opción');
    expect(getSubcategoryFieldLabel('Tipo de producto')).toBe('Tipo de producto');
  });

  test('label vacío/no configurado: fallback genérico', () => {
    expect(getSubcategoryFieldLabel('')).toBe('Tipo de servicio / opción');
    expect(getSubcategoryFieldLabel(undefined)).toBe('Tipo de servicio / opción');
    expect(getSubcategoryFieldLabel(null)).toBe('Tipo de servicio / opción');
  });
});

describe('getSubcategoryHelpText — la ayuda la carga el admin, ya no hay mapa por slug', () => {
  test('devuelve la ayuda configurada tal cual', () => {
    expect(getSubcategoryHelpText('Elegí el tipo de propuesta gastronómica...')).toBe('Elegí el tipo de propuesta gastronómica...');
  });

  test('sin ayuda configurada: null (nunca un texto genérico inventado)', () => {
    expect(getSubcategoryHelpText('')).toBeNull();
    expect(getSubcategoryHelpText(undefined)).toBeNull();
    expect(getSubcategoryHelpText(null)).toBeNull();
  });
});

describe('isSubcategoryRequired — 100% genérico, basado en datos', () => {
  test('con subcategorías activas: true', () => {
    expect(isSubcategoryRequired([{ id: '1', name: 'X' }])).toBe(true);
  });

  test('sin subcategorías (lista vacía): false', () => {
    expect(isSubcategoryRequired([])).toBe(false);
  });

  test('valor no-array (undefined/null, ej. antes de resolver la carga): false, nunca revienta', () => {
    expect(isSubcategoryRequired(undefined)).toBe(false);
    expect(isSubcategoryRequired(null)).toBe(false);
  });
});

// Traducción ÚNICA de useSubcategories#status + la configuración
// administrable de la categoría (package_options_enabled/
// package_option_required) a lo que el constructor de opciones realmente usa para
// decidir si se puede guardar — es la misma función que consume el
// componente (deriveSubcategoryFieldState), así que estos tests cubren
// directamente el comportamiento real, no una reimplementación paralela a
// mano. Firma: (status, subcategories, optionsEnabled, requiredConfig).
describe('deriveSubcategoryFieldState — categoría CON la función habilitada y obligatoria', () => {
  test('"loading": nunca resuelto (bloquea guardar), required false, pero el campo SÍ se muestra (skeleton)', () => {
    expect(deriveSubcategoryFieldState('loading', [], true, true)).toEqual({ resolved: false, required: false, showField: true });
  });

  test('"error": nunca resuelto (bloquea guardar) — nunca se confunde con "sin subcategorías"', () => {
    expect(deriveSubcategoryFieldState('error', [], true, true)).toEqual({ resolved: false, required: false, showField: true });
  });

  test('"success" con lista vacía (habilitada pero sin opciones activas): resuelto, NO requerido, campo oculto', () => {
    expect(deriveSubcategoryFieldState('success', [], true, true)).toEqual({ resolved: true, required: false, showField: false });
  });

  test('"success" con opciones: resuelto, requerido, campo visible — exige una selección válida', () => {
    expect(deriveSubcategoryFieldState('success', [{ id: 'sub-1', name: 'Parrillada y asado' }], true, true))
      .toEqual({ resolved: true, required: true, showField: true });
  });

  test('"idle" (sin categoryId): resuelto (nada que validar), no requerido, campo oculto', () => {
    expect(deriveSubcategoryFieldState('idle', [], true, true)).toEqual({ resolved: true, required: false, showField: false });
  });
});

describe('deriveSubcategoryFieldState — categoría habilitada pero OPCIONAL (package_option_required=false)', () => {
  test('"success" con opciones: se muestra, pero NUNCA se exige una selección', () => {
    expect(deriveSubcategoryFieldState('success', [{ id: 'sub-1', name: 'X' }], true, false))
      .toEqual({ resolved: true, required: false, showField: true });
  });
});

describe('deriveSubcategoryFieldState — categoría con la función DESHABILITADA', () => {
  test('nunca muestra el campo, pase lo que pase con status/subcategorías/required', () => {
    expect(deriveSubcategoryFieldState('success', [{ id: 'sub-1', name: 'X' }], false, true))
      .toEqual({ resolved: true, required: false, showField: false });
    expect(deriveSubcategoryFieldState('loading', [], false, true))
      .toEqual({ resolved: false, required: false, showField: false });
    expect(deriveSubcategoryFieldState('error', [], false, true))
      .toEqual({ resolved: false, required: false, showField: false });
  });

  test('nunca lo exige, aunque required=true en la config', () => {
    expect(deriveSubcategoryFieldState('success', [{ id: 'sub-1', name: 'X' }], false, true).required).toBe(false);
  });
});

describe('buildSubcategoryOptions', () => {
  const ACTIVE = [
    { id: 'sub-1', name: 'Parrillada y asado' },
    { id: 'sub-2', name: 'Pizza party' },
  ];

  test('mapea id/name en el mismo orden recibido (ya viene ordenado por sort_order desde el backend)', () => {
    const options = buildSubcategoryOptions(ACTIVE, null, null);
    expect(options).toEqual([
      { value: 'sub-1', label: 'Parrillada y asado' },
      { value: 'sub-2', label: 'Pizza party' },
    ]);
  });

  test('sin subcategoría persistida (paquete nuevo o sin clasificar): no agrega ninguna opción histórica', () => {
    const options = buildSubcategoryOptions(ACTIVE, null, null);
    expect(options.some((o) => o.historical)).toBe(false);
  });

  test('subcategoría persistida SÍ está entre las activas: no agrega una opción duplicada', () => {
    const options = buildSubcategoryOptions(ACTIVE, 'sub-1', 'Parrillada y asado');
    expect(options).toHaveLength(2);
    expect(options.filter((o) => o.value === 'sub-1')).toHaveLength(1);
  });

  test('subcategoría persistida INACTIVA (ej. "económico", legacy): antepone una opción histórica identificable', () => {
    const options = buildSubcategoryOptions(ACTIVE, 'sub-legacy', 'Económico');
    expect(options[0]).toEqual({ value: 'sub-legacy', label: 'Económico (ya no disponible)', historical: true });
    expect(options).toHaveLength(3);
  });

  test('subcategoría histórica sin nombre resuelto (defensivo): usa un label genérico, nunca undefined', () => {
    const options = buildSubcategoryOptions(ACTIVE, 'sub-legacy', null);
    expect(options[0].label).toBe('Subcategoría (ya no disponible)');
  });

  test('nunca reactiva ni modifica la lista de subcategorías activas recibida (misma referencia de datos, solo antepone)', () => {
    const options = buildSubcategoryOptions(ACTIVE, 'sub-legacy', 'Económico');
    expect(options.slice(1)).toEqual([
      { value: 'sub-1', label: 'Parrillada y asado' },
      { value: 'sub-2', label: 'Pizza party' },
    ]);
  });

  test('lista de activas no-array (defensivo, ej. antes de resolver la carga): no revienta, opciones vacías salvo la histórica', () => {
    expect(buildSubcategoryOptions(undefined, null, null)).toEqual([]);
    expect(buildSubcategoryOptions(null, 'sub-legacy', 'Económico')).toEqual([
      { value: 'sub-legacy', label: 'Económico (ya no disponible)', historical: true },
    ]);
  });
});

describe('validateSubcategorySelection', () => {
  test('no resuelto (loading/error): bloquea SIEMPRE, sin importar si la categoría termina requiriendo o no', () => {
    expect(validateSubcategorySelection({ resolved: false, required: true, subcategoryId: '', validOptionIds: [] }))
      .toMatchObject({ valid: false });
    expect(validateSubcategorySelection({ resolved: false, required: false, subcategoryId: '', validOptionIds: [] }))
      .toMatchObject({ valid: false });
  });

  test('nunca confunde "no resuelto" con "no tiene subcategorías": el mensaje es de carga, no de ausencia', () => {
    const result = validateSubcategorySelection({ resolved: false, required: true, subcategoryId: '', validOptionIds: [] });
    expect(result.message).toMatch(/cargar/i);
  });

  test('resuelto, categoría sin subcategorías (required=false): siempre válido, sin importar subcategoryId', () => {
    expect(validateSubcategorySelection({ resolved: true, required: false, subcategoryId: '', validOptionIds: [] }))
      .toEqual({ valid: true });
  });

  test('resuelto, requerido, sin selección: inválido con mensaje de "elegir una opción"', () => {
    const result = validateSubcategorySelection({ resolved: true, required: true, subcategoryId: '', validOptionIds: ['sub-1'] });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/opción/i);
  });

  test('resuelto, requerido, id fuera de las opciones válidas: inválido (nunca se envía un id inventado/obsoleto)', () => {
    const result = validateSubcategorySelection({ resolved: true, required: true, subcategoryId: 'sub-otro', validOptionIds: ['sub-1', 'sub-2'] });
    expect(result.valid).toBe(false);
  });

  test('resuelto, requerido, id válido entre las activas: válido', () => {
    expect(validateSubcategorySelection({ resolved: true, required: true, subcategoryId: 'sub-1', validOptionIds: ['sub-1', 'sub-2'] }))
      .toEqual({ valid: true });
  });

  test('resuelto, requerido, id histórico SIN cambios (reenvía exactamente el mismo que ya tenía): válido si figura en validOptionIds', () => {
    expect(validateSubcategorySelection({ resolved: true, required: true, subcategoryId: 'sub-legacy', validOptionIds: ['sub-legacy', 'sub-1', 'sub-2'] }))
      .toEqual({ valid: true });
  });
});

// Cadena completa deriveSubcategoryFieldState -> validateSubcategorySelection
// exactamente como la usa save() en el constructor de opciones — prueba el
// comportamiento real de "¿se puede guardar?" en cada estado del hook, no
// solo las piezas por separado.
describe('deriveSubcategoryFieldState + validateSubcategorySelection — cadena completa (save())', () => {
  const saveIsAllowed = (status, subcategories, subcategoryId, validOptionIds, optionsEnabled = true, requiredConfig = true) => {
    const { resolved, required } = deriveSubcategoryFieldState(status, subcategories, optionsEnabled, requiredConfig);
    return validateSubcategorySelection({ resolved, required, subcategoryId, validOptionIds });
  };

  test('mientras carga ("loading"), categoría habilitada: NUNCA se guarda como si la categoría no tuviera opciones — bloqueado aunque no haya subcategoryId', () => {
    const result = saveIsAllowed('loading', [], '', []);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/cargar/i);
  });

  test('error de red ("error"), categoría habilitada: bloquea guardar porque no se pudo determinar si la categoría requiere clasificación', () => {
    const result = saveIsAllowed('error', [], '', []);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/cargar/i);
  });

  test('respuesta exitosa con [] ("success", categoría habilitada pero sin subcategorías activas): permite guardar SIN subcategory_id', () => {
    expect(saveIsAllowed('success', [], '', [])).toEqual({ valid: true });
  });

  test('respuesta exitosa CON opciones y required=true ("success"): exige una selección válida — vacío queda bloqueado', () => {
    const active = [{ id: 'sub-1', name: 'Parrillada y asado' }];
    const result = saveIsAllowed('success', active, '', ['sub-1']);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/opción/i);
  });

  test('respuesta exitosa CON opciones y una selección válida: permite guardar', () => {
    const active = [{ id: 'sub-1', name: 'Parrillada y asado' }];
    expect(saveIsAllowed('success', active, 'sub-1', ['sub-1'])).toEqual({ valid: true });
  });

  test('categoría habilitada pero OPCIONAL (required=false): permite guardar CON opciones activas y sin seleccionar ninguna', () => {
    const active = [{ id: 'sub-1', name: 'Parrillada y asado' }];
    expect(saveIsAllowed('success', active, '', ['sub-1'], true, false)).toEqual({ valid: true });
  });

  test('categoría con la función DESHABILITADA: siempre permite guardar, sin importar status/opciones', () => {
    expect(saveIsAllowed('idle', [], '', [], false, true)).toEqual({ valid: true });
  });
});
