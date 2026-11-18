// @vitest-environment jsdom
//
// La pantalla de retorno NUNCA confía en la URL: solo muestra lo que devuelve
// el backend al sincronizar el intento con dLocal.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

const syncMock = vi.fn();
let search = '';
vi.mock('@/services/paymentService', () => ({ paymentService: { syncIntent: (...a) => syncMock(...a) } }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(search) }));
vi.mock('@/components/Button', () => ({ default: ({ children, href }) => <a href={href}>{children}</a> }));

const PaymentReturn = (await import('@/components/payments/PaymentReturn')).default;
const ID = '6f1c2b3a-1111-4222-8333-944455556666';

beforeEach(() => { syncMock.mockReset(); search = `intent=${ID}`; });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('PaymentReturn', () => {
  test('pago confirmado por el backend', async () => {
    syncMock.mockResolvedValue({ status: 'paid' });
    render(<PaymentReturn />);
    expect(await screen.findByText('¡Pago confirmado!')).toBeTruthy();
    expect(syncMock).toHaveBeenCalledWith(ID);
  });

  test('pendiente: sigue consultando y avisa que no hace falta pagar de nuevo', async () => {
    syncMock.mockResolvedValueOnce({ status: 'pending' }).mockResolvedValueOnce({ status: 'paid' });
    render(<PaymentReturn />);
    expect(await screen.findByText('Tu pago está en proceso')).toBeTruthy();
    expect(screen.getByText(/no hace falta que pagues de nuevo/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText('¡Pago confirmado!')).toBeTruthy(), { timeout: 4000 });
    expect(syncMock).toHaveBeenCalledTimes(2);
  });

  test('un id manipulado en la URL no llega al backend', async () => {
    search = 'intent=../../admin';
    render(<PaymentReturn />);
    expect(screen.getByText('No encontramos este pago')).toBeTruthy();
    expect(syncMock).not.toHaveBeenCalled();
  });

  test('volver con "cancelar" pero el pago se aprobó igual: gana el backend', async () => {
    syncMock.mockResolvedValue({ status: 'paid' });
    render(<PaymentReturn cancelled />);
    expect(await screen.findByText('¡Pago confirmado!')).toBeTruthy();
  });

  test('pago con diferencia en revisión: pide no volver a pagar', async () => {
    syncMock.mockResolvedValue({ status: 'amount_mismatch' });
    render(<PaymentReturn />);
    expect(await screen.findByText('Estamos revisando tu pago')).toBeTruthy();
    expect(screen.getByText(/no vuelvas a pagar/)).toBeTruthy();
  });
});
