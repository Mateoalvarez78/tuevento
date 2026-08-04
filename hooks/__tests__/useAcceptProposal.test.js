// @vitest-environment jsdom
//
// Cubre "elegir una propuesta del generador": aplicar datos generales + TODOS
// los servicios de la propuesta en una única mutación atómica (nunca una
// secuencia de addItem — una propuesta se guarda entera o no se guarda
// nada), la intención pre-login (nunca se guarda locationToken), la
// reanudación automática tras volver del login (una sola vez), doble submit,
// y que un 409 no dispare ningún reintento automático.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useAcceptProposal } from '../useAcceptProposal';
import { readPendingIntent, clearPendingIntent } from '../../lib/pendingIntent';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const CLIENT = { id: 'c1', role: 'client' };

function makeDeps(overrides = {}) {
  return {
    user: null,
    event: null,
    myEventStatus: 'ready',
    createEvent: vi.fn(),
    importItems: vi.fn(),
    router: { push: vi.fn() },
    ...overrides,
  };
}

const CATEGORIES = [
  { categoryId: 'cat-1', categoryName: 'Catering', serviceId: 'svc-1', packageId: 'pkg-1' },
  { categoryId: 'cat-2', categoryName: 'DJ', serviceId: 'svc-2', packageId: null },
];
const EVENT_DATA = { eventType: 'Cumpleaños', budget: '100000', adults: '40', children: '0', eventDate: '2027-01-01', location: null };

describe('useAcceptProposal — sin sesión', () => {
  test('guarda la intención mínima (nunca location_token) y redirige a login, no muta nada', async () => {
    const deps = makeDeps({ user: null });
    const { result } = renderHook(() => useAcceptProposal(deps));

    let outcome;
    await act(async () => {
      outcome = await result.current.acceptProposal({ eventData: EVENT_DATA, profile: 'equilibrada', categories: CATEGORIES });
    });

    expect(outcome).toBeNull();
    expect(deps.createEvent).not.toHaveBeenCalled();
    expect(deps.importItems).not.toHaveBeenCalled();
    expect(deps.router.push).toHaveBeenCalledWith(expect.stringContaining('/login?next='));

    const saved = readPendingIntent();
    expect(saved.type).toBe('accept_proposal');
    expect(saved.categories).toHaveLength(2);
    expect(saved).not.toHaveProperty('eventData.location.locationToken');
    expect(JSON.stringify(saved)).not.toContain('locationToken');
  });
});

