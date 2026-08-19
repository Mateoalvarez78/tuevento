// Selección de CANTIDAD (per_unit) y de HORAS CONTRATADAS (per_hour) en el
// checkout — lógica pura, sin React, testeable sola. Mismo patrón que
// lib/packagePricingField.js (que resuelve el FORMULARIO del proveedor);
// este resuelve el INPUT del cliente que compra.
//
// El backend sigue siendo autoritativo: estas funciones existen para que la
// UI muestre el error correcto antes de mandar el pedido, nunca para decidir
// el precio. Los códigos que devuelven son los mismos que usa
// pricing-schema.js del backend, así que un rechazo del servidor y uno local
// hablan el mismo idioma.
//
// Dos reglas que este módulo existe para no volver a romper:
//   - El paso se mide DESDE el mínimo, no desde cero. Con min=10 y paso=4,
//     14 es válido y 12 no, aunque 12 sea múltiplo de 4.
//   - Nada se ajusta en silencio. Una cantidad inválida se REPORTA; nunca se
//     redondea al valor válido más cercano, porque cobrar una cantidad
//     distinta de la que el cliente eligió es peor que mostrarle un error.

export const UNITS_INVALID = 'UNITS_INVALID';
export const UNITS_BELOW_MINIMUM = 'UNITS_BELOW_MINIMUM';
export const UNITS_EXCEEDED = 'UNITS_EXCEEDED';
export const UNITS_INVALID_STEP = 'UNITS_INVALID_STEP';
export const BILLABLE_HOURS_INVALID = 'BILLABLE_HOURS_INVALID';

// Mismos topes estructurales que my-events.constants.js en el backend.
export const BILLABLE_HOURS_MIN = 0.5;
export const BILLABLE_HOURS_MAX = 24;

/**
 * Cantidad inicial a mostrar para un paquete per_unit: su mínimo declarado,
 * o 1 si no declara ninguno. Nunca 0 — un carrito de cero unidades no es una
 * selección válida y mostrarlo así invita a mandarla.
 */
export function getInitialUnits(pkg) {
  if (!pkg) return 1;
  return pkg.minUnits != null && pkg.minUnits > 0 ? pkg.minUnits : 1;
}

/**
 * Horas iniciales para un paquete per_hour: la duración de referencia que
 * declaró el proveedor. Es una PRESELECCIÓN para que el cliente vea un
 * precio, no un valor que el backend asuma por su cuenta.
 */
export function getInitialBillableHours(pkg) {
  if (!pkg) return null;
  return pkg.defaultBillableHours != null && pkg.defaultBillableHours > 0
    ? pkg.defaultBillableHours
    : null;
}

/**
 * Valida una cantidad contra min/max/step del paquete.
 * Devuelve `{ valid: true }` o `{ valid: false, code, message }`.
 */
export function validateUnitsSelection(units, pkg = {}) {
  const n = Number(units);
  if (!Number.isInteger(n) || n <= 0) {
    return { valid: false, code: UNITS_INVALID, message: 'Ingresá una cantidad válida (un número entero mayor que cero).' };
  }

  const { minUnits, maxUnits, unitStep } = pkg;
  const singular = pkg.unitLabelSingular || 'unidad';
  const plural = pkg.unitLabelPlural || 'unidades';

  if (minUnits != null && n < minUnits) {
    return {
      valid: false,
      code: UNITS_BELOW_MINIMUM,
      message: `El mínimo de este paquete es ${minUnits} ${minUnits === 1 ? singular : plural}.`,
    };
  }
  if (maxUnits != null && n > maxUnits) {
    return {
      valid: false,
      code: UNITS_EXCEEDED,
      message: `El máximo de este paquete es ${maxUnits} ${maxUnits === 1 ? singular : plural}.`,
    };
  }
  if (unitStep != null && unitStep > 1) {
    // Desde el mínimo, nunca desde cero: `n % unitStep` aceptaría cantidades
    // que el proveedor jamás ofreció.
    const base = minUnits != null ? minUnits : 0;
    if ((n - base) % unitStep !== 0) {
      return {
        valid: false,
        code: UNITS_INVALID_STEP,
        message: `Este paquete se vende de a ${unitStep} ${unitStep === 1 ? singular : plural}${base > 0 ? ` a partir de ${base}` : ''}.`,
      };
    }
  }
  return { valid: true };
}

/**
 * Valida las horas contratadas de un paquete per_hour. Decimales permitidos
 * (2.5 horas es un contrato real) — a diferencia de las horas EXTRA de un
 * fixed_package, que son enteras y son otro eje.
 */
export function validateBillableHoursSelection(hours) {
  const n = Number(hours);
  if (!Number.isFinite(n) || n < BILLABLE_HOURS_MIN || n > BILLABLE_HOURS_MAX) {
    return {
      valid: false,
      code: BILLABLE_HOURS_INVALID,
      message: `Ingresá una cantidad de horas entre ${BILLABLE_HOURS_MIN} y ${BILLABLE_HOURS_MAX}.`,
    };
  }
  return { valid: true };
}

/**
 * Etiqueta legible de la cantidad ("48 cupcakes", "1 castillo"), usando las
 * etiquetas del paquete cuando existen.
 */
export function formatUnitsLabel(units, pkg = {}) {
  const n = Number(units);
  const singular = pkg.unitLabelSingular || 'unidad';
  const plural = pkg.unitLabelPlural || 'unidades';
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Etiqueta legible de las horas contratadas ("6 horas", "1 hora"). */
export function formatHoursLabel(hours) {
  const n = Number(hours);
  if (!Number.isFinite(n)) return '';
  // 2.5 se muestra como "2.5"; 6.0 como "6" (nunca "6.0").
  const shown = Number.isInteger(n) ? String(n) : String(n);
  return `${shown} ${n === 1 ? 'hora' : 'horas'}`;
}

/**
 * Qué input mostrar en el checkout según el modelo del paquete. Un único
 * lugar donde se decide, para que ninguna pantalla lo infiera por su cuenta
 * a partir de qué campos "parecen" estar cargados.
 */
export function deriveCheckoutQuantityFields(pricingModel) {
  return {
    showUnitsInput: pricingModel === 'per_unit',
    showBillableHoursInput: pricingModel === 'per_hour',
    // Horas EXTRA sobre las ya incluidas — solo fixed_package. Nunca se
    // muestra junto al input de horas contratadas: son ejes distintos y
    // ofrecer los dos a la vez sugiere que se suman.
    showExtraHoursInput: pricingModel === 'fixed_package',
  };
}
