// Identidad del sitio y mecanismo fail-closed de las páginas legales.
//
// Estos tests protegen dos cosas distintas:
//  1. Que los datos confirmados sean exactamente los confirmados (marca,
//     dominio canónico, correo) y que los NO confirmados sigan ausentes.
//  2. Que la bandera de publicación no pueda quedar en `true` sin que los datos
//     estén completos. Es el invariante que impide publicar como vigente un
//     documento legal incompleto por olvido.
import { describe, test, expect } from 'vitest';
import {
  BRAND,
  BRAND_MONOGRAM,
  CANONICAL_ORIGIN,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SOCIAL_LINKS,
  PROVIDER_CONTACT_MAILTO,
  LEGAL_ENTITY,
  REQUIRED_LEGAL_FIELDS,
  LEGAL_DATA_COMPLETE,
  LEGAL_DOCS_REVIEWED,
  PUBLIC_LEGAL_READY,
  missingLegalFields,
  legalBlockers,
  legalIdentityRows,
} from '@/lib/site';

describe('marca y dominio', () => {
  test('la marca es Eventonow', () => {
    expect(BRAND).toBe('Eventonow');
  });

  test('el monograma se deriva de la marca (no es una constante suelta)', () => {
    expect(BRAND_MONOGRAM).toBe('EV');
    expect(BRAND_MONOGRAM).toBe(`${BRAND[0]}${BRAND[1]}`.toUpperCase());
  });

  test('no queda ningún rastro de la marca anterior', () => {
    expect(BRAND).not.toMatch(/TuEvento/i);
    expect(BRAND_MONOGRAM).not.toBe('TE');
  });

  test('el origen canónico es la forma con www y https', () => {
    expect(CANONICAL_ORIGIN).toBe('https://www.eventonow.com');
    expect(CANONICAL_ORIGIN.startsWith('https://')).toBe(true);
    expect(CANONICAL_ORIGIN).not.toMatch(/\/$/); // sin barra final: se concatena
  });

  test('el origen canónico es una URL válida (lo exige metadataBase)', () => {
    expect(() => new URL(CANONICAL_ORIGIN)).not.toThrow();
  });
});

describe('canales de contacto', () => {
  test('el correo público es el confirmado', () => {
    expect(CONTACT_EMAIL).toBe('hola@eventonow.com');
  });

  test('el mailto de proveedores usa ese mismo correo y lleva asunto', () => {
    expect(PROVIDER_CONTACT_MAILTO).toContain(`mailto:${CONTACT_EMAIL}`);
    expect(PROVIDER_CONTACT_MAILTO).toContain('subject=');
  });

  test('no hay teléfono comercial: es null explícito, no cadena vacía', () => {
    // La diferencia importa: los consumidores omiten la fila entera con null.
    expect(CONTACT_PHONE).toBeNull();
  });

  test('no hay redes sociales: lista vacía, nunca iconos con href="#"', () => {
    expect(SOCIAL_LINKS).toEqual([]);
  });

  test('si alguna vez se agrega una red, debe traer URL real (no "#")', () => {
    // Guardia para el futuro: documenta el contrato que el footer espera.
    SOCIAL_LINKS.forEach((s) => {
      expect(s.href).toBeTruthy();
      expect(s.href).not.toBe('#');
      expect(s.href).toMatch(/^https?:\/\//);
    });
  });
});

describe('identidad legal — datos confirmados y ausentes', () => {
  test('incluye los datos confirmados', () => {
    expect(LEGAL_ENTITY.name).toBe('Mateo Álvarez');
    expect(LEGAL_ENTITY.descriptor).toBe('empresa unipersonal');
    expect(LEGAL_ENTITY.country).toBe('Uruguay');
  });

  test('los datos NO confirmados están AUSENTES, no vacíos ni de relleno', () => {
    for (const field of ['taxId', 'documentId', 'address', 'dlocalHolderType']) {
      expect(LEGAL_ENTITY[field]).toBeUndefined();
    }
  });

  test('ningún valor presente es un marcador de relleno', () => {
    const forbidden = /pendiente|completar|TBD|XX|por definir|a definir/i;
    Object.values(LEGAL_ENTITY).forEach((v) => {
      if (typeof v === 'string') expect(v).not.toMatch(forbidden);
    });
  });
});

describe('legalIdentityRows — la ausencia omite la fila', () => {
  const rows = legalIdentityRows();

  test('devuelve solo las filas con valor', () => {
    expect(rows.map((r) => r.label)).toEqual(['Titular', 'Forma jurídica', 'País']);
  });

  test('no incluye RUT, Documento ni Domicilio mientras no existan', () => {
    const labels = rows.map((r) => r.label);
    expect(labels).not.toContain('RUT');
    expect(labels).not.toContain('Documento');
    expect(labels).not.toContain('Domicilio');
  });

  test('ninguna fila tiene valor vacío — una etiqueta sin dato sería un bug', () => {
    rows.forEach((r) => {
      expect(r.label).toBeTruthy();
      expect(r.value).toBeTruthy();
      expect(String(r.value).trim()).not.toBe('');
    });
  });
});

describe('fail-closed de publicación', () => {
  test('hoy faltan exactamente taxId y address', () => {
    expect(missingLegalFields()).toEqual(['taxId', 'address']);
  });

  test('los campos obligatorios incluyen la identificación fiscal y el domicilio', () => {
    expect(REQUIRED_LEGAL_FIELDS).toContain('taxId');
    expect(REQUIRED_LEGAL_FIELDS).toContain('address');
  });

  test('LEGAL_DATA_COMPLETE es false mientras falte algún campo', () => {
    expect(LEGAL_DATA_COMPLETE).toBe(false);
  });

  test('la revisión jurídica todavía no ocurrió', () => {
    expect(LEGAL_DOCS_REVIEWED).toBe(false);
  });

  test('PUBLIC_LEGAL_READY es false: estado bloqueado por defecto', () => {
    expect(PUBLIC_LEGAL_READY).toBe(false);
  });

  // ── El invariante que da sentido a todo lo anterior ──────────────────────
  test('PUBLIC_LEGAL_READY no puede ser true si faltan datos o falta la revisión', () => {
    expect(PUBLIC_LEGAL_READY).toBe(LEGAL_DATA_COMPLETE && LEGAL_DOCS_REVIEWED);
    if (PUBLIC_LEGAL_READY) {
      // Si alguien pone la bandera en true, este test exige que además los
      // datos estén completos — no se puede desbloquear la publicación a medias.
      expect(missingLegalFields()).toEqual([]);
      expect(LEGAL_DOCS_REVIEWED).toBe(true);
    }
  });

  test('legalBlockers enumera los tres bloqueos actuales, de forma legible', () => {
    const blockers = legalBlockers();
    expect(blockers).toHaveLength(3);
    expect(blockers[0]).toContain('taxId');
    expect(blockers[0]).toContain('address');
    expect(blockers[1]).toMatch(/abogado/i);
    // El tercero es la compuerta de contenido: datos + revisión no alcanzaban.
    expect(blockers[2]).toMatch(/cancelaciones/i);
    expect(blockers[2]).toMatch(/reembolsos/i);
  });

  test('cuando PUBLIC_LEGAL_READY sea true, no debe quedar ningún bloqueo', () => {
    if (PUBLIC_LEGAL_READY) expect(legalBlockers()).toEqual([]);
    else expect(legalBlockers().length).toBeGreaterThan(0);
  });
});
