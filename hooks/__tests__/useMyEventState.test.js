// @vitest-environment jsdom
//
// Cubre la máquina de estados de "Mi evento" de punta a punta: descubrimiento
// del borrador activo según el estado real de auth, reemplazo canónico tras
// cada mutación, conflicto de versión (409) sin reintentos ciegos, y
// protección contra respuestas obsoletas/doble submit/desmontaje.
//
// Se monta el HOOK REAL (useMyEventState.js, sin mock) vía
// @testing-library/react#renderHook — nunca JSX en este archivo (solo
// `createElement`, para el único test que necesita un wrapper de
// <StrictMode>): Vitest en este repo no puede transformar/importar archivos
// `.js` con JSX (mismo límite ya documentado en useDialog.test.js). Se
// mockea únicamente services/myEventService — nunca fetch/services/api
// directo, ya que esa capa HTTP tiene su propia suite
// (services/__tests__/myEventService.test.js).
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode, createElement } from 'react';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useMyEventState } from '../useMyEventState';
import { ApiError } from '../../services/api';

vi.mock('../../services/myEventService', () => ({
  myEventService: {
    getActiveDraft: vi.fn(),
    getEvent: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    addItem: vi.fn(),
    importItems: vi.fn(),
    updateItem: vi.fn(),
    replaceItem: vi.fn(),
    removeItem: vi.fn(),
    revalidateEvent: vi.fn(),
  },
}));
import { myEventService } from '../../services/myEventService';

const CLIENT = { id: 'client-1', role: 'client' };

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  myEventService.getActiveDraft.mockResolvedValue(null);
});

async function renderAuthenticatedWithEvent(event = { id: 'evt-1', version: 1 }) {
  myEventService.getActiveDraft.mockResolvedValue(event);
  const rendered = renderHook(() => useMyEventState(CLIENT, false));
  await waitFor(() => expect(rendered.result.current.event).toEqual(event));
  return rendered;
}

describe('useMyEventState — descubrimiento según estado de auth', () => {
  test('1. no carga mientras la sesión está restaurándose', () => {
    const { result } = renderHook(() => useMyEventState(null, true));
    expect(myEventService.getActiveDraft).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.event).toBeNull();
  });

  test('2. no carga para usuario no autenticado', async () => {
    const { result } = renderHook(() => useMyEventState(null, false));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(myEventService.getActiveDraft).not.toHaveBeenCalled();
    expect(result.current.event).toBeNull();
  });

  test('3. carga una vez para cliente autenticado y guarda el evento activo', async () => {
    const activeEvent = { id: 'evt-1', version: 1, items: [] };
    myEventService.getActiveDraft.mockResolvedValue(activeEvent);
    const { result } = renderHook(() => useMyEventState(CLIENT, false));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(myEventService.getActiveDraft).toHaveBeenCalledTimes(1);
    expect(result.current.event).toEqual(activeEvent);
  });

  test('4. conserva data:null explícito (no lo trata como error)', async () => {
    myEventService.getActiveDraft.mockResolvedValue(null);
    const { result } = renderHook(() => useMyEventState(CLIENT, false));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.event).toBeNull();
    expect(result.current.loadError).toBeNull();
  });

  test('5. no carga para roles que no sean cliente (provider/admin/superadmin)', async () => {
    for (const role of ['provider', 'admin', 'superadmin']) {
      vi.clearAllMocks();
      const { result, unmount } = renderHook(() => useMyEventState({ id: 'u1', role }, false));
      await waitFor(() => expect(result.current.status).toBe('ready'));
      expect(myEventService.getActiveDraft).not.toHaveBeenCalled();
      expect(result.current.event).toBeNull();
      unmount();
    }
  });

  test('6. no crea un draft durante el descubrimiento', async () => {
    myEventService.getActiveDraft.mockResolvedValue(null);
    const { result } = renderHook(() => useMyEventState(CLIENT, false));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(myEventService.createEvent).not.toHaveBeenCalled();
  });

  test('7. no revalida automáticamente al cargar', async () => {
    myEventService.getActiveDraft.mockResolvedValue({ id: 'evt-1', version: 1 });
    renderHook(() => useMyEventState(CLIENT, false));
    await waitFor(() => expect(myEventService.getActiveDraft).toHaveBeenCalled());
    expect(myEventService.revalidateEvent).not.toHaveBeenCalled();
  });
});

