// El header X-Client-Platform tiene que salir de la CAPA COMÚN, no de cada
// servicio: un endpoint que se olvidara de mandarlo caería, del lado del
// backend, al conjunto de modelos más restrictivo y rompería una
// contratación válida (ver src/utils/clientChannel.js del backend).
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { api, CLIENT_PLATFORM } from '../api';

const HEADER = 'X-Client-Platform';
let fetchMock;

const okResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true, data: {} }),
});

const headersOf = (call) => call[1].headers;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(okResponse());
  global.fetch = fetchMock;
  if (typeof window !== 'undefined') window.localStorage?.clear?.();
});

afterEach(() => { vi.restoreAllMocks(); });

describe('X-Client-Platform desde la capa HTTP común', () => {
  test('el canal declarado por esta app es "web"', () => {
    expect(CLIENT_PLATFORM).toBe('web');
  });

  test('GET lo incluye', async () => {
    await api.get('/services');
    expect(headersOf(fetchMock.mock.calls[0])[HEADER]).toBe('web');
  });

  test('POST lo incluye', async () => {
    await api.post('/bookings', { a: 1 });
    expect(headersOf(fetchMock.mock.calls[0])[HEADER]).toBe('web');
  });

  test('PUT y PATCH lo incluyen', async () => {
    await api.put('/services/1', { a: 1 });
    await api.patch('/services/1/status', { a: 1 });
    expect(headersOf(fetchMock.mock.calls[0])[HEADER]).toBe('web');
    expect(headersOf(fetchMock.mock.calls[1])[HEADER]).toBe('web');
  });

  test('DELETE lo incluye', async () => {
    await api.delete('/services/1');
    expect(headersOf(fetchMock.mock.calls[0])[HEADER]).toBe('web');
  });

  test('va en TODA petición, sin que cada servicio tenga que acordarse', async () => {
    await api.get('/a');
    await api.get('/b');
    await api.post('/c', {});
    fetchMock.mock.calls.forEach((call) => {
      expect(headersOf(call)[HEADER]).toBe('web');
    });
  });

  test('no pisa headers explícitos del caller ni rompe Content-Type', async () => {
    await api.post('/x', { a: 1 });
    const h = headersOf(fetchMock.mock.calls[0]);
    expect(h['Content-Type']).toBe('application/json');
    expect(h[HEADER]).toBe('web');
  });
});
