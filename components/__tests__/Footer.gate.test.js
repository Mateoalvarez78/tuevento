// @vitest-environment jsdom
//
// Footer: enlaces condicionados por la compuerta, chips por categoría y nombre
// accesible del logo.
//
// El archivo re-importa el Footer con NODE_ENV=production para comprobar lo que
// se renderiza en un build real: el footer enlaza solo rutas que se sirven.
// /contacto se sirve siempre (sin formulario mientras la compuerta legal esté
// cerrada), así que se enlaza siempre.
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** Renderiza el Footer con un NODE_ENV dado, re-evaluando los módulos. */
async function renderFooterWithEnv(nodeEnv) {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', nodeEnv);
  const Footer = (await import('@/components/Footer')).default;
  render(<Footer />);
}

function hrefs() {
  return Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href'));
}

// ── Compuerta ──────────────────────────────────────────────────────────────

describe('enlaces con compuerta — producción', () => {
  // Desde el 19/11/2026 los documentos legales se publican como VERSIÓN
  // PRELIMINAR (LEGAL_PREVIEW_PUBLISHED en lib/site.js): sus rutas se sirven en
  // producción, así que el footer las enlaza. La página de contacto se sirve
  // siempre; solo su formulario sigue atado a la compuerta real.
  test('enlaza los documentos legales de CLIENTES publicados como versión preliminar', async () => {
    await renderFooterWithEnv('production');
    const { LEGAL_PREVIEW_PUBLISHED } = await import('@/lib/site');
    const h = hrefs();
    for (const route of ['/legal', '/terminos', '/terminos/cancelaciones', '/privacidad']) {
      if (LEGAL_PREVIEW_PUBLISHED) expect(h).toContain(route);
      else expect(h).not.toContain(route);
    }
  });

  test('el footer del marketplace NO enlaza documentos del área proveedores', async () => {
    await renderFooterWithEnv('production');
    expect(hrefs().filter((h) => h.startsWith('/provider') || h === '/terminos/proveedores')).toEqual([]);
  });

  test('enlaza /contacto SIEMPRE: la página se sirve aunque el formulario esté cerrado', async () => {
    await renderFooterWithEnv('production');
    const { PUBLIC_CONTACT_READY, CONTACT_REACHABLE } = await import('@/lib/site');
    expect(PUBLIC_CONTACT_READY).toBe(false);
    expect(CONTACT_REACHABLE).toBe(true);
    expect(hrefs()).toContain('/contacto');
  });

  test('sigue sin tener ningún enlace muerto', async () => {
    await renderFooterWithEnv('production');
    const dead = hrefs().filter((h) => !h || h === '#' || h.trim() === '');
    expect(dead).toEqual([]);
  });

  test('conserva los destinos que sí existen (catálogo, correo, proveedores)', async () => {
    await renderFooterWithEnv('production');
    const h = hrefs();
    expect(h).toContain('/catalogo');
    expect(h).toContain('/#como-funciona');
    expect(h.some((x) => x.startsWith('mailto:hola@eventonow.com'))).toBe(true);
  });

  test('el correo de contacto sigue visible como texto (canal real)', async () => {
    await renderFooterWithEnv('production');
    expect(screen.getByText('hola@eventonow.com')).toBeDefined();
  });

  test('la identidad del titular se sigue publicando', async () => {
    await renderFooterWithEnv('production');
    expect(document.body.textContent).toContain('Mateo Álvarez');
  });
});

describe('enlaces con compuerta — desarrollo', () => {
  test('SÍ enlaza las tres rutas, para poder probarlas', async () => {
    await renderFooterWithEnv('development');
    const h = hrefs();
    expect(h).toContain('/terminos');
    expect(h).toContain('/privacidad');
    expect(h).toContain('/contacto');
  });
});

// ── Chips de categoría ─────────────────────────────────────────────────────

