// Cubre específicamente que getPublicAvailability manda packageId/extraHours
// (antes no los mandaba — ver auditoría previa a esta tarea) además de
// date/time/guestCount.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { availabilityService } from '../availabilityService';

const ORIGINAL_FETCH = global.fetch;

describe('availabilityService.getPublicAvailability', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({ success: true, data: { available: true, date: '2027-01-01', reasonCode: null, reasonMessage: null } }),
    });
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  test('manda date, time, guestCount, packageId y extraHours en la query', async () => {
    await availabilityService.getPublicAvailability('service-1', {
      date: '2027-01-01', time: '20:00', guestCount: 50, packageId: 'pkg-1', extraHours: 2,
    });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('/services/service-1/availability');
    expect(url).toContain('date=2027-01-01');
    expect(url).toContain('time=20%3A00');
    expect(url).toContain('guestCount=50');
    expect(url).toContain('packageId=pkg-1');
    expect(url).toContain('extraHours=2');
  });

  test('sin packageId/extraHours (servicio sin paquete de duración fija): no los manda', async () => {
    await availabilityService.getPublicAvailability('service-1', { date: '2027-01-01', guestCount: 10 });
    const [url] = global.fetch.mock.calls[0];
    expect(url).not.toContain('packageId');
    expect(url).not.toContain('extraHours');
  });
});

describe('availabilityService.quotePreview', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({ success: true, data: { available: true, quote_snapshot: { amounts: { estimated_total: 45000 } } } }),
    });
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  test('llama a POST /services/:id/quote-preview con el body event/item tal cual', async () => {
    const payload = { event: { event_date: '2027-01-01', adults_count: 40 }, item: { package_id: 'pkg-2' } };
    await availabilityService.quotePreview('service-1', payload);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/services/service-1/quote-preview');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  test('devuelve la respuesta tal cual (available/quote_snapshot), sin recalcular nada', async () => {
    const result = await availabilityService.quotePreview('service-1', { event: {}, item: {} });
    expect(result.available).toBe(true);
    expect(result.quote_snapshot.amounts.estimated_total).toBe(45000);
  });
});
