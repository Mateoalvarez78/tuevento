// Proveedor 360° (Fase A) — providerService.admin: listado paginado real
// (antes devolvía un array plano, sin pagination), resumen de KPIs, reservas
// por proveedor, y el cálculo de tasas de aceptación/cancelación en
// mapAdminProvider. Mockea fetch directamente, mismo criterio que
// bookingService.test.js — nunca llama al backend real.
import { describe, test, expect, vi, afterEach } from 'vitest';
import { providerService, mapAdminProvider } from '../providerService';

const ORIGINAL_FETCH = global.fetch;

function mockFetchOnce(data) {
  global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => data });
}

describe('providerService.admin.getAll — Proveedor 360° (Fase A)', () => {
  afterEach(() => { global.fetch = ORIGINAL_FETCH; vi.restoreAllMocks(); });

  test('devuelve {data, pagination} (ya no un array plano)', async () => {
    mockFetchOnce({
      success: true,
      data: [{ id: 'p1', business_name: 'Delicias del Sur' }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    const result = await providerService.admin.getAll({});
    expect(result.pagination).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].businessName).toBe('Delicias del Sur');
  });

  test('arma la URL con todos los filtros nuevos de Fase A', async () => {
    mockFetchOnce({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } });
    await providerService.admin.getAll({
      status: 'active', verified: 'true', city: 'Montevideo', category: 'catering',
      hasPublishedServices: 'true', dateFrom: '2026-01-01', dateTo: '2026-06-30',
      hasBookings: 'true', minRating: '4', sort: 'revenue_desc', page: 2, limit: 20,
    });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('/admin/providers?');
    ['status=active', 'verified=true', 'city=Montevideo', 'category=catering',
     'hasPublishedServices=true', 'dateFrom=2026-01-01', 'dateTo=2026-06-30',
     'hasBookings=true', 'minRating=4', 'sort=revenue_desc', 'page=2', 'limit=20',
    ].forEach((frag) => expect(url).toContain(frag));
  });

  test('un fallo del backend no rompe silenciosamente — propaga el error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 500, ok: false, json: async () => ({ success: false, message: 'boom' }) });
    await expect(providerService.admin.getAll({})).rejects.toMatchObject({ status: 500 });
  });
});

describe('providerService.admin.getSummary / getBookings — Proveedor 360° (Fase A)', () => {
  afterEach(() => { global.fetch = ORIGINAL_FETCH; vi.restoreAllMocks(); });

  test('getSummary pega a /admin/providers/summary', async () => {
    mockFetchOnce({ success: true, data: { total: 10 } });
    const summary = await providerService.admin.getSummary({ dateFrom: '2026-01-01' });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('/admin/providers/summary?dateFrom=2026-01-01');
    expect(summary).toEqual({ total: 10 });
  });

  test('getBookings pega a /admin/providers/:id/bookings y mapea las filas igual que el listado global', async () => {
    mockFetchOnce({
      success: true,
      data: [{ id: 'b1', request_number: 'EN-0001', status: 'accepted', total_amount: '1000.00', commission_amount: '80.00', provider_net: '920.00' }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      stats: { total: 1, accepted: 1 },
    });
    const result = await providerService.admin.getBookings('provider-1', { status: 'accepted' });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('/admin/providers/provider-1/bookings?status=accepted');
    expect(result.data[0].requestNumber).toBe('EN-0001');
    expect(result.data[0].status).toBe('confirmed'); // mismo mapeo accepted→confirmed que bookingAdminService
    expect(result.data[0].total).toBe(1000);
    expect(result.stats).toEqual({ total: 1, accepted: 1 });
  });
});

describe('mapAdminProvider — agregados y tasas de Proveedor 360° (Fase A)', () => {
  test('calcula acceptanceRate/cancellationRate a partir de los conteos atómicos', () => {
    const p = mapAdminProvider({
      id: 'p1', business_name: 'X',
      bookings_pending: '1', bookings_accepted: '3', bookings_completed: '5', bookings_cancelled: '2', bookings_rejected: '1',
      gross_amount: '10000.00', commission_amount: '800.00', provider_net_amount: '9200.00',
    });
    // decididas = accepted+completed+rejected = 9; aceptación = (3+5)/9
    expect(p.acceptanceRate).toBeCloseTo(8 / 9);
    // cancelación = cancelled / total(1+3+5+2+1=12) = 2/12
    expect(p.cancellationRate).toBeCloseTo(2 / 12);
    expect(p.bookingsActive).toBe(4); // pending+accepted
    expect(p.bookingsCancelledRejected).toBe(3); // cancelled+rejected
    expect(p.grossAmount).toBe(10000);
    expect(p.commissionAmount).toBe(800);
    expect(p.providerNetAmount).toBe(9200);
  });

  test('un proveedor sin ninguna reserva no divide por cero — tasas en null, no NaN/Infinity', () => {
    const p = mapAdminProvider({ id: 'p2', business_name: 'Nuevo' });
    expect(p.acceptanceRate).toBeNull();
    expect(p.cancellationRate).toBeNull();
    expect(p.bookingsActive).toBe(0);
    expect(p.grossAmount).toBe(0);
    expect(Number.isNaN(p.acceptanceRate)).toBe(false);
  });

  test('un proveedor con reservas pero ninguna decidida (todas pending) también da acceptanceRate null', () => {
    const p = mapAdminProvider({ id: 'p3', bookings_pending: '5', bookings_accepted: '0', bookings_completed: '0', bookings_rejected: '0', bookings_cancelled: '0' });
    expect(p.acceptanceRate).toBeNull();
    expect(p.bookingsActive).toBe(5);
  });

  test('lastActivityAt toma la fecha más reciente entre última reserva/actualización de servicio/updated_at', () => {
    const p = mapAdminProvider({
      id: 'p4',
      last_booking_at: '2026-07-20T10:00:00.000Z',
      last_service_update_at: '2026-07-25T10:00:00.000Z',
      updated_at: '2026-07-10T10:00:00.000Z',
    });
    expect(p.lastActivityAt).toBe('2026-07-25T10:00:00.000Z');
  });

  test('sin ninguna actividad registrada, cae a created_at (nunca undefined)', () => {
    const p = mapAdminProvider({ id: 'p5', created_at: '2026-01-01T00:00:00.000Z' });
    expect(p.lastActivityAt).toBe('2026-01-01T00:00:00.000Z');
  });

  test('mapea upcomingBookings del detalle (upcoming_bookings) a camelCase', () => {
    const p = mapAdminProvider({
      id: 'p6',
      upcoming_bookings: [{ id: 'b1', request_number: 'EN-1', event_date: '2026-08-01', event_time: '20:00', service_title: 'Catering', client_name: 'Ana' }],
    });
    expect(p.upcomingBookings).toEqual([{ id: 'b1', requestNumber: 'EN-1', eventDate: '2026-08-01', eventTime: '20:00', serviceTitle: 'Catering', clientName: 'Ana' }]);
  });
});
