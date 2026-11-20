// Registro de documentos legales y sus dos áreas (cliente / proveedor):
// cada documento existe como ruta en su área, las áreas no se cruzan, y el
// área proveedor es alcanzable a través del proxy del host de proveedores.
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  LEGAL_DOCS, LEGAL_SPACES, spaceDocs, docHref, formatLegalDate, effectiveLabel, relatedDocs,
} from '@/lib/legalDocs';

const ROOT = path.resolve(__dirname, '..', '..');
const pageFile = (href) => path.join(ROOT, 'app', ...href.split('/').filter(Boolean), 'page.js');
const read = (f) => fs.readFileSync(f, 'utf8');
const ALL_DOCS = Object.values(LEGAL_DOCS);

/** Archivos .js bajo un directorio (sin tests). */
function walk(dir, acc = []) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return acc;
  for (const e of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__') walk(rel, acc); }
    else if (e.name.endsWith('.js')) acc.push(rel);
  }
  return acc;
}

/** Fuente de la página + el componente de contenido si la página lo delega. */
function docSource(href) {
  const src = read(pageFile(href));
  const delegated = src.match(/import \w+ from '@\/components\/legal\/(PrivacyPolicy)'/);
  return delegated ? read(path.join(ROOT, 'components', 'legal', `${delegated[1]}.js`)) : src;
}

describe('registro de documentos', () => {
  test('dos áreas con sus documentos', () => {
    expect(spaceDocs('cliente').map((d) => d.key)).toEqual(['terminos', 'cancelaciones', 'privacidad']);
    expect(spaceDocs('proveedor').map((d) => d.key)).toEqual(['proveedores', 'privacidad']);
  });

  test('cada documento de cada área tiene una página real', () => {
    Object.keys(LEGAL_SPACES).forEach((space) => {
      spaceDocs(space).forEach((d) => expect(fs.existsSync(pageFile(d.href)), d.href).toBe(true));
      expect(fs.existsSync(pageFile(LEGAL_SPACES[space].hub)), LEGAL_SPACES[space].hub).toBe(true);
    });
  });

  test('ninguno se declara vigente sin fecha de vigencia', () => {
    ALL_DOCS.forEach((d) => {
      if (d.status === 'published') expect(d.effectiveOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      else expect(d.effectiveOn).toBeNull();
    });
  });

  test('fechas válidas y formateadas sin corrimiento de zona', () => {
    expect(formatLegalDate('2026-11-19')).toBe('19 de noviembre de 2026');
    expect(formatLegalDate('2027-01-01')).toBe('1 de enero de 2027');
    expect(() => formatLegalDate('2026-13-01')).toThrow();
    ALL_DOCS.forEach((d) => expect(() => formatLegalDate(d.updatedOn)).not.toThrow());
  });

  test('vigencia pendiente se rotula como preliminar', () => {
    expect(effectiveLabel(LEGAL_DOCS.terminos)).toMatch(/preliminar/);
  });

  test('docHref falla si se pide un documento en un área que no le corresponde', () => {
    expect(docHref('proveedores', 'proveedor')).toBe('/provider/legal/condiciones');
    expect(() => docHref('proveedores', 'cliente')).toThrow();
    expect(() => docHref('terminos', 'proveedor')).toThrow();
  });
});

describe('las áreas no se cruzan', () => {
  test('los relacionados son solo de la misma área', () => {
    expect(relatedDocs('terminos', 'cliente').map((d) => d.key)).toEqual(['cancelaciones', 'privacidad']);
    expect(relatedDocs('proveedores', 'proveedor').map((d) => d.key)).toEqual(['privacidad']);
    expect(relatedDocs('privacidad', 'proveedor').map((d) => d.key)).toEqual(['proveedores']);
  });

  test('el área proveedor vive entera bajo /provider (lo único que el proxy sirve en su host)', () => {
    expect(LEGAL_SPACES.proveedor.hub.startsWith('/provider/')).toBe(true);
    spaceDocs('proveedor').forEach((d) => expect(d.href.startsWith('/provider/'), d.href).toBe(true));
  });

  test('el área cliente no usa rutas del portal de proveedores', () => {
    expect(LEGAL_SPACES.cliente.hub.startsWith('/provider')).toBe(false);
    spaceDocs('cliente').forEach((d) => expect(d.href.startsWith('/provider'), d.href).toBe(false));
  });

  const LINK = (paths) => new RegExp(`(href\\s*[=:]\\s*\\{?\\s*[\`'"])(${paths.join('|')})([\`'"#/])`);

  test('ningún archivo del área cliente enlaza al área proveedor', () => {
    const files = [
      ...walk(path.join('app', 'terminos')), ...walk(path.join('app', 'legal')),
      ...walk(path.join('app', 'privacidad')), path.join('components', 'Footer.js'),
      path.join('components', 'legal', 'PrivacyPolicy.js'),
    ];
    const hits = files.filter((f) => /\/provider\/legal|\/terminos\/proveedores/.test(
      read(path.join(ROOT, f)).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    ));
    expect(hits).toEqual([]);
  });

  test('ningún archivo del área proveedor enlaza a documentos de clientes', () => {
    const files = walk(path.join('app', 'provider', 'legal'));
    const clientHrefs = ['/legal', '/terminos', '/terminos/cancelaciones', '/privacidad'];
    const hits = files.filter((f) => LINK(clientHrefs).test(read(path.join(ROOT, f))));
    expect(hits).toEqual([]);
  });
});

describe('páginas legales', () => {
  const HREFS = [
    ...new Set(Object.keys(LEGAL_SPACES).flatMap((s) => [LEGAL_SPACES[s].hub, ...spaceDocs(s).map((d) => d.href)])),
  ];

  test('todas responden 404 si su compuerta está cerrada', () => {
    HREFS.forEach((h) => expect(read(pageFile(h)), h).toMatch(/notFound\(\)/));
  });

  test('todas llevan noindex mientras no estén vigentes', () => {
    HREFS.forEach((h) => {
      const src = read(pageFile(h));
      expect(/legalMetadata\(|robots: \{ index: false, follow: false \}/.test(src), h).toBe(true);
    });
  });

  test.each(Object.keys(LEGAL_SPACES).flatMap((s) => spaceDocs(s).map((d) => [s, d.key, d.href])))(
    '%s/%s: el índice apunta a encabezados que existen',
    (_s, _k, href) => {
      const src = docSource(href);
      const ids = [...src.matchAll(/\{ id: '([^']+)',\s+title:/g)].map((m) => m[1]);
      expect(ids.length).toBeGreaterThan(5);
      ids.forEach((id) => expect(src).toContain(`id="${id}"`));
    },
  );

  test('cada documento declara su área al layout', () => {
    Object.keys(LEGAL_SPACES).forEach((space) => {
      spaceDocs(space).forEach((d) => {
        const page = read(pageFile(d.href));
        const src = docSource(d.href);
        // O la página pasa el área al componente compartido, o la pasa al layout.
        expect(page.includes(`space="${space}"`) || src.includes(`space="${space}"`), d.href).toBe(true);
      });
    });
  });
});
