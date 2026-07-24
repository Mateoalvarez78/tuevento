// Mockea fetch por completo — nunca llama al backend real ni a Google.
// Cubre el DTO que arma locationsService a partir de la respuesta del proxy
// backend (/locations/autocomplete, /locations/places/:id).
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { locationsService, createLocationSessionToken } from '../locationsService';

const ORIGINAL_FETCH = global.fetch;

describe('locationsService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  describe('createLocationSessionToken', () => {
    test('devuelve un string no vacío y distinto en cada llamada', () => {
      const a = createLocationSessionToken();
      const b = createLocationSessionToken();
      expect(typeof a).toBe('string');
      expect(a.length).toBeGreaterThan(0);
      expect(a).not.toBe(b);
    });
  });

  describe('autocomplete', () => {
    test('mapea las sugerencias del backend al DTO esperado', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          success: true,
          data: {
            suggestions: [
              { placeId: 'place-1', mainText: 'Av. 18 de Julio 1234', secondaryText: 'Montevideo, Uruguay', description: 'Av. 18 de Julio 1234, Montevideo, Uruguay' },
            ],
          },
        }),
      });

      const result = await locationsService.autocomplete('Av. 18 de Julio', 'session-1');

      expect(result).toEqual([
        { placeId: 'place-1', mainText: 'Av. 18 de Julio 1234', secondaryText: 'Montevideo, Uruguay', description: 'Av. 18 de Julio 1234, Montevideo, Uruguay' },
      ]);
      const [url] = global.fetch.mock.calls[0];
      expect(url).toContain('/locations/autocomplete');
      expect(url).toContain('input=Av.');
      expect(url).toContain('sessionToken=session-1');
    });

    test('sin sugerencias: devuelve lista vacía', async () => {
      global.fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({ success: true, data: { suggestions: [] } }) });
      const result = await locationsService.autocomplete('xyz', 'session-1');
      expect(result).toEqual([]);
    });

    test('error del backend (429 rate limit): propaga el ApiError con status y code', async () => {
      global.fetch.mockResolvedValue({
        status: 429, ok: false,
        json: async () => ({ success: false, message: 'Demasiadas búsquedas de dirección, esperá un momento', code: 'LOCATIONS_RATE_LIMIT_EXCEEDED' }),
      });
      await expect(locationsService.autocomplete('algo', 'session-1')).rejects.toMatchObject({
        status: 429, code: 'LOCATIONS_RATE_LIMIT_EXCEEDED',
      });
    });
  });

  describe('details', () => {
    test('mapea la respuesta del backend (incluyendo locationToken) al DTO del picker', async () => {
      global.fetch.mockResolvedValue({
        status: 200, ok: true,
        json: async () => ({
          success: true,
          data: {
            placeId: 'place-1',
            formattedAddress: 'Av. 18 de Julio 1234, Montevideo, Uruguay',
            latitude: -34.9011,
            longitude: -56.1645,
            countryCode: 'UY',
            department: 'Montevideo',
            city: 'Montevideo',
            locationToken: 'signed.jwt.token',
            expiresAt: '2026-07-23T22:00:00.000Z',
          },
        }),
      });

      const result = await locationsService.details('place-1', 'session-1');

      expect(result).toEqual({
        placeId: 'place-1',
        address: 'Av. 18 de Julio 1234, Montevideo, Uruguay',
        lat: -34.9011,
        lng: -56.1645,
        city: 'Montevideo',
        department: 'Montevideo',
        country: 'Uruguay',
        locationToken: 'signed.jwt.token',
        tokenExpiresAt: '2026-07-23T22:00:00.000Z',
      });
    });

    test('placeId inválido (404): propaga el ApiError', async () => {
      global.fetch.mockResolvedValue({
        status: 404, ok: false,
        json: async () => ({ success: false, message: 'La dirección seleccionada ya no está disponible', code: 'PLACE_NOT_FOUND' }),
      });
      await expect(locationsService.details('no-existe', 'session-1')).rejects.toMatchObject({
        status: 404, code: 'PLACE_NOT_FOUND',
      });
    });

    test('la respuesta nunca incluye ningún dato de Google ajeno al DTO (sin apiKey/headers)', async () => {
      global.fetch.mockResolvedValue({
        status: 200, ok: true,
        json: async () => ({
          success: true,
          data: { placeId: 'p1', formattedAddress: 'x', latitude: -34, longitude: -56, countryCode: 'UY', locationToken: 't', expiresAt: 'e' },
        }),
      });
      const result = await locationsService.details('p1', 's1');
      expect(result).not.toHaveProperty('apiKey');
      expect(result).not.toHaveProperty('headers');
    });
  });
});
