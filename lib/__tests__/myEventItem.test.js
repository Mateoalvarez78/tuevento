import { describe, test, expect } from 'vitest';
import { overrideFieldToPatchValue, buildEditItemPatch } from '../myEventItem';

describe('overrideFieldToPatchValue', () => {
  test('string vacío = sin override, se manda null (hereda del evento)', () => {
    expect(overrideFieldToPatchValue('')).toBeNull();
  });

  test('null/undefined = sin override, se manda null', () => {
    expect(overrideFieldToPatchValue(null)).toBeNull();
    expect(overrideFieldToPatchValue(undefined)).toBeNull();
  });

  test('string numérica = override explícito, se convierte a number', () => {
    expect(overrideFieldToPatchValue('40')).toBe(40);
    expect(overrideFieldToPatchValue('0')).toBe(0);
  });
});

describe('buildEditItemPatch', () => {
  test('arma el body completo con paquete, extras y overrides explícitos', () => {
    const patch = buildEditItemPatch({
      packageId: 'pkg-2',
      extraIds: ['extra-1', 'extra-2'],
      adults: '40',
      children: '10',
      celiacs: '2',
      extraHours: '1',
      notes: '  Sin picante  ',
    });
    expect(patch).toEqual({
      package_id: 'pkg-2',
      extras_selected: [{ id: 'extra-1', quantity: 1 }, { id: 'extra-2', quantity: 1 }],
      adults_count_override: 40,
      children_count_override: 10,
      celiacs_count: 2,
      extra_hours: 1,
      notes: 'Sin picante',
    });
  });

  test('campos de override vacíos: se mandan como null (hereda del evento), nunca se omiten', () => {
    const patch = buildEditItemPatch({
      packageId: 'pkg-1',
      extraIds: [],
      adults: '',
      children: '',
      celiacs: '',
      extraHours: '',
      notes: '',
    });
    expect(patch.adults_count_override).toBeNull();
    expect(patch.children_count_override).toBeNull();
    expect(patch.celiacs_count).toBeNull();
    expect(patch.extra_hours).toBeNull();
    expect(patch.notes).toBeNull();
  });

  test('sin extras seleccionados: extras_selected es un array vacío, nunca undefined', () => {
    const patch = buildEditItemPatch({ packageId: 'pkg-1', extraIds: [], adults: '', children: '', celiacs: '', extraHours: '', notes: '' });
    expect(patch.extras_selected).toEqual([]);
  });

  test('notes solo con espacios: se normaliza a null, no se manda un string vacío con espacios', () => {
    const patch = buildEditItemPatch({ packageId: 'pkg-1', extraIds: [], adults: '', children: '', celiacs: '', extraHours: '', notes: '   ' });
    expect(patch.notes).toBeNull();
  });

  test('packageId null (servicio sin paquetes): se preserva null, nunca se inventa un id', () => {
    const patch = buildEditItemPatch({ packageId: null, extraIds: [], adults: '', children: '', celiacs: '', extraHours: '', notes: '' });
    expect(patch.package_id).toBeNull();
  });
});