describe('useMyEventState — sesión: logout, cambio de usuario, respuestas tardías', () => {
  test('8. limpia el evento al hacer logout', async () => {
    const activeEvent = { id: 'evt-1', version: 1 };
    myEventService.getActiveDraft.mockResolvedValue(activeEvent);
    const { result, rerender } = renderHook(
      ({ user, authLoading }) => useMyEventState(user, authLoading),
      { initialProps: { user: CLIENT, authLoading: false } }
    );
    await waitFor(() => expect(result.current.event).toEqual(activeEvent));

    rerender({ user: null, authLoading: false });
    await waitFor(() => expect(result.current.event).toBeNull());
  });

  test('9. no conserva el evento del usuario anterior al cambiar de usuario', async () => {
    const eventA = { id: 'evt-a', version: 1 };
    const eventB = { id: 'evt-b', version: 1 };
    myEventService.getActiveDraft.mockResolvedValueOnce(eventA).mockResolvedValueOnce(eventB);
    const CLIENT_A = { id: 'c1', role: 'client' };
    const CLIENT_B = { id: 'c2', role: 'client' };
    const { result, rerender } = renderHook(
      ({ user, authLoading }) => useMyEventState(user, authLoading),
      { initialProps: { user: CLIENT_A, authLoading: false } }
    );
    await waitFor(() => expect(result.current.event).toEqual(eventA));

    rerender({ user: CLIENT_B, authLoading: false });
    await waitFor(() => expect(result.current.event).toEqual(eventB));
    expect(result.current.event.id).not.toBe(eventA.id);
  });

  test('10. ignora una respuesta tardía de la sesión anterior', async () => {
    let resolveSessionA;
    const sessionAPromise = new Promise((res) => { resolveSessionA = res; });
    const eventB = { id: 'evt-b', version: 1 };
    myEventService.getActiveDraft
      .mockImplementationOnce(() => sessionAPromise)
      .mockResolvedValueOnce(eventB);

    const CLIENT_A = { id: 'c1', role: 'client' };
    const CLIENT_B = { id: 'c2', role: 'client' };
    const { result, rerender } = renderHook(
      ({ user, authLoading }) => useMyEventState(user, authLoading),
      { initialProps: { user: CLIENT_A, authLoading: false } }
    );

    rerender({ user: CLIENT_B, authLoading: false });
    await waitFor(() => expect(result.current.event).toEqual(eventB));

    await act(async () => {
      resolveSessionA({ id: 'evt-a-stale', version: 99 });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.event).toEqual(eventB);
  });

  test('11. seguro bajo React Strict Mode (doble invocación del efecto en dev)', async () => {
    myEventService.getActiveDraft.mockResolvedValue({ id: 'evt-1', version: 1 });
    const wrapper = ({ children }) => createElement(StrictMode, null, children);
    const { result } = renderHook(() => useMyEventState(CLIENT, false), { wrapper });
    await waitFor(() => expect(result.current.event).not.toBeNull());
    expect(result.current.event).toEqual({ id: 'evt-1', version: 1 });
  });

  test('12. desmontar aborta la lectura en vuelo y no deja un setState pendiente', async () => {
    let capturedSignal;
    let resolveActive;
    myEventService.getActiveDraft.mockImplementation(({ signal } = {}) => {
      capturedSignal = signal;
      return new Promise((res) => { resolveActive = res; });
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderHook(() => useMyEventState(CLIENT, false));
    await waitFor(() => expect(capturedSignal).toBeDefined());

    unmount();
    expect(capturedSignal.aborted).toBe(true);

    await act(async () => {
      resolveActive({ id: 'evt-1', version: 1 });
      await Promise.resolve();
    });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('useMyEventState — mutaciones reemplazan el estado con la respuesta canónica', () => {
  test('13. una mutación exitosa reemplaza el evento con la respuesta canónica completa (no hace merge)', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1, adults_count: 10 });

    const updated = { id: 'evt-1', version: 2, adults_count: 40 }; // sin `items`, a propósito
    myEventService.updateEvent.mockResolvedValue(updated);

    await act(async () => {
      await result.current.updateEvent({ adults_count: 40 }, 1);
    });

    expect(result.current.event).toEqual(updated);
  });

  test('14. pasa la version exacta que el caller indicó (estrategia elegida: explícita, nunca leída sola del estado)', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 7 });
    myEventService.updateEvent.mockResolvedValue({ id: 'evt-1', version: 8 });

    await act(async () => {
      await result.current.updateEvent({ adults_count: 1 }, 7);
    });

    expect(myEventService.updateEvent).toHaveBeenCalledWith('evt-1', { adults_count: 1 }, 7);
  });

  test('15. no incrementa version localmente — usa exactamente lo que devuelve el backend', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });
    // El mock "salta" a version 9 a propósito: si el hook incrementara solo,
    // esperaría 2 — nunca 9.
    myEventService.updateEvent.mockResolvedValue({ id: 'evt-1', version: 9 });

    await act(async () => {
      await result.current.updateEvent({ adults_count: 1 }, 1);
    });

    expect(result.current.event.version).toBe(9);
  });

  test('15b. replaceItem ("cambiar un servicio sin perder el resto") usa PUT vía el service y reemplaza el estado', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });
    const afterReplace = { id: 'evt-1', version: 2, items: [{ id: 'item-1', service_id: 'nuevo-servicio' }] };
    myEventService.replaceItem.mockResolvedValue(afterReplace);

    await act(async () => {
      await result.current.replaceItem('item-1', { service_id: 'nuevo-servicio' }, 1);
    });

    expect(myEventService.replaceItem).toHaveBeenCalledWith('evt-1', 'item-1', { service_id: 'nuevo-servicio' }, 1);
    expect(result.current.event).toEqual(afterReplace);
  });

  test('16. addItem/updateItem/removeItem/revalidateEvent/deleteEvent también reemplazan el estado (no solo updateEvent)', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });

    myEventService.addItem.mockResolvedValue({ id: 'evt-1', version: 2 });
    await act(async () => { await result.current.addItem({ service_id: 's1' }, 1); });
    expect(result.current.event.version).toBe(2);

    myEventService.updateItem.mockResolvedValue({ id: 'evt-1', version: 3 });
    await act(async () => { await result.current.updateItem('item-1', { extra_hours: 1 }, 2); });
    expect(result.current.event.version).toBe(3);
    expect(myEventService.updateItem).toHaveBeenCalledWith('evt-1', 'item-1', { extra_hours: 1 }, 2);

    myEventService.removeItem.mockResolvedValue({ id: 'evt-1', version: 4 });
    await act(async () => { await result.current.removeItem('item-1', 3); });
    expect(result.current.event.version).toBe(4);

    const summary = { total_items: 0, valid_count: 0, invalid_count: 0, changed_count: 0, items_by_reason: {} };
    myEventService.revalidateEvent.mockResolvedValue({ event: { id: 'evt-1', version: 5 }, summary });
    await act(async () => { await result.current.revalidateEvent(4); });
    expect(result.current.event.version).toBe(5);
    expect(result.current.lastOperation).toMatchObject({ type: 'revalidateEvent', status: 'success', summary });

    await act(async () => {
      myEventService.deleteEvent.mockResolvedValue(undefined);
      await result.current.deleteEvent(5);
    });
    expect(result.current.event).toBeNull();
  });

  test('16b. importItems (aceptar una propuesta completa) también reemplaza el estado — un solo POST', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });

    myEventService.importItems.mockResolvedValue({ id: 'evt-1', version: 2, items: [{ id: 'i1' }, { id: 'i2' }] });
    await act(async () => {
      await result.current.importItems({ items: [{ service_id: 's1' }, { service_id: 's2' }] }, 1);
    });

    expect(myEventService.importItems).toHaveBeenCalledTimes(1);
    expect(myEventService.importItems).toHaveBeenCalledWith('evt-1', { items: [{ service_id: 's1' }, { service_id: 's2' }] }, 1);
    expect(result.current.event.version).toBe(2);
    expect(result.current.event.items).toHaveLength(2);
  });

  test('16c. importItems impide doble submit (misma clave que el resto de las mutaciones)', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });

    let resolveImport;
    myEventService.importItems.mockImplementation(() => new Promise((res) => { resolveImport = res; }));

    let firstCallPromise;
    let secondCallRejection;
    await act(async () => {
      firstCallPromise = result.current.importItems({ items: [{ service_id: 's1' }] }, 1);
      try {
        await result.current.importItems({ items: [{ service_id: 's1' }] }, 1);
      } catch (err) {
        secondCallRejection = err;
      }
    });

    expect(myEventService.importItems).toHaveBeenCalledTimes(1);
    expect(secondCallRejection).toMatchObject({ code: 'OPERATION_IN_PROGRESS' });

    await act(async () => {
      resolveImport({ id: 'evt-1', version: 2, items: [{ id: 'i1' }] });
      await firstCallPromise;
    });
    expect(result.current.event.version).toBe(2);
  });

  test('17. impide doble submit de la misma operación', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });

    let resolveAdd;
    myEventService.addItem.mockImplementation(() => new Promise((res) => { resolveAdd = res; }));

    let firstCallPromise;
    let secondCallRejection;
    await act(async () => {
      firstCallPromise = result.current.addItem({ service_id: 's1' }, 1);
      try {
        await result.current.addItem({ service_id: 's1' }, 1);
      } catch (err) {
        secondCallRejection = err;
      }
    });

    expect(myEventService.addItem).toHaveBeenCalledTimes(1);
    expect(secondCallRejection).toMatchObject({ code: 'OPERATION_IN_PROGRESS' });

    await act(async () => {
      resolveAdd({ id: 'evt-1', version: 2 });
      await firstCallPromise;
    });
    expect(result.current.event.version).toBe(2);
  });
});

