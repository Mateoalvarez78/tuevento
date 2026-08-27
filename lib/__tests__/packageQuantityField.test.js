// lib/packageQuantityField.js — selección de cantidad (per_unit) y de horas
// contratadas (per_hour) en el checkout.
//
// Los casos acá son los mismos que defiende el backend en
// availability.pricing-phase-2.test.js: si estas dos capas se desincronizan,
// el cliente ve un precio o un error distinto del que el servidor va a
// aplicar. Por eso los códigos son idénticos a los de pricing-schema.js.

import { describe, test, expect } from 'vitest';
import {
  getInitialUnits,
  getInitialBillableHours,
  validateUnitsSelection,
  validateBillableHoursSelection,
  formatUnitsLabel,
  formatHoursLabel,
  deriveCheckoutQuantityFields,
  UNITS_INVALID,
  UNITS_BELOW_MINIMUM,
  UNITS_EXCEEDED,
  UNITS_INVALID_STEP,
  BILLABLE_HOURS_INVALID,
} from '../packageQuantityField';

const CUPCAKES = {
  minUnits: 12, maxUnits: 240, unitStep: 12,
  unitLabelSingular: 'cupcake', unitLabelPlural: 'cupcakes',
};

describe('getInitialUnits', () => {
  test('arranca en el mínimo del paquete, no en 1', () => {
    expect(getInitialUnits(CUPCAKES)).toBe(12);
  });

  test('sin mínimo declarado arranca en 1 — nunca en 0', () => {
    expect(getInitialUnits({})).toBe(1);
    expect(getInitialUnits(null)).toBe(1);
  });
});

describe('getInitialBillableHours', () => {
  test('preselecciona la duración de referencia del paquete', () => {
    expect(getInitialBillableHours({ defaultBillableHours: 4 })).toBe(4);
  });

  test('sin duración de referencia no inventa un valor', () => {
    expect(getInitialBillableHours({})).toBeNull();
    expect(getInitialBillableHours({ defaultBillableHours: 0 })).toBeNull();
  });
});

describe('validateUnitsSelection', () => {
  test('48 cupcakes (4 docenas) es válido', () => {
    expect(validateUnitsSelection(48, CUPCAKES)).toEqual({ valid: true });
  });

  test('50 no respeta el paso: UNITS_INVALID_STEP', () => {
    const r = validateUnitsSelection(50, CUPCAKES);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(UNITS_INVALID_STEP);
    expect(r.message).toContain('12');
  });

  test('el paso se cuenta DESDE el mínimo, no desde cero', () => {
    // 12 % 4 === 0, pero (12 - 10) % 4 !== 0: un chequeo ingenuo aceptaría 12.
    const pkg = { minUnits: 10, maxUnits: 100, unitStep: 4 };
    expect(validateUnitsSelection(14, pkg).valid).toBe(true);
    expect(validateUnitsSelection(12, pkg).code).toBe(UNITS_INVALID_STEP);
  });

  test('por debajo del mínimo: UNITS_BELOW_MINIMUM', () => {
    expect(validateUnitsSelection(6, CUPCAKES).code).toBe(UNITS_BELOW_MINIMUM);
  });

  test('por encima del máximo: UNITS_EXCEEDED', () => {
    expect(validateUnitsSelection(252, CUPCAKES).code).toBe(UNITS_EXCEEDED);
  });

  test('cero, negativo o no entero: UNITS_INVALID (nunca se normaliza a 1)', () => {
    for (const bad of [0, -3, 1.5, NaN, '', null, undefined, 'muchos']) {
      expect(validateUnitsSelection(bad, CUPCAKES).code).toBe(UNITS_INVALID);
    }
  });

  test('paso 1 o ausente no restringe: cualquier entero del rango vale', () => {
    const pkg = { minUnits: 1, maxUnits: 10 };
    expect(validateUnitsSelection(7, pkg).valid).toBe(true);
    expect(validateUnitsSelection(7, { ...pkg, unitStep: 1 }).valid).toBe(true);
  });

  test('paquete sin límites declarados acepta cualquier entero positivo', () => {
    expect(validateUnitsSelection(999, {}).valid).toBe(true);
  });

  test('el mensaje usa las etiquetas del paquete, no "unidades" genérico', () => {
    expect(validateUnitsSelection(6, CUPCAKES).message).toContain('cupcakes');
  });
});

describe('validateBillableHoursSelection', () => {
  test('6 horas es válido', () => {
    expect(validateBillableHoursSelection(6)).toEqual({ valid: true });
  });

  test('media hora es válida (las horas contratadas son decimales)', () => {
    expect(validateBillableHoursSelection(2.5).valid).toBe(true);
    expect(validateBillableHoursSelection(0.5).valid).toBe(true);
  });

  test('cero, negativo, fuera de tope o no numérico: BILLABLE_HOURS_INVALID', () => {
    for (const bad of [0, -3, 0.25, 25, NaN, '', null, undefined, 'seis']) {
      expect(validateBillableHoursSelection(bad).code).toBe(BILLABLE_HOURS_INVALID);
    }
  });
});

describe('formateo', () => {
  test('la cantidad usa singular/plural del paquete', () => {
    expect(formatUnitsLabel(1, CUPCAKES)).toBe('1 cupcake');
    expect(formatUnitsLabel(48, CUPCAKES)).toBe('48 cupcakes');
  });

  test('sin etiquetas del paquete cae a unidad/unidades', () => {
    expect(formatUnitsLabel(1, {})).toBe('1 unidad');
    expect(formatUnitsLabel(3, {})).toBe('3 unidades');
  });

  test('las horas se muestran sin decimales sobrantes', () => {
    expect(formatHoursLabel(6)).toBe('6 horas');
    expect(formatHoursLabel(1)).toBe('1 hora');
    expect(formatHoursLabel(2.5)).toBe('2.5 horas');
  });
});

describe('deriveCheckoutQuantityFields', () => {
  test('per_unit pide cantidad, nunca horas', () => {
    expect(deriveCheckoutQuantityFields('per_unit')).toEqual({
      showUnitsInput: true, showBillableHoursInput: false, showExtraHoursInput: false,
    });
  });

  test('per_hour pide horas contratadas, nunca cantidad ni horas extra', () => {
    // Las horas extra son el OTRO eje (fixed_package). Mostrar los dos juntos
    // sugiere que se suman, que es exactamente lo que no pasa.
    expect(deriveCheckoutQuantityFields('per_hour')).toEqual({
      showUnitsInput: false, showBillableHoursInput: true, showExtraHoursInput: false,
    });
  });

  test('fixed_package pide horas EXTRA, nunca horas contratadas', () => {
    expect(deriveCheckoutQuantityFields('fixed_package')).toEqual({
      showUnitsInput: false, showBillableHoursInput: false, showExtraHoursInput: true,
    });
  });

  test('per_person y custom_quote no piden ninguna de las tres', () => {
    for (const m of ['per_person', 'custom_quote', null, undefined]) {
      expect(deriveCheckoutQuantityFields(m)).toEqual({
        showUnitsInput: false, showBillableHoursInput: false, showExtraHoursInput: false,
      });
    }
  });
});
