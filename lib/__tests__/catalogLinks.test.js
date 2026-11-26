import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { catalogCategoryHref, categorySlug } from '@/lib/catalogLinks';

describe('catalogCategoryHref', () => {
  test('usa ?categories=<slug>', () => {
    expect(catalogCategoryHref({ id: 'dj', slug: 'dj' })).toBe('/catalogo?categories=dj');
  });

  test('prefiere slug sobre id', () => {
    expect(catalogCategoryHref({ id: 'x', slug: 'salon-de-fiestas' })).toBe('/catalogo?categories=salon-de-fiestas');
  });

  test('cae a id (que en el contrato público ya es el slug)', () => {
    expect(catalogCategoryHref({ id: 'catering' })).toBe('/catalogo?categories=catering');
  });

  test('sin slug ni id → catálogo completo, nunca "undefined"', () => {
    expect(catalogCategoryHref({})).toBe('/catalogo');
    expect(catalogCategoryHref(null)).toBe('/catalogo');
    expect(categorySlug({ slug: '   ' })).toBeNull();
  });

  test('codifica el slug', () => {
    expect(catalogCategoryHref({ slug: 'a b' })).toBe('/catalogo?categories=a%20b');
  });
});

describe('ningún componente usa el parámetro viejo ?categoria=', () => {
  const ROOT = path.resolve(__dirname, '..', '..');
  function walk(dir, acc = []) {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== '__tests__') walk(rel, acc); }
      else if (e.name.endsWith('.js')) acc.push(rel);
    }
    return acc;
  }
  test('sin hrefs con ?categoria=', () => {
    const files = ['app', 'components'].flatMap((d) => walk(d));
    const hits = files.filter((f) => /catalogo\?categoria=/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
    expect(hits).toEqual([]);
  });
});