describe('useMyEventState — conflicto de versión (409 DRAFT_VERSION_CONFLICT)', () => {
  test('18. no reintenta la mutación que falló', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });
    myEventService.updateEvent.mockRejectedValue(new ApiError('conflicto', 409, 'DRAFT_VERSION_CONFLICT'));
    myEventService.getEvent.mockResolvedValue({ id: 'evt-1', version: 5 });

    await act(async () => {
      await expect(result.current.updateEvent({ adults_count: 1 }, 1))
        .rejects.toMatchObject({ code: 'DRAFT_VERSION_CONFLICT' });
    });

    expect(myEventService.updateEvent).toHaveBeenCalledTimes(1);
  });

  test('19. hace un único GET fresco del evento afectado', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });
    myEventService.updateEvent.mockRejectedValue(new ApiError('conflicto', 409, 'DRAFT_VERSION_CONFLICT'));
    myEventService.getEvent.mockResolvedValue({ id: 'evt-1', version: 5 });

    await act(async () => {
      await expect(result.current.updateEvent({ adults_count: 1 }, 1)).rejects.toBeTruthy();
    });

    expect(myEventService.getEvent).toHaveBeenCalledTimes(1);
    expect(myEventService.getEvent).toHaveBeenCalledWith('evt-1');
  });

  test('20. reemplaza el evento con el estado recuperado por el refresh', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });
    myEventService.updateEvent.mockRejectedValue(new ApiError('conflicto', 409, 'DRAFT_VERSION_CONFLICT'));
    const fresh = { id: 'evt-1', version: 5, adults_count: 99 };
    myEventService.getEvent.mockResolvedValue(fresh);

    await act(async () => {
      await expect(result.current.updateEvent({ adults_count: 1 }, 1)).rejects.toBeTruthy();
    });

    expect(result.current.event).toEqual(fresh);
  });

  test('21. conserva información del conflicto para la futura UI', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });
    myEventService.updateEvent.mockRejectedValue(new ApiError('conflicto', 409, 'DRAFT_VERSION_CONFLICT'));
    myEventService.getEvent.mockResolvedValue({ id: 'evt-1', version: 5 });

    await act(async () => {
      await expect(result.current.updateEvent({ adults_count: 1 }, 1)).rejects.toBeTruthy();
    });

    expect(result.current.conflict).toMatchObject({
      type: 'DRAFT_VERSION_CONFLICT',
      operation: 'updateEvent',
      refreshed: true,
      refreshError: null,
    });
    expect(result.current.conflict.message).toMatch(/otra pestaña/i);

    act(() => { result.current.dismissConflict(); });
    expect(result.current.conflict).toBeNull();
  });

  test('22. si también falla el refresh posterior, expone ambos resultados sin loop', async () => {
    const { result } = await renderAuthenticatedWithEvent({ id: 'evt-1', version: 1 });
    myEventService.updateEvent.mockRejectedValue(new ApiError('conflicto', 409, 'DRAFT_VERSION_CONFLICT'));
    const refreshError = new ApiError('no se pudo refrescar', 500, 'SERVER_ERROR');
    myEventService.getEvent.mockRejectedValue(refreshError);

    await act(async () => {
      await expect(result.current.updateEvent({ adults_count: 1 }, 1))
        .rejects.toMatchObject({ code: 'DRAFT_VERSION_CONFLICT' });
    });

    expect(result.current.conflict).toMatchObject({ refreshed: false, refreshError });
    expect(myEventService.updateEvent).toHaveBeenCalledTimes(1);
    expect(myEventService.getEvent).toHaveBeenCalledTimes(1);
    // El evento previo (última fotografía conocida) no se pierde ni se corrompe.
    expect(result.current.event).toEqual({ id: 'evt-1', version: 1 });
  });
});
