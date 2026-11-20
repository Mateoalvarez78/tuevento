// @vitest-environment jsdom
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import PayInFullCheckbox from '@/components/payments/PayInFullCheckbox';

afterEach(cleanup);

describe('PayInFullCheckbox', () => {
  test('muestra los dos importes y avisa el cambio', () => {
    const onChange = vi.fn();
    render(<PayInFullCheckbox checked={false} onChange={onChange} total={12500} deposit={2500} beforeAcceptance />);
    const box = screen.getByRole('checkbox', { name: /Quiero pagar el total de una vez/ });
    expect(screen.getByText(/\$12\.500 en un solo pago en vez de la seña de \$2\.500/)).toBeTruthy();
    expect(screen.getByText(/cuando el proveedor confirma/)).toBeTruthy();
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('deshabilitado no cambia', () => {
    const onChange = vi.fn();
    render(<PayInFullCheckbox checked onChange={onChange} total={100} deposit={20} disabled />);
    const box = screen.getByRole('checkbox');
    expect(box.checked).toBe(true);
    expect(box.disabled).toBe(true);
  });
});
