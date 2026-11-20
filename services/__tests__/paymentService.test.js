import { describe, test, expect, vi, beforeEach } from 'vitest';

const post = vi.fn();
const get = vi.fn();
vi.mock('@/services/api', () => ({ api: { post: (...a) => post(...a), get: (...a) => get(...a) } }));

const { paymentService } = await import('@/services/paymentService');

beforeEach(() => { post.mockReset(); get.mockReset(); });

describe('paymentService', () => {
  test('createCheckout pega al endpoint de la reserva y no manda importes', async () => {
    post.mockResolvedValue({ data: { intentId: 'i', checkoutUrl: 'https://x' } });
    const r = await paymentService.createCheckout('b1');
    expect(post).toHaveBeenCalledWith('/payments/booking/b1/checkout', {});
    expect(r.checkoutUrl).toBe('https://x');
  });

  test('syncIntent y listIntents', async () => {
    post.mockResolvedValue({ data: { status: 'paid' } });
    get.mockResolvedValue({ data: [{ id: 'i' }] });
    expect((await paymentService.syncIntent('i')).status).toBe('paid');
    expect(post).toHaveBeenCalledWith('/payments/intents/i/sync', {});
    expect(await paymentService.listIntents('b1')).toEqual([{ id: 'i' }]);
  });
});
