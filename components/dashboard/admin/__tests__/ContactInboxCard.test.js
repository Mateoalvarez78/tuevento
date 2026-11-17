// @vitest-environment jsdom
//
// Tarjeta de mensajes sin atender en el overview del admin.
//
// Antes, `newCount` solo se mostraba DENTRO de /admin/contacto: había que
// entrar a la bandeja para descubrir que había algo sin leer. Esta tarjeta y el
// badge del sidebar son los dos puntos donde un admin se entera sin buscarlo.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

const getAll = vi.fn();
vi.mock('@/services/contactService', () => ({
  contactService: { admin: { getAll: (...a) => getAll(...a) } },
  CONTACT_LIMITS: {},
  CONTACT_STATUS_LABELS: {},
}));

const ContactInboxCard = (await import('@/components/dashboard/admin/ContactInboxCard')).default;

// `cleanup()` también en beforeEach: desmonta cualquier componente que una
// prueba anterior haya dejado montado ANTES de reprogramar el mock. Sin esto,
// un componente todavía montado recibía la implementación rechazada de la
// prueba siguiente y su rechazo quedaba sin manejar, haciendo fallar el test
// por una interacción entre pruebas y no por el componente.
beforeEach(() => { cleanup(); getAll.mockReset(); });
afterEach(() => cleanup());

describe('con mensajes sin atender', () => {
  test('muestra la cantidad y enlaza a la bandeja', async () => {
    getAll.mockResolvedValue({ data: [], counts: { new: 3 }, newCount: 3 });
    render(<ContactInboxCard />);

    await waitFor(() => expect(screen.getByText('3')).toBeDefined());
    expect(document.body.textContent).toContain('mensajes de contacto sin atender');
    expect(screen.getByRole('link', { name: /responder/i }).getAttribute('href'))
      .toBe('/admin/contacto');
  });

  test('singulariza el texto con un solo mensaje', async () => {
    getAll.mockResolvedValue({ data: [], counts: { new: 1 }, newCount: 1 });
    render(<ContactInboxCard />);
    await waitFor(() => expect(document.body.textContent).toContain('mensaje de contacto sin atender'));
    expect(document.body.textContent).not.toContain('mensajes de contacto sin atender');
  });

  test('pide limit: 1 — el contador no necesita descargar los mensajes', async () => {
    getAll.mockResolvedValue({ data: [], newCount: 2 });
    render(<ContactInboxCard />);
    await waitFor(() => expect(getAll).toHaveBeenCalled());
    expect(getAll).toHaveBeenCalledWith({ limit: 1 });
  });
});

describe('estado vacío', () => {
  test('lo dice explícitamente y mantiene el acceso a la bandeja', async () => {
    getAll.mockResolvedValue({ data: [], counts: {}, newCount: 0 });
    render(<ContactInboxCard />);

    await waitFor(() =>
      expect(screen.getByText(/no hay mensajes de contacto sin atender/i)).toBeDefined()
    );
    expect(screen.getByRole('link', { name: /ver bandeja/i }).getAttribute('href'))
      .toBe('/admin/contacto');
  });

  test('no muestra un cero suelto como si fuera una alerta', async () => {
    getAll.mockResolvedValue({ data: [], newCount: 0 });
    render(<ContactInboxCard />);
    await waitFor(() => expect(screen.getByText(/no hay mensajes/i)).toBeDefined());
    expect(screen.queryByText('0')).toBeNull();
  });
});

describe('manejo de error', () => {
  test('no rompe el layout y conserva el enlace a la bandeja', async () => {
    getAll.mockImplementation(() => Promise.reject(Object.assign(new Error('500'), { status: 500 })));
    render(<ContactInboxCard />);

    await waitFor(() =>
      expect(screen.getByText(/no se pudo leer la bandeja/i)).toBeDefined()
    );
    expect(screen.getByRole('link', { name: /abrir/i }).getAttribute('href'))
      .toBe('/admin/contacto');
  });

  test('ante un error no inventa un número', async () => {
    getAll.mockImplementation(() => Promise.reject(new Error('boom')));
    render(<ContactInboxCard />);
    await waitFor(() => expect(screen.getByText(/no se pudo leer/i)).toBeDefined());
    expect(document.body.textContent).not.toMatch(/\d+\s+mensajes?/);
  });
});

describe('refresco por cambio de estado', () => {
  test('se vuelve a consultar cuando la bandeja cambia en otra parte de la UI', async () => {
    getAll.mockResolvedValue({ data: [], newCount: 3 });
    render(<ContactInboxCard />);
    await waitFor(() => expect(getAll).toHaveBeenCalledTimes(1));

    // Simula el efecto de mover un mensaje de `new` a `resolved` en la página.
    getAll.mockResolvedValue({ data: [], newCount: 2 });
    const { CONTACT_INBOX_CHANGED } = await import('@/hooks/useAdmin');
    window.dispatchEvent(new Event(CONTACT_INBOX_CHANGED));

    await waitFor(() => expect(getAll).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('2')).toBeDefined());
  });

  test('al pasar de 1 a 0 la tarjeta cambia al estado vacío', async () => {
    getAll.mockResolvedValue({ data: [], newCount: 1 });
    render(<ContactInboxCard />);
    await waitFor(() => expect(screen.getByText('1')).toBeDefined());

    getAll.mockResolvedValue({ data: [], newCount: 0 });
    const { notifyContactInboxChanged } = await import('@/hooks/useAdmin');
    notifyContactInboxChanged();

    await waitFor(() => expect(screen.getByText(/no hay mensajes/i)).toBeDefined());
  });
});