describe('useAcceptProposal — con sesión, un solo POST atómico', () => {
  test('sin borrador activo: crea uno con los datos generales y DESPUÉS importa todos los items en un único POST', async () => {
    const created = { id: 'evt-1', version: 1 };
    const imported = { id: 'evt-1', version: 2, items: [{ id: 'i1' }, { id: 'i2' }] };
    const deps = makeDeps({
      user: CLIENT,
      createEvent: vi.fn().mockResolvedValue(created),
      importItems: vi.fn().mockResolvedValue(imported),
    });
    const { result } = renderHook(() => useAcceptProposal(deps));

    let outcome;
    await act(async () => {
      outcome = await result.current.acceptProposal({ eventData: EVENT_DATA, profile: 'equilibrada', categories: CATEGORIES });
    });

    expect(deps.createEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'Cumpleaños', adults_count: 40, event_date: '2027-01-01' }));
    expect(deps.importItems).toHaveBeenCalledTimes(1); // UN solo POST, nunca uno por categoría
    expect(deps.importItems).toHaveBeenCalledWith(
      { items: [{ service_id: 'svc-1', package_id: 'pkg-1' }, { service_id: 'svc-2' }] },
      1 // version del evento recién creado
    );
    expect(outcome).toEqual(imported);
    expect(result.current.acceptStatus).toBe('done');
  });

  test('con borrador existente: un único POST manda datos generales (event_patch) + items juntos, con la version actual', async () => {
    const existing = { id: 'evt-9', version: 5 };
    const imported = { id: 'evt-9', version: 6, items: [{ id: 'i1' }] };
    const deps = makeDeps({
      user: CLIENT,
      event: existing,
      importItems: vi.fn().mockResolvedValue(imported),
    });
    const { result } = renderHook(() => useAcceptProposal(deps));

    await act(async () => {
      await result.current.acceptProposal({ eventData: EVENT_DATA, profile: 'economica', categories: [CATEGORIES[0]] });
    });

    expect(deps.createEvent).not.toHaveBeenCalled();
    expect(deps.importItems).toHaveBeenCalledTimes(1);
    expect(deps.importItems).toHaveBeenCalledWith(
      {
        event_patch: expect.objectContaining({ event_type: 'Cumpleaños', adults_count: 40 }),
        items: [{ service_id: 'svc-1', package_id: 'pkg-1' }],
      },
      5
    );
  });

  test('si un componente no está disponible, la propuesta completa se rechaza — no queda "parcialmente" guardada', async () => {
    const deps = makeDeps({
      user: CLIENT,
      createEvent: vi.fn().mockResolvedValue({ id: 'evt-1', version: 1 }),
      importItems: vi.fn().mockRejectedValue(Object.assign(new Error('no disponible'), { code: 'AVAILABILITY_CONFLICT' })),
    });
    const { result } = renderHook(() => useAcceptProposal(deps));

    await act(async () => {
      await expect(result.current.acceptProposal({ eventData: EVENT_DATA, profile: 'equilibrada', categories: CATEGORIES }))
        .rejects.toMatchObject({ code: 'AVAILABILITY_CONFLICT' });
    });

    expect(deps.importItems).toHaveBeenCalledTimes(1); // un solo intento, nada de "los que sí" se agregaron por separado
    expect(result.current.acceptStatus).toBe('error');
    expect(result.current.error).toMatchObject({ code: 'AVAILABILITY_CONFLICT' });
  });

  test('conflicto de versión (409): se propaga tal cual, SIN ningún reintento automático', async () => {
    const existing = { id: 'evt-9', version: 5 };
    const conflictErr = Object.assign(new Error('conflicto'), { code: 'DRAFT_VERSION_CONFLICT', status: 409 });
    const deps = makeDeps({
      user: CLIENT,
      event: existing,
      importItems: vi.fn().mockRejectedValue(conflictErr),
    });
    const { result } = renderHook(() => useAcceptProposal(deps));

    await act(async () => {
      await expect(result.current.acceptProposal({ eventData: EVENT_DATA, profile: 'equilibrada', categories: CATEGORIES }))
        .rejects.toMatchObject({ code: 'DRAFT_VERSION_CONFLICT' });
    });

    expect(deps.importItems).toHaveBeenCalledTimes(1); // ni un segundo intento automático
    expect(result.current.acceptStatus).toBe('error');
  });

  test('doble submit: una segunda llamada disparada de inmediato (mismo tick) se ignora — nunca dos createEvent/importItems', async () => {
    const deps = makeDeps({
      user: CLIENT,
      event: { id: 'evt-9', version: 5 }, // rama de un solo await (importItems) — la más fácil de disparar dos veces "a la vez"
      importItems: vi.fn().mockResolvedValue({ id: 'evt-9', version: 6, items: [] }),
    });
    const { result } = renderHook(() => useAcceptProposal(deps));

    let firstPromise;
    let secondOutcome;
    await act(async () => {
      // Sin ningún await entre medio: la guarda (`busyRef`, seteada de forma
      // síncrona antes del primer await de runAccept) debe activarse ya en
      // esta segunda llamada, todavía en el mismo tick que la primera.
      firstPromise = result.current.acceptProposal({ eventData: EVENT_DATA, profile: 'equilibrada', categories: CATEGORIES });
      secondOutcome = await result.current.acceptProposal({ eventData: EVENT_DATA, profile: 'equilibrada', categories: CATEGORIES });
      await firstPromise;
    });

    expect(secondOutcome).toBeNull(); // ignorada, no un segundo intento
    expect(deps.importItems).toHaveBeenCalledTimes(1);
    expect(result.current.acceptStatus).toBe('done');
  });
});

