// @vitest-environment jsdom
//
// "Agregar a Mi evento" desde la ficha de un servicio — un único item, con
// la misma estrategia de intención pre-login/reanudación que
// useAcceptProposal.js.
import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useAddToMyEvent } from '../useAddToMyEvent';
import { readPendingIntent, savePendingIntent, clearPendingIntent } from '../../lib/pendingIntent';

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
    updateEvent: vi.fn(),
    addItem: vi.fn(),
    router: { push: vi.fn() },
    loginNextPath: '/proveedor/svc-1',
    ...overrides,
  };
}

describe('useAddToMyEvent — sin sesión', () => {
  test('guarda la intención y redirige a login con el next correcto, no muta nada', async () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useAddToMyEvent(deps));

    let outcome;
    await act(async () => {
      outcome = await result.current.addToMyEvent({ serviceId: 'svc-1', packageId: 'pkg-1', extrasSelected: [], eventDate: '2027-02-01' });
    });

    expect(outcome).toBeNull();
    expect(deps.createEvent).not.toHaveBeenCalled();
    expect(deps.router.push).toHaveBeenCalledWith('/login?next=%2Fproveedor%2Fsvc-1');
    expect(readPendingIntent()).toMatchObject({ type: 'add_item', serviceId: 'svc-1' });
  });
});

describe('useAddToMyEvent — con sesión', () => {
  test('sin borrador: crea uno con la fecha provista, luego agrega el item con esa version', async () => {
    const deps = makeDeps({
      user: CLIENT,
      createEvent: vi.fn().mockResolvedValue({ id: 'evt-1', version: 1 }),
      addItem: vi.fn().mockResolvedValue({ id: 'evt-1', version: 2 }),
    });
    const { result } = renderHook(() => useAddToMyEvent(deps));

    await act(async () => {
      await result.current.addToMyEvent({ serviceId: 'svc-1', packageId: 'pkg-1', extrasSelected: [{ id: 'ex-1', quantity: 1 }], eventDate: '2027-02-01' });
    });

    expect(deps.createEvent).toHaveBeenCalledWith({ event_date: '2027-02-01' });
    expect(deps.addItem).toHaveBeenCalledWith({ service_id: 'svc-1', package_id: 'pkg-1', extras_selected: [{ id: 'ex-1', quantity: 1 }] }, 1);
    expect(result.current.status).toBe('done');
  });

  test('borrador existente sin fecha: la agrega con updateEvent antes de addItem', async () => {
    const deps = makeDeps({
      user: CLIENT,
      event: { id: 'evt-9', version: 3, event_date: null },
      updateEvent: vi.fn().mockResolvedValue({ id: 'evt-9', version: 4 }),
      addItem: vi.fn().mockResolvedValue({ id: 'evt-9', version: 5 }),
    });
    const { result } = renderHook(() => useAddToMyEvent(deps));

    await act(async () => {
      await result.current.addToMyEvent({ serviceId: 'svc-2', eventDate: '2027-03-01' });
    });

    expect(deps.updateEvent).toHaveBeenCalledWith({ event_date: '2027-03-01' }, 3);
    expect(deps.addItem).toHaveBeenCalledWith(expect.objectContaining({ service_id: 'svc-2' }), 4);
  });

  test('borrador existente CON fecha: no llama updateEvent, agrega directo con la version actual', async () => {
    const deps = makeDeps({
      user: CLIENT,
      event: { id: 'evt-9', version: 3, event_date: '2027-01-01' },
      addItem: vi.fn().mockResolvedValue({ id: 'evt-9', version: 4 }),
    });
    const { result } = renderHook(() => useAddToMyEvent(deps));

    await act(async () => {
      await result.current.addToMyEvent({ serviceId: 'svc-2' });
    });

    expect(deps.updateEvent).not.toHaveBeenCalled();
    expect(deps.addItem).toHaveBeenCalledWith(expect.objectContaining({ service_id: 'svc-2' }), 3);
  });

  test('AVAILABILITY_CONFLICT: status pasa a error, expone el error sin romper', async () => {
    const deps = makeDeps({
      user: CLIENT,
      event: { id: 'evt-9', version: 3, event_date: '2027-01-01' },
      addItem: vi.fn().mockRejectedValue(Object.assign(new Error('no disponible'), { code: 'AVAILABILITY_CONFLICT', status: 409 })),
    });
    const { result } = renderHook(() => useAddToMyEvent(deps));

    await act(async () => {
      await expect(result.current.addToMyEvent({ serviceId: 'svc-2' })).rejects.toThrow();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatchObject({ code: 'AVAILABILITY_CONFLICT' });
  });
});

describe('useAddToMyEvent — reanudación tras login', () => {
  test('reanuda automáticamente una vez que hay sesión y el borrador ya se resolvió', async () => {
    savePendingIntent({ type: 'add_item', serviceId: 'svc-1', packageId: null, extrasSelected: [], eventDate: '2027-02-01' });

    const deps = makeDeps({
      user: null, myEventStatus: 'loading',
      createEvent: vi.fn().mockResolvedValue({ id: 'evt-1', version: 1 }),
      addItem: vi.fn().mockResolvedValue({ id: 'evt-1', version: 2 }),
    });
    const { rerender } = renderHook((props) => useAddToMyEvent(props), { initialProps: deps });

    expect(deps.createEvent).not.toHaveBeenCalled();
    rerender({ ...deps, user: CLIENT, myEventStatus: 'ready' });

    await waitFor(() => expect(deps.addItem).toHaveBeenCalled());
    expect(readPendingIntent()).toBeNull();
  });

  test('intención de otro tipo (accept_proposal) no se confunde ni se ejecuta acá', async () => {
    savePendingIntent({ type: 'accept_proposal', eventData: {}, categories: [] });
    const deps = makeDeps({ user: CLIENT, myEventStatus: 'ready' });
    renderHook((props) => useAddToMyEvent(props), { initialProps: deps });

    await act(async () => { await Promise.resolve(); });
    expect(deps.createEvent).not.toHaveBeenCalled();
    expect(readPendingIntent()).not.toBeNull(); // la deja intacta para quien sí la sepa leer
    clearPendingIntent();
  });
});
