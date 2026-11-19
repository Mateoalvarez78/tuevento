// Registro de documentos legales y páginas que lo consumen: cada documento
// existe como ruta, lleva noindex mientras no esté vigente, y su índice apunta
// a encabezados reales.
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  LEGAL_DOCS, LEGAL_DOCS_LIST, formatLegalDate, effectiveLabel, relatedDocs,
} from '@/lib/legalDocs';

const ROOT = path.resolve(__dirname, '..', '..');
const pageFile = (href) => path.join(ROOT, 'app', ...href.split('/').filter(Boolean), 'page.js');
const read = (f) => fs.readFileSync(f, 'utf8');

describe('registro de documentos', () => {
  test('cuatro documentos, claves únicas y en orden', () => {
    expect(LEGAL_DOCS_LIST.map((d) => d.key)).toEqual(['terminos', 'cancelaciones', 'proveedores', 'privacidad']);
  });

  test('cada documento tiene una página real', () => {
    LEGAL_DOCS_LIST.forEach((d) => expect(fs.existsSync(pageFile(d.href)), d.href).toBe(true));
  });

  test('ninguno se declara vigente sin fecha de vigencia', () => {
    LEGAL_DOCS_LIST.forEach((d) => {
      if (d.status === 'published') expect(d.effectiveOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      else expect(d.effectiveOn).toBeNull();
    });
  });

  test('fechas válidas y formateadas sin corrimiento de zona', () => {
    expect(formatLegalDate('2026-11-19')).toBe('19 de noviembre de 2026');
    expect(formatLegalDate('2027-01-01')).toBe('1 de enero de 2027');
    expect(() => formatLegalDate('2026-13-01')).toThrow();
    LEGAL_DOCS_LIST.forEach((d) => expect(() => formatLegalDate(d.updatedOn)).not.toThrow());
  });

  test('vigencia pendiente se rotula como preliminar', () => {
    expect(effectiveLabel(LEGAL_DOCS.terminos)).toMatch(/preliminar/);
  });

  test('los relacionados excluyen al propio documento', () => {
    expect(relatedDocs('terminos').map((d) => d.key)).not.toContain('terminos');
    expect(relatedDocs('terminos')).toHaveLength(3);
  });
});

describe('páginas legales', () => {
  const PAGES = [...LEGAL_DOCS_LIST.map((d) => pageFile(d.href)), pageFile('/legal')];

  test('todas responden 404 si su compuerta está cerrada', () => {
    PAGES.forEach((f) => expect(read(f), f).toMatch(/notFound\(\)/));
  });

  test('todas llevan noindex mientras no estén vigentes', () => {
    PAGES.forEach((f) => {
      const src = read(f);
      expect(/legalMetadata\(|robots: \{ index: false, follow: false \}/.test(src), f).toBe(true);
    });
  });

  test.each(LEGAL_DOCS_LIST.map((d) => [d.key, d.href]))('%s: el índice apunta a encabezados que existen', (_k, href) => {
    const src = read(pageFile(href));
    const ids = [...src.matchAll(/\{ id: '([^']+)',\s+title:/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(5);
    ids.forEach((id) => expect(src).toContain(`id="${id}"`));
  });

  test('cada página usa la entrada del registro (versión y fechas no escritas a mano)', () => {
    LEGAL_DOCS_LIST.forEach((d) => {
      const src = read(pageFile(d.href));
      expect(/doc=\{(LEGAL_DOCS\.\w+|PROVIDER_TERMS_DOC)\}/.test(src), d.href).toBe(true);
    });
  });
});
