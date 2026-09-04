// Selección de adicionales agrupados en el cliente.
//
// La regla que más importa acá es que la UI no invite a una configuración que
// el backend después rechaza: si el botón deja avanzar con un grupo
// obligatorio vacío, el cliente llega al checkout y recibe un error.
import { describe, test, expect } from 'vitest';
import {
  describeGroupRule, groupInputType, formatDelta,
  isItemSelected, countSelected, toggleItem, canSelectMore,
  validateSelection, modifiersSubtotal, selectionLines,
  toModifierPayload, defaultSelection, cheapestPaidAddon,
} from '../modifierSelection';

const item = (o = {}) => ({ id: 'i1', extraId: 'x1', name: 'Máquina de humo', priceDelta: 2500, ...o });
const group = (o = {}) => ({
  id: 'g1', name: 'Iluminación adicional', minSelections: 0, maxSelections: null,
  isRequired: false, isActive: true, items: [item()], ...o,
});
const sel = (groupId, itemId) => ({ groupId, itemId });
const moneda = (n) => `$${n.toLocaleString('es-UY')}`;

describe('cómo se describe la regla del grupo', () => {
  test('opcional sin tope', () => {
    expect(describeGroupRule(group())).toBe('Opcional');
  });

  test('opcional con tope', () => {
    expect(describeGroupRule(group({ maxSelections: 2 }))).toBe('Opcional · Elegí hasta 2');
  });

  test('obligatorio de cupo exacto', () => {
    expect(describeGroupRule(group({ minSelections: 1, maxSelections: 1 }))).toBe('Obligatorio · Elegí 1');
  });

  test('obligatorio con rango', () => {
    expect(describeGroupRule(group({ minSelections: 2, maxSelections: 4 }))).toBe('Obligatorio · Elegí entre 2 y 4');
  });

  test('obligatorio sin tope', () => {
    expect(describeGroupRule(group({ minSelections: 2 }))).toBe('Obligatorio · Elegí al menos 2');
  });

  test('la obligatoriedad se DERIVA del mínimo, no de una bandera aparte', () => {
    // Aunque llegue isRequired en false, min > 0 manda: es la misma autoridad
    // única que usa la base (no existe columna is_required).
    expect(describeGroupRule(group({ minSelections: 1, maxSelections: 1, isRequired: false })))
      .toContain('Obligatorio');
  });
});

describe('tipo de control', () => {
  test('cupo 1 se comporta como radio', () => {
    expect(groupInputType(group({ maxSelections: 1 }))).toBe('radio');
  });

  test('varios cupos se comportan como checkbox', () => {
    expect(groupInputType(group({ maxSelections: 3 }))).toBe('checkbox');
    expect(groupInputType(group({ maxSelections: null }))).toBe('checkbox');
  });
});

describe('cómo se muestra el precio', () => {
  test('delta cero dice "Incluido", nunca $0', () => {
    // "$0" se lee como un error de carga; "Incluido" comunica la intención.
    expect(formatDelta(0, moneda)).toBe('Incluido');
  });

  test('delta positivo lleva el signo', () => {
    expect(formatDelta(2500, moneda)).toBe('+$2.500');
  });
});

describe('elegir y deselegir', () => {
  test('marcar un item lo agrega', () => {
    const r = toggleItem([], group({ maxSelections: 2 }), 'i1');
    expect(r).toEqual([{ groupId: 'g1', itemId: 'i1' }]);
  });

  test('volver a tocarlo lo saca', () => {
    const r = toggleItem([sel('g1', 'i1')], group({ maxSelections: 2 }), 'i1');
    expect(r).toEqual([]);
  });

  test('en un grupo de cupo 1, elegir REEMPLAZA', () => {
    const g = group({ maxSelections: 1, items: [item(), item({ id: 'i2', extraId: 'x2' })] });
    const r = toggleItem([sel('g1', 'i1')], g, 'i2');
    expect(r).toEqual([{ groupId: 'g1', itemId: 'i2' }]);
  });

  test('llegado al tope, marcar uno más no hace nada', () => {
    const g = group({ maxSelections: 2, items: [item(), item({ id: 'i2' }), item({ id: 'i3' })] });
    const actuales = [sel('g1', 'i1'), sel('g1', 'i2')];
    expect(toggleItem(actuales, g, 'i3')).toEqual(actuales);
  });

  test('deseleccionar SIEMPRE se permite, aunque baje del mínimo', () => {
    // El mínimo se valida al confirmar, no mientras el cliente reacomoda.
    const g = group({ minSelections: 1, maxSelections: 1 });
    expect(toggleItem([sel('g1', 'i1')], g, 'i1')).toEqual([]);
  });

  test('las selecciones de otros grupos no se tocan', () => {
    const g = group({ id: 'g1', maxSelections: 1 });
    const r = toggleItem([sel('g2', 'otro'), sel('g1', 'i1')], g, 'i1');
    expect(r).toEqual([{ groupId: 'g2', itemId: 'otro' }]);
  });

  test('canSelectMore respeta el tope', () => {
    const g = group({ maxSelections: 1 });
    expect(canSelectMore([], g)).toBe(true);
    expect(canSelectMore([sel('g1', 'i1')], g)).toBe(false);
    expect(canSelectMore([sel('g1', 'i1')], group({ maxSelections: null }))).toBe(true);
  });

  test('isItemSelected y countSelected leen por grupo', () => {
    const s = [sel('g1', 'i1'), sel('g2', 'i9')];
    expect(isItemSelected(s, 'g1', 'i1')).toBe(true);
    expect(isItemSelected(s, 'g2', 'i1')).toBe(false);
    expect(countSelected(s, 'g1')).toBe(1);
  });
});