describe('useAcceptProposal — reanudación tras login', () => {
  test('con intención pendiente + sesión + borrador ya resuelto: ejecuta automáticamente (un solo POST) y navega a /mi-evento', async () => {
    const { savePendingIntent } = await import('../../lib/pendingIntent');
    savePendingIntent({ type: 'accept_proposal', eventData: EVENT_DATA, categories: CATEGORIES });

    const deps = makeDeps({
      user: null, myEventStatus: 'loading',
      createEvent: vi.fn().mockResolvedValue({ id: 'evt-1', version: 1 }),
      importItems: vi.fn().mockResolvedValue({ id: 'evt-1', version: 2, items: [] }),
    });
    const { result, rerender } = renderHook((props) => useAcceptProposal(props), { initialProps: deps });

    // Todavía no hay sesión ni terminó de cargar el borrador — no debe ejecutar nada.
    expect(deps.createEvent).not.toHaveBeenCalled();

    rerender({ ...deps, user: CLIENT, myEventStatus: 'ready' });

    await waitFor(() => expect(deps.createEvent).toHaveBeenCalled());
    await waitFor(() => expect(deps.importItems).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(deps.router.push).toHaveBeenCalledWith('/mi-evento'));
    expect(readPendingIntent()).toBeNull(); // se consumió, no queda pegada
  });

  test('no reanuda mientras myEventStatus sigue "loading" (evitar crear un draft duplicado)', async () => {
    const { savePendingIntent } = await import('../../lib/pendingIntent');
    savePendingIntent({ type: 'accept_proposal', eventData: EVENT_DATA, categories: CATEGORIES });

    const deps = makeDeps({ user: CLIENT, myEventStatus: 'loading', createEvent: vi.fn() });
    renderHook((props) => useAcceptProposal(props), { initialProps: deps });

    await act(async () => { await Promise.resolve(); });
    expect(deps.createEvent).not.toHaveBeenCalled();
    expect(readPendingIntent()).not.toBeNull(); // sigue guardada, todavía no se consumió
  });

  test('sin intención pendiente: no hace nada raro al montar con sesión ya activa', async () => {
    clearPendingIntent();
    const deps = makeDeps({ user: CLIENT, myEventStatus: 'ready' });
    renderHook((props) => useAcceptProposal(props), { initialProps: deps });
    await act(async () => { await Promise.resolve(); });
    expect(deps.createEvent).not.toHaveBeenCalled();
  });

  test('reanudación se ejecuta EXACTAMENTE una vez incluso si el componente vuelve a renderizar', async () => {
    const { savePendingIntent } = await import('../../lib/pendingIntent');
    savePendingIntent({ type: 'accept_proposal', eventData: EVENT_DATA, categories: CATEGORIES });

    const deps = makeDeps({
      user: CLIENT, myEventStatus: 'ready',
      createEvent: vi.fn().mockResolvedValue({ id: 'evt-1', version: 1 }),
      importItems: vi.fn().mockResolvedValue({ id: 'evt-1', version: 2, items: [] }),
    });
    const { rerender } = renderHook((props) => useAcceptProposal(props), { initialProps: deps });

    await waitFor(() => expect(deps.importItems).toHaveBeenCalledTimes(1));

    // Re-renders adicionales (mismo user/myEventStatus) no deben disparar una segunda ejecución.
    rerender({ ...deps });
    rerender({ ...deps });
    await act(async () => { await Promise.resolve(); });

    expect(deps.createEvent).toHaveBeenCalledTimes(1);
    expect(deps.importItems).toHaveBeenCalledTimes(1);
  });
});
