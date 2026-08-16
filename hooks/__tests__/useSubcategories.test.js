// @vitest-environment jsdom
//
// useSubcategories.js no tiene JSX (solo lógica de hook), así que se puede
// montar con @testing-library/react#renderHook — mismo criterio ya
// documentado en useMyEventState.test.js/useAcceptProposal.test.js sobre por
// qué este archivo puede usar jsdom mientras que un componente con JSX no
// puede ni importarse desde un test en este repo (ver docs/DECISIONS.md).
// Se mockea únicamente services/categoryService — nunca fetch/api directo.
import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup, act } from '@testing-library/react';

vi.mock('../../services/categoryService', () => ({
  categoryService: {
    getSubcategories: vi.fn(),
  },
}));
import { categoryService } from '../../services/categoryService';
import { useSubcategories } from '../useSubcategories';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CATERING_SUBS = [
  { id: 'sub-1', categoryId: 'cat-catering', slug: 'parrillada-asado', name: 'Parrillada y asado', sortOrder: 1 },
  { id: 'sub-2', categoryId: 'cat-catering', slug: 'pizza-party', name: 'Pizza party', sortOrder: 2 },
];

describe('useSubcategories — sin categoryId', () => {
  test('categoryId undefined: status "idle", nunca llama al servicio', async () => {
    const { result } = renderHook(() => useSubcategories(undefined));
    expect(result.current.status).toBe('idle');
    expect(result.current.subcategories).toEqual([]);
    expect(categoryService.getSubcategories).not.toHaveBeenCalled();
  });

  test('categoryId vacío (""): igual que undefined, nunca dispara la petición', async () => {
    const { result } = renderHook(() => useSubcategories(''));
    expect(result.current.status).toBe('idle');
    expect(categoryService.getSubcategories).not.toHaveBeenCalled();
  });
});

describe('useSubcategories — carga exitosa', () => {
  test('con categoryId: pasa por "loading" y termina en "success" con las subcategorías', async () => {
    let resolveFetch;
    categoryService.getSubcategories.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

    const { result } = renderHook(() => useSubcategories('cat-catering'));
    await waitFor(() => expect(result.current.status).toBe('loading'));

    resolveFetch(CATERING_SUBS);
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.subcategories).toEqual(CATERING_SUBS);
    expect(categoryService.getSubcategories).toHaveBeenCalledWith('cat-catering');
    expect(categoryService.getSubcategories).toHaveBeenCalledTimes(1);
  });

  test('categoría sin subcategorías: "success" con lista vacía (nunca queda en "loading" para siempre)', async () => {
    categoryService.getSubcategories.mockResolvedValue([]);
    const { result } = renderHook(() => useSubcategories('cat-dj'));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.subcategories).toEqual([]);
  });
});

describe('useSubcategories — error, distinto de "sin opciones"', () => {
  test('el servicio rechaza: status "error", subcategories se mantiene vacío, error queda expuesto', async () => {
    const err = Object.assign(new Error('network down'), { status: 500 });
    categoryService.getSubcategories.mockRejectedValue(err);

    const { result } = renderHook(() => useSubcategories('cat-catering'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.subcategories).toEqual([]);
    expect(result.current.error).toBe(err);
  });

  test('reload() reintenta y puede recuperarse a "success" tras un error previo', async () => {
    categoryService.getSubcategories.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useSubcategories('cat-catering'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    categoryService.getSubcategories.mockResolvedValueOnce(CATERING_SUBS);
    await act(async () => { await result.current.reload(); });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.subcategories).toEqual(CATERING_SUBS);
    expect(result.current.error).toBeNull();
  });
});

describe('useSubcategories — cambio de categoryId', () => {
  test('cambiar categoryId dispara una nueva carga con el id nuevo', async () => {
    categoryService.getSubcategories.mockResolvedValue(CATERING_SUBS);
    const { result, rerender } = renderHook(({ id }) => useSubcategories(id), { initialProps: { id: 'cat-catering' } });
    await waitFor(() => expect(result.current.status).toBe('success'));

    const REPOSTERIA_SUBS = [{ id: 'sub-9', categoryId: 'cat-reposteria', slug: 'tortas-personalizadas', name: 'Tortas personalizadas', sortOrder: 1 }];
    categoryService.getSubcategories.mockResolvedValue(REPOSTERIA_SUBS);
    rerender({ id: 'cat-reposteria' });
    await waitFor(() => expect(result.current.subcategories).toEqual(REPOSTERIA_SUBS));
    expect(categoryService.getSubcategories).toHaveBeenCalledWith('cat-reposteria');
  });

  test('cambio RÁPIDO de categoryId: una respuesta vieja que resuelve tarde nunca sobrescribe las opciones de la categoría nueva', async () => {
    // Dos promesas controladas a mano para poder resolver la VIEJA (catering)
    // DESPUÉS de que la nueva (repostería) ya haya resuelto — la peor
    // ordenación posible (red lenta para la primera categoría).
    let resolveCatering, resolveReposteria;
    const cateringPromise = new Promise((resolve) => { resolveCatering = resolve; });
    const reposteriaPromise = new Promise((resolve) => { resolveReposteria = resolve; });

    categoryService.getSubcategories.mockImplementationOnce(() => cateringPromise);
    const { result, rerender } = renderHook(({ id }) => useSubcategories(id), { initialProps: { id: 'cat-catering' } });
    await waitFor(() => expect(result.current.status).toBe('loading'));

    // Cambia de categoría ANTES de que la petición de catering resuelva.
    categoryService.getSubcategories.mockImplementationOnce(() => reposteriaPromise);
    rerender({ id: 'cat-reposteria' });
    expect(categoryService.getSubcategories).toHaveBeenCalledTimes(2);

    const REPOSTERIA_SUBS = [{ id: 'sub-9', categoryId: 'cat-reposteria', slug: 'tortas-personalizadas', name: 'Tortas personalizadas', sortOrder: 1 }];
    resolveReposteria(REPOSTERIA_SUBS);
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.subcategories).toEqual(REPOSTERIA_SUBS);

    // La respuesta VIEJA (catering) llega recién ahora — debe ser ignorada
    // por completo: nunca pisa las opciones de repostería ya mostradas.
    resolveCatering(CATERING_SUBS);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(result.current.subcategories).toEqual(REPOSTERIA_SUBS);
    expect(result.current.status).toBe('success');
  });
});
