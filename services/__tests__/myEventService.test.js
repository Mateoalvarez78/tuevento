// Cubre el contrato HTTP real de "Mi evento" (/me/events) — verbo, ruta,
// body exacto, y que la respuesta se propaga sin transformar (en especial
// quote_snapshot/selection_snapshot y el `data:null` explícito de /active).
// Mismo patrón que services/__tests__/availabilityService.test.js: mockea
// global.fetch, sin tocar la red real.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { myEventService, classifyMyEventError } from '../myEventService';
import { ApiError } from '../api';

const ORIGINAL_FETCH = global.fetch;

function mockFetchOnce({ status = 200, ok = true, body = {} }) {
  global.fetch = vi.fn().mockResolvedValue({
    status,
    ok,
    json: async () => body,
  });
}

const EVENT_ID = '11111111-1111-1111-1111-111111111111';
const ITEM_ID = '22222222-2222-2222-2222-222222222222';
const SERVICE_ID = '33333333-3333-3333-3333-333333333333';

describe('myEventService', () => {
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  describe('getActiveDraft — GET /me/events/active', () => {
    test('devuelve el evento completo tal cual, incluyendo quote_snapshot/selection_snapshot sin transformar', async () => {
      const rawEvent = {
        id: EVENT_ID, status: 'draft', is_active: true, version: 3,
        items: [{
          id: ITEM_ID, service_id: SERVICE_ID, validity_status: 'valid',
          quote_snapshot: { schema_version: 1, amounts: { estimated_total: 12345.5 } },
          selection_snapshot: { schema_version: 1, service_title: 'Catering' },
        }],
      };
      mockFetchOnce({ body: { success: true, data: rawEvent } });

      const result = await myEventService.getActiveDraft();

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('/me/events/active');
      expect(options.method ?? 'GET').toBe('GET');
      // Byte-a-byte: ninguna clave recortada/renombrada, ningún monto recalculado.
      expect(result).toEqual(rawEvent);
      expect(result.items[0].quote_snapshot).toEqual(rawEvent.items[0].quote_snapshot);
      expect(result.items[0].quote_snapshot.amounts.estimated_total).toBe(12345.5);
    });

    test('conserva data:null explícito (no lo convierte en undefined/[]/{})', async () => {
      mockFetchOnce({ body: { success: true, data: null } });
      const result = await myEventService.getActiveDraft();
      expect(result).toBeNull();
    });

    test('pasa el AbortSignal al fetch subyacente', async () => {
      mockFetchOnce({ body: { success: true, data: null } });
      const controller = new AbortController();
      await myEventService.getActiveDraft({ signal: controller.signal });
      const [, options] = global.fetch.mock.calls[0];
      expect(options.signal).toBe(controller.signal);
    });
  });

  describe('getEvent — GET /me/events/:eventId', () => {
    test('usa la ruta con el id, sin body', async () => {
      mockFetchOnce({ body: { success: true, data: { id: EVENT_ID } } });
      await myEventService.getEvent(EVENT_ID);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain(`/me/events/${EVENT_ID}`);
      expect(url).not.toContain('/active');
      expect(options.body).toBeUndefined();
    });
  });

  describe('createEvent — POST /me/events', () => {
    test('manda exactamente el payload recibido, sin version', async () => {
      mockFetchOnce({ status: 201, body: { success: true, data: { id: EVENT_ID, version: 1 } } });
      await myEventService.createEvent({ event_type: 'Cumpleaños', adults_count: 10 });
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('/me/events');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ event_type: 'Cumpleaños', adults_count: 10 });
      expect(body.version).toBeUndefined();
    });
  });

  describe('updateEvent — PATCH /me/events/:eventId', () => {
    test('manda version junto a los campos generales', async () => {
      mockFetchOnce({ body: { success: true, data: { id: EVENT_ID, version: 2 } } });
      await myEventService.updateEvent(EVENT_ID, { adults_count: 20 }, 1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain(`/me/events/${EVENT_ID}`);
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ adults_count: 20, version: 1 });
    });

    test('sin expectedVersion: rechaza antes de llamar a fetch (VERSION_REQUIRED)', async () => {
      global.fetch = vi.fn();
      await expect(myEventService.updateEvent(EVENT_ID, { adults_count: 20 }))
        .rejects.toMatchObject({ code: 'VERSION_REQUIRED', status: 0 });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('deleteEvent — DELETE /me/events/:eventId', () => {
    test('manda {version} como body de un DELETE', async () => {
      mockFetchOnce({ body: { success: true, message: 'Event deleted' } });
      const result = await myEventService.deleteEvent(EVENT_ID, 4);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain(`/me/events/${EVENT_ID}`);
      expect(options.method).toBe('DELETE');
      expect(JSON.parse(options.body)).toEqual({ version: 4 });
      // El backend no manda `data` en este endpoint — se propaga undefined, no un objeto inventado.
      expect(result).toBeUndefined();
    });
  });

  describe('addItem — POST /me/events/:eventId/items', () => {
    test('manda service_id + payload + version', async () => {
      mockFetchOnce({ status: 201, body: { success: true, data: { id: EVENT_ID, version: 2 } } });
      await myEventService.addItem(EVENT_ID, { service_id: SERVICE_ID, package_id: 'pkg-1' }, 1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain(`/me/events/${EVENT_ID}/items`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ service_id: SERVICE_ID, package_id: 'pkg-1', version: 1 });
    });

    test('sin service_id: rechaza antes de llamar a fetch (SERVICE_ID_REQUIRED)', async () => {
      global.fetch = vi.fn();
      await expect(myEventService.addItem(EVENT_ID, { package_id: 'pkg-1' }, 1))
        .rejects.toMatchObject({ code: 'SERVICE_ID_REQUIRED', status: 0 });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('sin expectedVersion (aunque service_id venga bien): rechaza antes de llamar a fetch', async () => {
      global.fetch = vi.fn();
      await expect(myEventService.addItem(EVENT_ID, { service_id: SERVICE_ID }))
        .rejects.toMatchObject({ code: 'VERSION_REQUIRED', status: 0 });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('importItems — POST /me/events/:eventId/items/import (aceptar una propuesta completa)', () => {
    test('manda items + version en un único POST', async () => {
      mockFetchOnce({ status: 201, body: { success: true, data: { id: EVENT_ID, version: 2, items: [{ id: ITEM_ID }] } } });
      const payload = { items: [{ service_id: SERVICE_ID, package_id: 'pkg-1' }, { service_id: 'svc-2' }] };
      await myEventService.importItems(EVENT_ID, payload, 1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain(`/me/events/${EVENT_ID}/items/import`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ ...payload, version: 1 });
    });

    test('incluye event_patch cuando viene, sin alterarlo', async () => {
      mockFetchOnce({ status: 201, body: { success: true, data: { id: EVENT_ID, version: 2, items: [] } } });
      const payload = { event_patch: { adults_count: 40 }, items: [{ service_id: SERVICE_ID }] };
      await myEventService.importItems(EVENT_ID, payload, 3);
      const [, options] = global.fetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ event_patch: { adults_count: 40 }, items: [{ service_id: SERVICE_ID }], version: 3 });
    });

    test('sin items (ausente): rechaza antes de llamar a fetch (ITEMS_REQUIRED)', async () => {
      global.fetch = vi.fn();
      await expect(myEventService.importItems(EVENT_ID, {}, 1))
        .rejects.toMatchObject({ code: 'ITEMS_REQUIRED', status: 0 });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('con items vacío: rechaza antes de llamar a fetch (ITEMS_REQUIRED)', async () => {
      global.fetch = vi.fn();
      await expect(myEventService.importItems(EVENT_ID, { items: [] }, 1))
        .rejects.toMatchObject({ code: 'ITEMS_REQUIRED', status: 0 });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('con un item sin service_id: rechaza antes de llamar a fetch (SERVICE_ID_REQUIRED)', async () => {
      global.fetch = vi.fn();
      await expect(myEventService.importItems(EVENT_ID, { items: [{ service_id: SERVICE_ID }, { package_id: 'pkg-1' }] }, 1))
        .rejects.toMatchObject({ code: 'SERVICE_ID_REQUIRED', status: 0 });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('sin expectedVersion: rechaza antes de llamar a fetch (VERSION_REQUIRED)', async () => {
      global.fetch = vi.fn();
      await expect(myEventService.importItems(EVENT_ID, { items: [{ service_id: SERVICE_ID }] }))
        .rejects.toMatchObject({ code: 'VERSION_REQUIRED', status: 0 });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('409 AVAILABILITY_CONFLICT del backend se propaga con reasonCode, se clasifica como api', async () => {
      mockFetchOnce({ status: 409, ok: false, body: { success: false, message: 'No disponible', code: 'AVAILABILITY_CONFLICT', reasonCode: 'fully_booked' } });
      let caught;
      try { await myEventService.importItems(EVENT_ID, { items: [{ service_id: SERVICE_ID }] }, 1); } catch (err) { caught = err; }
      expect(caught.status).toBe(409);
      expect(caught.reasonCode).toBe('fully_booked');
      expect(classifyMyEventError(caught)).toMatchObject({ kind: 'api', status: 409, code: 'AVAILABILITY_CONFLICT', reasonCode: 'fully_booked' });
    });
  });

  describe('updateItem — PATCH /me/events/:eventId/items/:itemId', () => {
    test('usa la ruta con eventId+itemId y manda version', async () => {
      mockFetchOnce({ body: { success: true, data: { id: EVENT_ID, version: 3 } } });
      await myEventService.updateItem(EVENT_ID, ITEM_ID, { extra_hours: 2 }, 2);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain(`/me/events/${EVENT_ID}/items/${ITEM_ID}`);
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ extra_hours: 2, version: 2 });
    });
  });

  describe('replaceItem — PUT /me/events/:eventId/items/:itemId', () => {
    test('usa PUT (no PATCH) en la misma ruta del item, manda service_id + version', async () => {
      mockFetchOnce({ body: { success: true, data: { id: EVENT_ID, version: 6 } } });
      await myEventService.replaceItem(EVENT_ID, ITEM_ID, { service_id: SERVICE_ID, package_id: 'pkg-2' }, 5);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain(`/me/events/${EVENT_ID}/items/${ITEM_ID}`);
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual({ service_id: SERVICE_ID, package_id: 'pkg-2', version: 5 });
    });

    test('sin service_id: rechaza antes de llamar a fetch (SERVICE_ID_REQUIRED) — "cambiar" siempre necesita el nuevo servicio', async () => {
      global.fetch = vi.fn();
      await expect(myEventService.replaceItem(EVENT_ID, ITEM_ID, { package_id: 'pkg-2' }, 5))
        .rejects.toMatchObject({ code: 'SERVICE_ID_REQUIRED', status: 0 });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('removeItem — DELETE /me/events/:eventId/items/:itemId', () => {
    test('manda {version} como body de un DELETE a la ruta del item', async () => {
      mockFetchOnce({ body: { success: true, data: { id: EVENT_ID, version: 4 } } });
      await myEventService.removeItem(EVENT_ID, ITEM_ID, 3);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain(`/me/events/${EVENT_ID}/items/${ITEM_ID}`);
      expect(options.method).toBe('DELETE');
      expect(JSON.parse(options.body)).toEqual({ version: 3 });
    });
  });

  describe('revalidateEvent — POST /me/events/:eventId/revalidate', () => {
    test('conserva el shape distinto {event, summary} tal cual, sin aplanarlo', async () => {
      const summary = { total_items: 2, valid_count: 1, invalid_count: 1, changed_count: 1, items_by_reason: { fully_booked: 1 } };
      mockFetchOnce({ body: { success: true, data: { event: { id: EVENT_ID, version: 5 }, summary } } });
      const result = await myEventService.revalidateEvent(EVENT_ID, 4);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain(`/me/events/${EVENT_ID}/revalidate`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ version: 4 });
      expect(result).toEqual({ event: { id: EVENT_ID, version: 5 }, summary });
    });
  });

  describe('clasificación de errores', () => {
    test('409 DRAFT_VERSION_CONFLICT: se normaliza como kind api con status/code preservados', async () => {
      mockFetchOnce({ status: 409, ok: false, body: { success: false, message: 'El evento cambió', code: 'DRAFT_VERSION_CONFLICT' } });
      let caught;
      try { await myEventService.updateEvent(EVENT_ID, { adults_count: 1 }, 1); } catch (err) { caught = err; }
      expect(caught).toBeInstanceOf(ApiError);
      expect(caught.status).toBe(409);
      expect(caught.code).toBe('DRAFT_VERSION_CONFLICT');
      expect(classifyMyEventError(caught)).toEqual({ kind: 'api', status: 409, code: 'DRAFT_VERSION_CONFLICT', reasonCode: undefined, message: 'El evento cambió' });
    });

    test('409 AVAILABILITY_CONFLICT conserva reasonCode', async () => {
      mockFetchOnce({ status: 409, ok: false, body: { success: false, message: 'No disponible', code: 'AVAILABILITY_CONFLICT', reasonCode: 'fully_booked' } });
      let caught;
      try { await myEventService.addItem(EVENT_ID, { service_id: SERVICE_ID }, 1); } catch (err) { caught = err; }
      expect(caught.reasonCode).toBe('fully_booked');
      expect(classifyMyEventError(caught).reasonCode).toBe('fully_booked');
    });

    test('distingue 429 (rate limit de revalidar) de otros errores', async () => {
      mockFetchOnce({ status: 429, ok: false, body: { success: false, message: 'Demasiadas revalidaciones', code: 'REVALIDATE_RATE_LIMIT_EXCEEDED' } });
      let caught;
      try { await myEventService.revalidateEvent(EVENT_ID, 1); } catch (err) { caught = err; }
      expect(classifyMyEventError(caught)).toMatchObject({ kind: 'api', status: 429, code: 'REVALIDATE_RATE_LIMIT_EXCEEDED' });
    });

    test('error de red (fetch rechaza) se clasifica como network, no se traga', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      let caught;
      try { await myEventService.getActiveDraft(); } catch (err) { caught = err; }
      expect(caught).toBeInstanceOf(TypeError);
      expect(classifyMyEventError(caught)).toEqual({ kind: 'network', message: 'Failed to fetch' });
    });

    test('AbortError se clasifica como aborted', () => {
      const abortErr = new DOMException('Aborted', 'AbortError');
      expect(classifyMyEventError(abortErr)).toEqual({ kind: 'aborted', message: abortErr.message });
    });

    test('una guarda local (SERVICE_ID_REQUIRED) se clasifica como client_validation, no como api', async () => {
      let caught;
      try { await myEventService.addItem(EVENT_ID, {}, 1); } catch (err) { caught = err; }
      expect(classifyMyEventError(caught)).toEqual({ kind: 'client_validation', code: 'SERVICE_ID_REQUIRED', message: expect.any(String) });
    });
  });
});
