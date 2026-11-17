// Fragmentos de URL (`#ancla`): todo enlace con fragmento debe apuntar a un
// `id` que exista en el código.
//
// Barrido ESTÁTICO. El caso que lo motivó: el menú de usuario del navbar
// enlazaba a `/dashboard/cliente#favoritos` y no existía ningún
// `id="favoritos"` — el enlace navegaba a la página pero no anclaba a nada.
// Este test impide volver a introducir un fragmento sin destino, y cubre tanto
// enlaces públicos como los de las áreas autenticadas.
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const SCAN_DIRS = ['app', 'components'];

function walk(dir, acc = []) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return acc;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(rel, acc);
    } else if (entry.name.endsWith('.js')) {
      acc.push(rel);
    }
  }
  return acc;
}

const FILES = SCAN_DIRS.flatMap((d) => walk(d));
const SOURCES = FILES.map((rel) => ({
  rel,
  code: fs.readFileSync(path.join(ROOT, rel), 'utf8'),
}));
const ALL_CODE = SOURCES.map((s) => s.code).join('\n');

/** Todos los `id="..."` declarados en el código. */
function declaredIds() {
  const ids = new Set();
  for (const m of ALL_CODE.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  // `id={...}` dinámico (ej. useId en el formulario de contacto): no se puede
  // resolver estáticamente y tampoco es destino de ningún enlace del sitio.
  return ids;
}

/**
 * Fragmentos referenciados desde un href interno, en forma de literal.
 * Se ignoran los href dinámicos: no se pueden resolver sin ejecutar.
 */
function referencedFragments() {
  const refs = [];
  for (const s of SOURCES) {
    // href="/algo#fragmento" o href="#fragmento"
    for (const m of s.code.matchAll(/href="((?:\/[^"#]*)?#([^"]+))"/g)) {
      refs.push({ file: s.rel, href: m[1], fragment: m[2] });
    }
    // href: '/algo#fragmento' (listas de enlaces, como las del footer)
    for (const m of s.code.matchAll(/href:\s*'((?:\/[^'#]*)?#([^']+))'/g)) {
      refs.push({ file: s.rel, href: m[1], fragment: m[2] });
    }
  }
  return refs;
}

const IDS = declaredIds();
const REFS = referencedFragments();

describe('el barrido encuentra lo que debe', () => {
  test('detecta fragmentos referenciados', () => {
    expect(REFS.length).toBeGreaterThan(0);
  });

  test('incluye el ancla de «Cómo funciona» y la de favoritos', () => {
    const frags = REFS.map((r) => r.fragment);
    expect(frags).toContain('como-funciona');
    expect(frags).toContain('favoritos');
  });
});

describe('todo fragmento tiene destino', () => {
  test('cada fragmento referenciado corresponde a un id declarado', () => {
    const roto = REFS.filter((r) => !IDS.has(r.fragment))
      .map((r) => `${r.file} → ${r.href}`);
    expect(roto).toEqual([]);
  });

  test('ningún href queda reducido a un «#» suelto', () => {
    const vacios = REFS.filter((r) => r.fragment.trim() === '' || r.href === '#');
    expect(vacios).toEqual([]);
  });
});

describe('anclas concretas', () => {
  test('existe id="favoritos" para /dashboard/cliente#favoritos', () => {
    expect(IDS.has('favoritos')).toBe(true);
    const owner = SOURCES.find((s) => /\bid="favoritos"/.test(s.code));
    // Debe estar en la página del dashboard del cliente, que es a donde apunta
    // el enlace — no en cualquier otro archivo.
    expect(owner.rel).toBe(path.join('app', 'dashboard', 'cliente', 'page.js'));
  });

  test('el id de favoritos está en un contenedor semántico, no en un div suelto', () => {
    const owner = SOURCES.find((s) => /\bid="favoritos"/.test(s.code));
    expect(owner.code).toMatch(/<section id="favoritos"/);
  });

  test('existe id="como-funciona" en la home', () => {
    expect(IDS.has('como-funciona')).toBe(true);
    const owner = SOURCES.find((s) => /\bid="como-funciona"/.test(s.code));
    expect(owner.rel).toBe(path.join('app', 'page.js'));
  });
});
