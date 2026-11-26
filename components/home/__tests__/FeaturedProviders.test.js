// @vitest-environment jsdom
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock('@/components/ServiceCard', () => ({
  default: ({ provider }) => <div data-testid="card">{provider.name}</div>,
}));
const getFeaturedProviders = vi.fn();
vi.mock('@/services/providerService', () => ({ providerService: { getFeaturedProviders: (...a) => getFeaturedProviders(...a) } }));

const FeaturedProviders = (await import('@/components/home/FeaturedProviders')).default;

afterEach(() => { cleanup(); getFeaturedProviders.mockReset(); });

describe('FeaturedProviders', () => {
  test('con datos del servidor: renderiza sin pedir nada', () => {
    render(<FeaturedProviders initialProviders={[{ providerId: 'p1', name: 'Real' }]} />);
    expect(screen.getByText('Proveedores destacados')).toBeDefined();
    expect(screen.getAllByTestId('card')).toHaveLength(1);
    expect(getFeaturedProviders).not.toHaveBeenCalled();
  });

  test('sin destacados: no renderiza la sección', () => {
    const { container } = render(<FeaturedProviders initialProviders={[]} />);
    expect(container.innerHTML).toBe('');
  });

  test('el servidor no pudo: los pide en el navegador', async () => {
    getFeaturedProviders.mockResolvedValue([{ providerId: 'p2', name: 'Del cliente' }]);
    render(<FeaturedProviders initialProviders={null} />);
    await waitFor(() => expect(screen.getByText('Del cliente')).toBeDefined());
  });

  test('si el cliente tampoco obtiene nada, la sección desaparece', async () => {
    getFeaturedProviders.mockResolvedValue([]);
    const { container } = render(<FeaturedProviders initialProviders={null} />);
    await waitFor(() => expect(container.innerHTML).toBe(''));
  });

  test('error: ofrece reintentar y reintenta', async () => {
    getFeaturedProviders.mockRejectedValueOnce(new Error('dormido'))
      .mockResolvedValueOnce([{ providerId: 'p3', name: 'Al segundo intento' }]);
    render(<FeaturedProviders initialProviders={null} />);
    const btn = await screen.findByRole('button', { name: /Reintentar/ });
    await userEvent.click(btn);
    await waitFor(() => expect(screen.getByText('Al segundo intento')).toBeDefined());
    expect(getFeaturedProviders).toHaveBeenCalledTimes(2);
  });
});
