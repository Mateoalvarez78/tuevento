// @vitest-environment jsdom
//
// A6: el proveedor ve el estado de su conexión con dLocal Go y qué le falta
// para aceptar reservas. Todo lo decide el backend; el componente solo muestra.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const getMock = vi.fn();
vi.mock('@/services/paymentService', () => ({ paymentService: { getMyPaymentAccount: (...a) => getMock(...a) } }));

const Card = (await import('@/components/dashboard/proveedor/PaymentAccountStatusCard')).default;

const REQS = (done) => [
  { key: 'dlocal_account', label: 'Crear tu cuenta en dLocal Go', done: done[0] },
  { key: 'collaboration_accepted', label: 'Aceptar la invitación de Eventonow', done: done[1] },
  { key: 'enabled_by_eventonow', label: 'Que Eventonow habilite tus cobros', done: done[2] },
];
const account = (over = {}) => ({
  state: 'pending_acceptance', can_receive_payments: false, can_accept_bookings: false,
  payments_required_to_accept: true, requirements: REQS([true, false, false]),
  pending_requirement: 'collaboration_accepted', next_step: 'Entrá a dLocal Go y aceptá la invitación.', ...over,
});

beforeEach(() => getMock.mockReset());
afterEach(cleanup);

describe('PaymentAccountStatusCard', () => {
  test('sin cobros habilitados: avisa que no puede aceptar y muestra el próximo paso', async () => {
    getMock.mockResolvedValue(account());
    render(<Card />);
    expect(await screen.findByText(/Todavía no podés aceptar reservas/)).toBeTruthy();
    expect(screen.getByText('Falta aceptar la invitación')).toBeTruthy();
    expect(screen.getByText(/Entrá a dLocal Go y aceptá la invitación/)).toBeTruthy();
    expect(screen.getByText('(hecho)', { exact: false })).toBeTruthy();
  });

  test('pagos online apagados: no dice que esté bloqueado', async () => {
    getMock.mockResolvedValue(account({ payments_required_to_accept: false, can_accept_bookings: true }));
    render(<Card />);
    expect(await screen.findByText('Cobros online')).toBeTruthy();
    expect(screen.queryByText(/Todavía no podés aceptar reservas/)).toBeNull();
  });

  test('habilitado: lo confirma y no muestra la lista de pasos', async () => {
    getMock.mockResolvedValue(account({
      state: 'enabled', can_receive_payments: true, can_accept_bookings: true,
      requirements: REQS([true, true, true]), pending_requirement: null, next_step: null,
    }));
    render(<Card />);
    expect(await screen.findByText('Cobros habilitados')).toBeTruthy();
    expect(screen.queryByText(/Próximo paso/)).toBeNull();
  });

  test('modo compacto (panel principal): si ya está habilitado no ocupa lugar', async () => {
    getMock.mockResolvedValue(account({ state: 'enabled', can_receive_payments: true, can_accept_bookings: true }));
    const { container } = render(<Card compact />);
    await vi.waitFor(() => expect(getMock).toHaveBeenCalled());
    await vi.waitFor(() => expect(container.querySelector('.skeleton')).toBeNull());
    expect(container.textContent).toBe('');
  });

  test('error del backend: mensaje y reintento', async () => {
    getMock.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue(account());
    render(<Card />);
    expect(await screen.findByText('Sin conexión')).toBeTruthy();
    screen.getByText('Reintentar').click();
    expect(await screen.findByText(/Todavía no podés aceptar reservas/)).toBeTruthy();
  });
});
