// @vitest-environment jsdom
//
// A4: el proveedor elige el vencimiento del saldo (3/7/14/30) y ve cómo lo
// verá el cliente antes de reservar.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

const getMock = vi.fn();
const updateMock = vi.fn();
vi.mock('@/services/paymentService', () => ({
  paymentService: {
    getMyPaymentTerms: (...a) => getMock(...a),
    updateMyPaymentTerms: (...a) => updateMock(...a),
  },
}));

const Card = (await import('@/components/dashboard/proveedor/BalanceDueSettingCard')).default;

const terms = (days) => ({
  balance_due_days_before_event: days,
  options: [3, 7, 14, 30],
  client_view: { deposit_percent: 20, balance_percent: 80, deposit_due_hours: 48, balance_due_days_before_event: days },
});

beforeEach(() => { getMock.mockReset(); updateMock.mockReset(); });
afterEach(cleanup);

describe('BalanceDueSettingCard', () => {
  test('muestra el valor actual (7 por defecto) y la vista del cliente', async () => {
    getMock.mockResolvedValue(terms(7));
    render(<Card />);
    const seven = await screen.findByRole('radio', { name: '7 días antes' });
    expect(seven.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Saldo del 80 % hasta 7 días antes del evento.')).toBeTruthy();
    expect(screen.getByText('Guardar plazo').closest('button').disabled).toBe(true);
  });

  test('elegir 14 actualiza la vista previa y guarda por la API', async () => {
    getMock.mockResolvedValue(terms(7));
    updateMock.mockResolvedValue(terms(14));
    render(<Card />);
    fireEvent.click(await screen.findByRole('radio', { name: '14 días antes' }));
    expect(screen.getByText('Saldo del 80 % hasta 14 días antes del evento.')).toBeTruthy();
    fireEvent.click(screen.getByText('Guardar plazo'));
    expect(await screen.findByText('Guardado')).toBeTruthy();
    expect(updateMock).toHaveBeenCalledWith(14);
  });

  test('si el backend rechaza, muestra el error y no da por guardado', async () => {
    getMock.mockResolvedValue(terms(7));
    updateMock.mockRejectedValue(new Error('El vencimiento del saldo debe ser 3, 7, 14, 30 días antes del evento'));
    render(<Card />);
    fireEvent.click(await screen.findByRole('radio', { name: '30 días antes' }));
    fireEvent.click(screen.getByText('Guardar plazo'));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Guardado')).toBeNull();
  });
});