describe('validación antes de cotizar', () => {
  test('sin grupos obligatorios, no hay problemas', () => {
    expect(validateSelection([group()], [])).toEqual([]);
  });

  test('un obligatorio vacío bloquea y nombra el grupo', () => {
    const g = group({ name: 'Elegí el equipo de sonido', minSelections: 1, maxSelections: 1 });
    const r = validateSelection([g], []);
    expect(r).toHaveLength(1);
    expect(r[0].message).toContain('Elegí el equipo de sonido');
  });

  test('mínimo mayor a 1 pide la cantidad exacta', () => {
    const g = group({ minSelections: 2 });
    expect(validateSelection([g], [sel('g1', 'i1')])[0].message).toContain('al menos 2');
  });

  test('pasarse del máximo también bloquea', () => {
    const g = group({ maxSelections: 1 });
    const r = validateSelection([g], [sel('g1', 'i1'), sel('g1', 'i2')]);
    expect(r[0].message).toContain('hasta 1');
  });

  test('un grupo INACTIVO no exige nada', () => {
    const g = group({ minSelections: 1, isActive: false });
    expect(validateSelection([g], [])).toEqual([]);
  });

  test('satisfecho el mínimo, no hay problema', () => {
    const g = group({ minSelections: 1, maxSelections: 1 });
    expect(validateSelection([g], [sel('g1', 'i1')])).toEqual([]);
  });
});

describe('total provisional', () => {
  test('suma solo lo elegido', () => {
    const g = group({ maxSelections: 3, items: [item({ priceDelta: 2500 }), item({ id: 'i2', priceDelta: 5000 })] });
    expect(modifiersSubtotal([g], [sel('g1', 'i2')])).toBe(5000);
  });

  test('una variante "Incluido" no mueve el total', () => {
    const g = group({ items: [item({ priceDelta: 0 })] });
    expect(modifiersSubtotal([g], [sel('g1', 'i1')])).toBe(0);
  });

  test('nunca suma el precio del extra base', () => {
    // El extra base vale 9999; el delta de ESTA opción es 4000. Sumar los dos
    // sería el doble cobro que el backend rechaza.
    const g = group({ items: [item({ priceDelta: 4000, price: 9999 })] });
    expect(modifiersSubtotal([g], [sel('g1', 'i1')])).toBe(4000);
  });

  test('varios grupos suman entre sí', () => {
    const g1 = group({ id: 'g1', items: [item({ id: 'a', priceDelta: 2500 })] });
    const g2 = group({ id: 'g2', items: [item({ id: 'b', priceDelta: 4000 })] });
    expect(modifiersSubtotal([g1, g2], [sel('g1', 'a'), sel('g2', 'b')])).toBe(6500);
  });

  test('sin selección, cero', () => {
    expect(modifiersSubtotal([group()], [])).toBe(0);
  });
});

describe('desglose y payload', () => {
  test('las líneas traen grupo, nombre y monto', () => {
    const g = group({ items: [item({ priceDelta: 2500 })] });
    expect(selectionLines([g], [sel('g1', 'i1')])).toEqual([{
      groupId: 'g1', groupName: 'Iluminación adicional',
      itemId: 'i1', name: 'Máquina de humo', amount: 2500,
    }]);
  });

  test('el payload lleva SOLO ids, nunca cantidad ni precio', () => {
    // Mandar cantidad hace que el backend rechace el pedido entero.
    const r = toModifierPayload([sel('g1', 'i1')]);
    expect(r).toEqual([{ group_id: 'g1', item_id: 'i1' }]);
    expect(Object.keys(r[0])).toEqual(['group_id', 'item_id']);
  });
});

describe('preselección al abrir', () => {
  test('un obligatorio de cupo 1 arranca con su primera alternativa', () => {
    // Si no, el cliente ve un error apenas elige la opción.
    const g = group({ minSelections: 1, maxSelections: 1, items: [item({ id: 'gratis', priceDelta: 0 }), item({ id: 'i2' })] });
    expect(defaultSelection([g])).toEqual([{ groupId: 'g1', itemId: 'gratis' }]);
  });

  test('un grupo opcional no preselecciona nada', () => {
    expect(defaultSelection([group()])).toEqual([]);
  });

  test('un obligatorio de varios cupos tampoco: la elección es del cliente', () => {
    expect(defaultSelection([group({ minSelections: 2, maxSelections: 3 })])).toEqual([]);
  });

  test('un grupo inactivo se ignora', () => {
    expect(defaultSelection([group({ minSelections: 1, maxSelections: 1, isActive: false })])).toEqual([]);
  });
});

describe('precio de entrada de los adicionales', () => {
  test('devuelve el más barato de los pagos', () => {
    const g = group({ items: [item({ priceDelta: 0 }), item({ id: 'i2', priceDelta: 2500 }), item({ id: 'i3', priceDelta: 5000 })] });
    expect(cheapestPaidAddon([g])).toBe(2500);
  });

  test('si todos son "Incluido", no hay precio de entrada', () => {
    expect(cheapestPaidAddon([group({ items: [item({ priceDelta: 0 })] })])).toBeNull();
  });

  test('sin grupos, null', () => {
    expect(cheapestPaidAddon([])).toBeNull();
  });
});
