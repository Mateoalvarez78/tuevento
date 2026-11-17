// @vitest-environment jsdom
//
// El footer es lo que un revisor externo mira primero para encontrar datos
// legales, contacto y documentos. Estos tests fijan las tres propiedades que
// motivaron su reescritura y que no deben volver a romperse:
//   · cero enlaces muertos (`href="#"`),
//   · cero iconos de redes sin cuenta real,
//   · cero badges de medios de pago que no estén operativos.
import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Footer from '@/components/Footer';
import { BRAND, CONTACT_EMAIL, SOCIAL_LINKS, legalIdentityRows } from '@/lib/site';

afterEach(() => cleanup());

function allLinks() {
  return Array.from(document.querySelectorAll('a'));
}

describe('enlaces', () => {
  test('NINGÚN enlace apunta a "#"', () => {
    render(<Footer />);
    const dead = allLinks().filter((a) => {
      const href = a.getAttribute('href');
      return !href || href === '#' || href.trim() === '';
    });
    expect(dead.map((a) => a.textContent)).toEqual([]);
  });

  test('todo enlace interno apunta a una ruta que existe en la app', () => {
    render(<Footer />);
    // Rutas públicas reales (ver el árbol de app/). Si se agrega un enlace a
    // una página que no existe, este test falla.
    const KNOWN = ['/', '/catalogo', '/contacto', '/terminos', '/privacidad'];
    const internal = allLinks()
      .map((a) => a.getAttribute('href'))
      .filter((h) => h.startsWith('/'));

    expect(internal.length).toBeGreaterThan(0);
    internal.forEach((href) => {
      // Se separa query y ancla: /catalogo?q=Catering y /#como-funciona son válidos.
      const path = href.split('?')[0].split('#')[0] || '/';
      expect(KNOWN).toContain(path);
    });
  });

  test('enlaza Términos, Privacidad y Contacto', () => {
    render(<Footer />);
    const hrefs = allLinks().map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/terminos');
    expect(hrefs).toContain('/privacidad');
    expect(hrefs).toContain('/contacto');
  });

  test('los mailto usan el correo público confirmado', () => {
    render(<Footer />);
    const mailtos = allLinks()
      .map((a) => a.getAttribute('href'))
      .filter((h) => h.startsWith('mailto:'));
    expect(mailtos.length).toBeGreaterThan(0);
    mailtos.forEach((h) => expect(h).toContain(CONTACT_EMAIL));
  });
});

describe('redes sociales', () => {
  test('no renderiza ningún icono social (no existen cuentas oficiales)', () => {
    render(<Footer />);
    for (const red of ['Instagram', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn', 'WhatsApp']) {
      expect(screen.queryByLabelText(red)).toBeNull();
      expect(screen.queryByTitle(red)).toBeNull();
    }
  });

  test('no hay enlaces a dominios de redes sociales', () => {
    render(<Footer />);
    const hrefs = allLinks().map((a) => a.getAttribute('href')).join(' ');
    for (const dominio of [
      'instagram.com', 'facebook.com', 'tiktok.com',
      'youtube.com', 'linkedin.com', 'wa.me', 'twitter.com', 'x.com',
    ]) {
      expect(hrefs).not.toContain(dominio);
    }
  });

  test('coherente con SOCIAL_LINKS, que está vacío', () => {
    expect(SOCIAL_LINKS).toEqual([]);
  });
});

describe('afirmaciones retiradas', () => {
  test('no menciona Stripe, Norton ni ningún medio de pago no operativo', () => {
    render(<Footer />);
    const text = document.body.textContent;
    for (const s of ['Stripe', 'Norton', 'VISA', 'Mastercard', 'MC']) {
      expect(text).not.toContain(s);
    }
  });

  test('no menciona dLocal: el checkout todavía no está operativo', () => {
    render(<Footer />);
    expect(document.body.textContent).not.toMatch(/dlocal/i);
  });

  test('no hay formulario de newsletter (el anterior simulaba el éxito)', () => {
    render(<Footer />);
    expect(document.querySelectorAll('form')).toHaveLength(0);
    expect(document.querySelectorAll('input')).toHaveLength(0);
  });

  test('no queda rastro de la marca anterior', () => {
    render(<Footer />);
    expect(document.body.textContent).not.toMatch(/TuEvento/i);
  });
});

describe('marca e identidad legal', () => {
  test('muestra la marca Eventonow', () => {
    render(<Footer />);
    expect(document.body.textContent).toContain(BRAND);
  });

  test('muestra el correo público como texto visible, no solo dentro de un href', () => {
    render(<Footer />);
    expect(screen.getByText(CONTACT_EMAIL)).toBeDefined();
  });

  test('publica las filas de identidad legal disponibles', () => {
    render(<Footer />);
    const text = document.body.textContent;
    legalIdentityRows().forEach((row) => {
      expect(text).toContain(row.value);
    });
  });

  test('no muestra etiquetas legales sin valor (RUT/Documento/Domicilio ausentes hoy)', () => {
    render(<Footer />);
    const text = document.body.textContent;
    // Ninguna de estas etiquetas debe aparecer mientras el dato no exista.
    expect(text).not.toContain('RUT:');
    expect(text).not.toContain('Documento:');
    expect(text).not.toContain('Domicilio:');
  });

  test('no contiene marcadores de relleno', () => {
    render(<Footer />);
    const text = document.body.textContent;
    for (const marker of ['pendiente', 'completar', 'TBD', 'lorem', 'XX']) {
      expect(text.toLowerCase()).not.toContain(marker.toLowerCase());
    }
  });

  test('el copyright incluye la marca y el titular', () => {
    render(<Footer />);
    const year = String(new Date().getFullYear());
    const text = document.body.textContent;
    expect(text).toContain(`© ${year} ${BRAND}`);
    expect(text).toContain('Mateo Álvarez');
  });
});
