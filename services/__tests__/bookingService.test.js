// Mockea fetch — nunca llama al backend real. Cubre específicamente que
// bookingService.create() arma el payload de ubicación con location_token
// (nunca con placeId/lat/lng/location_source sueltos, que el backend ya no
// acepta — ver docs/SECURITY.md) y que sigue mandando packageId/extraHours.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { bookingService } from '../bookingService';

const ORIGINAL_FETCH = global.fetch;

function mockCreatedBooking(overrides = {}) {
  return {
    success: true,
    data: { id: 'booking-1', request_number: 'EN-TEST-0001', client_id: 'client-1', ...overrides },
  };
}

describe('bookingService.create', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ status: 201, ok: true, json: async () => mockCreatedBooking() });
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  test('manda location_token (nunca placeId/lat/lng/location_source sueltos) cuando hay un token válido', async () => {
    await bookingService.create({
      serviceId: 'service-1', packageId: 'pkg-1', adults: 2, children: 1, extraHours: 1,
      date: '2027-01-01', time: '20:00', eventType: 'Casamiento', message: 'Hola',
      locationDetails: {
        formattedAddress: 'Dirección real', placeId: 'place-real', lat: -34.9, lng: -56.1,
        city: 'Montevideo', department: 'Montevideo', addressComplement: 'Apto 3', accessNotes: 'Timbre 3',
        source: 'google_places', locationToken: 'signed.jwt.token', tokenExpiresAt: '2027-01-01T00:00:00.000Z',
      },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/bookings');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);

    expect(body.event_location_details).toEqual({
      location_token: 'signed.jwt.token',
      address_complement: 'Apto 3',
      access_notes: 'Timbre 3',
    });
    // Nunca deben viajar valores sueltos que el backend ya no lee para
    // ubicación — mandarlos igual no sirve de nada, pero confirmamos que el
    // cliente no los arma ni los expone en la request.
    expect(body.event_location_details).not.toHaveProperty('lat');
    expect(body.event_location_details).not.toHaveProperty('lng');
    expect(body.event_location_details).not.toHaveProperty('place_id');
    expect(body.event_location_details).not.toHaveProperty('formatted_address');
    expect(body.event_location_details).not.toHaveProperty('location_source');

    expect(body.package_id).toBe('pkg-1');
    expect(body.extra_hours).toBe(1);
    expect(body.adults_count).toBe(2);
    expect(body.children_count).toBe(1);
  });

  test('sin location_token: no arma event_location_details (el backend la exige, mejor no mandar datos a medias)', async () => {
    await bookingService.create({
      serviceId: 'service-1', adults: 2, date: '2027-01-01',
      locationDetails: { formattedAddress: 'x', lat: -34, lng: -56, placeId: 'p', source: 'google_places' },
    });
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.event_location_details).toBeUndefined();
  });

  test('propaga un 409 AVAILABILITY_CONFLICT con reasonCode', async () => {
    global.fetch.mockResolvedValue({
      status: 409, ok: false,
      json: async () => ({ success: false, message: 'No hay disponibilidad', code: 'AVAILABILITY_CONFLICT', reasonCode: 'blocked' }),
    });
    await expect(bookingService.create({
      serviceId: 'service-1', adults: 1, date: '2027-01-01',
      locationDetails: { locationToken: 't' },
    })).rejects.toMatchObject({ status: 409, code: 'AVAILABILITY_CONFLICT', reasonCode: 'blocked' });
  });
});
