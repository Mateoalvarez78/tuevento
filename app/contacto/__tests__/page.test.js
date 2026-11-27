// @vitest-environment jsdom
//
// /contacto: la página se sirve SIEMPRE (requisito de la revisión del
// procesador de pagos: un contacto real y la identidad del titular), pero el
// formulario —que recolecta datos personales— solo aparece con la compuerta
// legal abierta. Se re-importa con NODE_ENV=production para ver lo que sirve un
// build real.
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function renderWithEnv(nodeEnv) {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', nodeEnv);
  const Page = (await import('@/app/contacto/page')).default;
  render(<Page />);
  return import('@/lib/site');
}

describe('/contacto en producción', () => {
  test('se sirve (no llama a notFound) y muestra el correo real', async () => {
    await renderWithEnv('production');
    expect(screen.getByRole('heading', { level: 1, name: 'Contacto' })).toBeDefined();
    const mailtos = Array.from(document.querySelectorAll('a[href^="mailto:"]')).map((a) => a.getAttribute('href'));
    expect(mailtos.some((h) => h.startsWith('mailto:hola@eventonow.com'))).toBe(true);
  });

  test('sin formulario mientras la compuerta legal esté cerrada', async () => {
    const site = await renderWithEnv('production');
    expect(site.CONTACT_FORM_ENABLED).toBe(false);
    expect(document.querySelector('form')).toBeNull();
    expect(screen.queryByText(/visible solo en desarrollo/i)).toBeNull();
  });

  test('muestra la identidad del titular', async () => {
    await renderWithEnv('production');
    expect(document.body.textContent).toContain('Mateo Álvarez');
    expect(document.body.textContent).toContain('empresa unipersonal');
  });

  test('sin teléfono mientras CONTACT_PHONE no exista', async () => {
    const site = await renderWithEnv('production');
    if (!site.CONTACT_PHONE) {
      expect(document.querySelector('a[href^="tel:"]')).toBeNull();
      expect(screen.queryByText('Teléfono')).toBeNull();
    }
  });

  test('no publica domicilio ni documento', async () => {
    await renderWithEnv('production');
    expect(screen.queryByText(/Domicilio/)).toBeNull();
    expect(screen.queryByText(/^Documento/)).toBeNull();
  });
});

describe('/contacto en desarrollo', () => {
  test('muestra el formulario con el aviso interno', async () => {
    await renderWithEnv('development');
    expect(document.querySelector('form')).not.toBeNull();
    expect(screen.getByText(/visible solo en desarrollo/i)).toBeDefined();
  });
});