describe('chips de categoría', () => {
  // Slugs del catálogo activo, verificados contra GET /categories.
  const VALID_SLUGS = [
    'catering', 'dj', 'fotografia', 'decoracion', 'animacion', 'barra',
    'sonido', 'castillo', 'mozos', 'cabina_fotos', 'salon-de-fiestas',
    'reposteria-dulces',
  ];

  function chipHrefs() {
    return hrefs().filter((h) => h && h.startsWith('/catalogo?'));
  }

  test('todos usan el filtro de categoría, ninguno búsqueda libre', async () => {
    await renderFooterWithEnv('production');
    const chips = chipHrefs();
    expect(chips.length).toBeGreaterThan(0);
    chips.forEach((h) => {
      expect(h).toMatch(/^\/catalogo\?categories=/);
      // `?q=` era el mecanismo frágil: full-text sobre título y descripción.
      expect(h).not.toContain('?q=');
    });
  });

  test('cada slug existe en el catálogo activo', async () => {
    await renderFooterWithEnv('production');
    chipHrefs().forEach((h) => {
      const slug = decodeURIComponent(new URL(h, 'https://x.test').searchParams.get('categories'));
      expect(VALID_SLUGS).toContain(slug);
    });
  });

  test('ningún chip apunta a «Bebidas», que no es una categoría', async () => {
    await renderFooterWithEnv('production');
    const all = chipHrefs().join(' ');
    expect(all.toLowerCase()).not.toContain('bebidas');
    // La categoría real es «Barra de Tragos» → slug `barra`.
    expect(all).toContain('categories=barra');
  });

  test('ningún chip hardcodea un UUID (cambia entre ambientes)', async () => {
    await renderFooterWithEnv('production');
    chipHrefs().forEach((h) => {
      expect(h).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    });
  });

  test('no hay slugs repetidos', async () => {
    await renderFooterWithEnv('production');
    const slugs = chipHrefs().map((h) =>
      new URL(h, 'https://x.test').searchParams.get('categories')
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('ningún chip lleva fragmento ni queda sin valor de categoría', async () => {
    await renderFooterWithEnv('production');
    chipHrefs().forEach((h) => {
      expect(h).not.toContain('#');
      const v = new URL(h, 'https://x.test').searchParams.get('categories');
      expect(v).toBeTruthy();
      expect(v.trim()).not.toBe('');
    });
  });
});

// ── Nombre accesible del logo ──────────────────────────────────────────────

describe('accesibilidad del logo', () => {
  // Se consulta por ROL y nombre accesible: `getByRole` calcula el nombre con
  // dom-accessibility-api, que respeta `aria-hidden` igual que un lector de
  // pantalla. `textContent` NO sirve para esto — devuelve también el texto de
  // los subárboles ocultos, así que no discriminaría el defecto.
  test('el enlace de marca se llama exactamente «Eventonow»', async () => {
    await renderFooterWithEnv('production');
    const brandLink = screen.getByRole('link', { name: 'Eventonow' });
    expect(brandLink.getAttribute('href')).toBe('/');
  });

  test('NO existe ningún enlace llamado «EVEventonow» (el defecto corregido)', async () => {
    await renderFooterWithEnv('production');
    expect(screen.queryByRole('link', { name: 'EVEventonow' })).toBeNull();
    expect(screen.queryByRole('link', { name: /^EV/ })).toBeNull();
  });

  test('el monograma está dentro de un contenedor aria-hidden', async () => {
    await renderFooterWithEnv('production');
    const mono = Array.from(document.querySelectorAll('span'))
      .find((s) => s.textContent.trim() === 'EV');
    expect(mono).not.toBeNull();
    expect(mono.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  test('el monograma sigue siendo visible (se oculta a la AT, no a la vista)', async () => {
    await renderFooterWithEnv('production');
    const mono = Array.from(document.querySelectorAll('span'))
      .find((s) => s.textContent.trim() === 'EV');
    // No se usó `hidden` ni display:none: el logo se sigue viendo.
    expect(mono.closest('[aria-hidden="true"]').className).not.toMatch(/(^|\s)hidden(\s|$)/);
  });

  test('ocultar el monograma no deja el enlace sin nombre accesible', async () => {
    await renderFooterWithEnv('production');
    // Si `aria-hidden` se hubiera puesto sobre el <a> o sobre el nombre de
    // marca, este getByRole no encontraría nada.
    expect(screen.getByRole('link', { name: 'Eventonow' })).toBeDefined();
  });
});
