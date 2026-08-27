// @vitest-environment jsdom
//
// useAdminCatalog.js no tiene JSX (solo lógica de hooks), así que se puede
// montar con @testing-library/react#renderHook — mismo criterio ya
// documentado en useSubcategories.test.js/useMyEventState.test.js sobre por
// qué este archivo puede usar jsdom mientras que un componente con JSX no
// puede ni importarse desde un test en este repo (ver docs/DECISIONS.md).
// Se mockea únicamente services/adminService — nunca fetch/api directo.
import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup, act } from '@testing-library/react';

vi.mock('../../services/adminService', () => ({
  adminService: {
    categories: {
      getAll: vi.fn(),
      getSubcategories: vi.fn(),
    },
  },
}));
import { adminService } from '../../services/adminService';
import { useAdminCategories, useAdminSubcategories } from '../useAdminCatalog';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CATEGORIES = [
  { id: 'cat-1', slug: 'catering', name: 'Catering', sortOrder: 1 },
  { id: 'cat-2', slug: 'reposteria-dulces', name: 'Repostería y dulces', sortOrder: 2 },
];

describe('useAdminCategories', () => {
  test('arranca en "loading" y termina en "success" con las categorías', async () => {
    let resolveFetch;
    adminService.categories.getAll.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

    const { result } = renderHook(() => useAdminCategories());
    expect(result.current.status).toBe('loading');
    expect(result.current.categories).toEqual([]);

    resolveFetch(CATEGORIES);
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.categories).toEqual(CATEGORIES);
    expect(adminService.categories.getAll).toHaveBeenCalledTimes(1);
  });

  test('el servicio rechaza: status "error", categories vacío, error expuesto', async () => {
    const err = Object.assign(new Error('network down'), { status: 500 });
    adminService.categories.getAll.mockRejectedValue(err);

    const { result } = renderHook(() => useAdminCategories());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.categories).toEqual([]);
    expect(result.current.error).toBe(err);
  });

  test('reload() reintenta y puede recuperarse a "success" tras un error previo', async () => {
    adminService.categories.getAll.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useAdminCategories());
    await waitFor(() => expect(result.current.status).toBe('error'));

    adminService.categories.getAll.mockResolvedValueOnce(CATEGORIES);
    await act(async () => { await result.current.reload(); });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.categories).toEqual(CATEGORIES);
    expect(result.current.error).toBeNull();
  });
});

describe('useAdminSubcategories', () => {
  test('sin categoryId: status "idle", nunca llama al servicio', () => {
    const { result } = renderHook(() => useAdminSubcategories(undefined));
    expect(result.current.status).toBe('idle');
    expect(result.current.subcategories).toEqual([]);
    expect(adminService.categories.getSubcategories).not.toHaveBeenCalled();
  });

  test('con categoryId: pasa por "loading" y termina en "success"', async () => {
    const SUBS = [{ id: 'sub-1', categoryId: 'cat-1', slug: 'parrillada-asado', name: 'Parrillada y asado' }];
    let resolveFetch;
    adminService.categories.getSubcategories.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

    const { result } = renderHook(() => useAdminSubcategories('cat-1'));
    await waitFor(() => expect(result.current.status).toBe('loading'));

    resolveFetch(SUBS);
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.subcategories).toEqual(SUBS);
    expect(adminService.categories.getSubcategories).toHaveBeenCalledWith('cat-1');
  });

  test('cambio de categoryId: la respuesta vieja (más lenta) nunca sobrescribe las opciones de la categoría nueva', async () => {
    let resolveA, resolveB;
    const promiseA = new Promise((resolve) => { resolveA = resolve; });
    const promiseB = new Promise((resolve) => { resolveB = resolve; });

    adminService.categories.getSubcategories.mockImplementationOnce(() => promiseA);
    const { result, rerender } = renderHook(({ id }) => useAdminSubcategories(id), { initialProps: { id: 'cat-1' } });
    await waitFor(() => expect(result.current.status).toBe('loading'));

    adminService.categories.getSubcategories.mockImplementationOnce(() => promiseB);
    rerender({ id: 'cat-2' });

    const SUBS_B = [{ id: 'sub-b', categoryId: 'cat-2', slug: 'tortas-personalizadas', name: 'Tortas personalizadas' }];
    resolveB(SUBS_B);
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.subcategories).toEqual(SUBS_B);

    resolveA([{ id: 'sub-a', categoryId: 'cat-1', slug: 'economico', name: 'Económico' }]);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(result.current.subcategories).toEqual(SUBS_B);
  });

  test('error, distinto de "sin opciones"', async () => {
    const err = new Error('boom');
    adminService.categories.getSubcategories.mockRejectedValue(err);
    const { result } = renderHook(() => useAdminSubcategories('cat-1'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.subcategories).toEqual([]);
    expect(result.current.error).toBe(err);
  });
});
