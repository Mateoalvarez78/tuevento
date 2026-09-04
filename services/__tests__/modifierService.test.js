// Contrato del servicio de inclusiones, grupos y adicionales.
//
// Lo que se verifica no es "que llame al endpoint", sino que el payload no
// lleve nunca cosas que el backend rechaza (cantidad en un adicional
// agrupado) ni cosas que cambiarían en silencio lo que el cliente eligió
// (reapuntar un item a otro extra).
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const { api } = await import('../api');
const { modifierService, mapGroup, mapExtra, mapInclusion } = await import('../modifierService');

const S = 'srv-1';
const P = 'pkg-1';
const G = 'grp-1';

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
});

describe('mappers', () => {
  test('un grupo deriva "obligatorio" del mínimo', () => {
    expect(mapGroup({ id: G, name: 'Sonido', min_selections: 1, max_selections: 1, items: [] }).isRequired).toBe(true);
    expect(mapGroup({ id: G, name: 'Luz', min_selections: 0, max_selections: 2, items: [] }).isRequired).toBe(false);
  });

  test('max nulo se conserva como "sin tope", no como 0', () => {
    expect(mapGroup({ id: G, name: 'X', min_selections: 0, max_selections: null, items: [] }).maxSelections).toBeNull();
  });

  test('el item toma su nombre del extra base y su precio del delta', () => {
    const g = mapGroup({
      id: G, name: 'X', min_selections: 0, items: [
        { id: 'i1', extra_id: 'x1', extra_name: 'Máquina de humo', price_delta: '2500.00' },
      ],
    });
    expect(g.items[0]).toMatchObject({ id: 'i1', extraId: 'x1', name: 'Máquina de humo', priceDelta: 2500 });
  });

  test('un delta cero se mapea a 0, no a null', () => {
    const g = mapGroup({ id: G, name: 'X', min_selections: 0, items: [{ id: 'i1', extra_id: 'x1', price_delta: '0.00' }] });
    expect(g.items[0].priceDelta).toBe(0);
  });

  test('el extra base expone en cuántos grupos se usa', () => {
    expect(mapExtra({ id: 'x1', name: 'Humo', price: '2500.00', group_usages: '2' }).groupUsages).toBe(2);
  });

  test('una inclusión sin cantidad la deja en null', () => {
    expect(mapInclusion({ id: 'i', name: 'DJ', quantity: null }).quantity).toBeNull();
    expect(mapInclusion({ id: 'i', name: 'Parlantes', quantity: 2 }).quantity).toBe(2);
  });
});

describe('inclusiones', () => {
  test('crear manda cantidad vacía como null, no como 0', () => {
    // 0 violaría el CHECK de la base (quantity > 0).
    api.post.mockResolvedValue({ data: { id: 'i1', name: 'DJ' } });
    return modifierService.createInclusion(S, P, { name: 'DJ', quantity: '' }).then(() => {
      expect(api.post).toHaveBeenCalledWith(
        `/services/${S}/packages/${P}/inclusions`,
        { name: 'DJ', quantity: null, description: null }
      );
    });
  });

  test('reordenar manda el array de ids tal cual', async () => {
    api.patch.mockResolvedValue({ data: [] });
    await modifierService.reorderInclusions(S, P, ['b', 'a']);
    expect(api.patch).toHaveBeenCalledWith(
      `/services/${S}/packages/${P}/inclusions/reorder`, { order: ['b', 'a'] }
    );
  });
});

describe('grupos', () => {
  test('crear manda min/max numéricos y max vacío como null', async () => {
    api.post.mockResolvedValue({ data: { id: G, name: 'Luz', min_selections: 0, items: [] } });
    await modifierService.createGroup(S, P, { name: 'Luz', minSelections: 0, maxSelections: '' });
    expect(api.post).toHaveBeenCalledWith(
      `/services/${S}/packages/${P}/modifier-groups`,
      { name: 'Luz', description: null, min_selections: 0, max_selections: null }
    );
  });

  test('actualizar solo manda lo que cambió', async () => {
    api.put.mockResolvedValue({ data: { id: G, name: 'Luz', min_selections: 1, items: [] } });
    await modifierService.updateGroup(S, P, G, { minSelections: 1 });
    expect(api.put).toHaveBeenCalledWith(
      `/services/${S}/packages/${P}/modifier-groups/${G}`, { min_selections: 1 }
    );
  });
});

describe('items', () => {
  test('agregar manda extra_id y delta', async () => {
    api.post.mockResolvedValue({ data: { id: 'i1', extra_id: 'x1', price_delta: '0' } });
    await modifierService.addItem(S, P, G, { extraId: 'x1', priceDelta: 0 });
    expect(api.post).toHaveBeenCalledWith(
      `/services/${S}/packages/${P}/modifier-groups/${G}/items`,
      { extra_id: 'x1', price_delta: 0 }
    );
  });

  test('actualizar NUNCA manda extra_id', async () => {
    // Reapuntar un item a otro adicional cambiaría en silencio lo que el
    // cliente creyó elegir. Se quita y se agrega de nuevo.
    api.put.mockResolvedValue({ data: { id: 'i1', extra_id: 'x1', price_delta: '500' } });
    await modifierService.updateItem(S, P, G, 'i1', { extraId: 'OTRO', priceDelta: 500 });
    const body = api.put.mock.calls[0][1];
    expect(body).not.toHaveProperty('extra_id');
    expect(body).toEqual({ price_delta: 500 });
  });
});

describe('adicionales base', () => {
  test('"eliminar" hace DELETE, que el backend resuelve como desactivación', async () => {
    // No existe borrado físico desde una ruta de proveedor: el extra puede
    // estar referenciado en reservas y snapshots.
    api.delete.mockResolvedValue({ data: { id: 'x1', is_active: false } });
    await modifierService.deactivateExtra(S, 'x1');
    expect(api.delete).toHaveBeenCalledWith(`/services/${S}/extras/x1`);
  });

  test('las rutas conservan /packages, no se renombran a /opciones', async () => {
    // "Opción" es terminología visible; el contrato no cambia.
    api.get.mockResolvedValue({ data: [] });
    await modifierService.getGroups(S, P);
    expect(api.get.mock.calls[0][0]).toContain('/packages/');
    expect(api.get.mock.calls[0][0]).not.toContain('/opciones');
  });
});
