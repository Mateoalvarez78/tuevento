// Barrido ESTÁTICO del código de las áreas públicas.
//
// Es la red de seguridad contra la REINTRODUCCIÓN de los problemas que
// motivaron esta tanda: marca vieja, badges de medios de pago inexistentes,
// testimonios con avatares generados, credenciales demo visibles y enlaces
// muertos. Un test de render solo cubre el componente que renderiza; esto cubre
// el árbol entero, incluidas las páginas que todavía no tienen test propio.
//
// Deliberadamente se saltan los COMENTARIOS: varios archivos documentan en
// prosa qué se retiró y por qué (mencionando "Stripe", "TuEvento", etc.), y esa
// documentación es valiosa — lo que no puede volver es el código que lo
// renderiza.
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');

// Áreas públicas + componentes compartidos. `mocks/` queda fuera a propósito:
// son fixtures de desarrollo que no se renderizan en producción.
const SCAN_DIRS = ['app', 'components', 'lib', 'services', 'hooks', 'utils'];

// Rutas privadas (detrás de autenticación). Se excluyen de las reglas de
// contenido PÚBLICO, pero no de la regla de marca.
const PRIVATE_PATTERNS = [
  path.join('app', 'admin'),
  path.join('app', 'dashboard'),
  path.join('app', 'provider'),
  path.join('components', 'dashboard'),
];

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

/** Quita comentarios de línea y de bloque, y el contenido de los strings JSX de comentario. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')   // /* ... */ (incluye los {/* ... */} de JSX)
    .replace(/^\s*\/\/.*$/gm, '');       // // ... en línea propia
}

const FILES = SCAN_DIRS.flatMap((d) => walk(d));

const SOURCES = FILES.map((rel) => ({
  rel,
  isPrivate: PRIVATE_PATTERNS.some((p) => rel.startsWith(p)),
  code: stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8')),
}));

const PUBLIC_SOURCES = SOURCES.filter((s) => !s.isPrivate);

/** Archivos cuyo código (sin comentarios) contiene el patrón. */
function offenders(sources, pattern) {
  return sources.filter((s) => pattern.test(s.code)).map((s) => s.rel);
}

describe('el barrido cubre lo que dice cubrir', () => {
  test('encontró una cantidad razonable de archivos', () => {
    expect(FILES.length).toBeGreaterThan(50);
  });

  test('incluye las páginas públicas nuevas', () => {
    for (const f of [
      path.join('app', 'contacto', 'page.js'),
      path.join('app', 'terminos', 'page.js'),
      path.join('app', 'privacidad', 'page.js'),
      path.join('app', 'sitemap.js'),
      path.join('app', 'robots.js'),
    ]) {
      expect(FILES).toContain(f);
    }
  });

  test('stripComments no borra código real', () => {
    const code = stripComments(`
      // comentario
      const a = 1; /* bloque */ const b = 2;
      {/* comentario JSX con la palabra Stripe */}
    `);
    expect(code).toContain('const a = 1;');
    expect(code).toContain('const b = 2;');
    expect(code).not.toContain('Stripe');
  });
});

describe('marca unificada', () => {
  test('ningún archivo (público o privado) renderiza la marca anterior', () => {
    expect(offenders(SOURCES, /TuEvento/)).toEqual([]);
  });

  test('no queda el monograma "TE" hardcodeado en un logo', () => {
    // El patrón busca el literal dentro de un nodo de texto JSX.
    expect(offenders(SOURCES, />\s*TE\s*</)).toEqual([]);
  });

  test('no hay referencias a proyectos ajenos', () => {
    expect(offenders(SOURCES, /clinexus/i)).toEqual([]);
    expect(offenders(SOURCES, /eventumya/i)).toEqual([]);
  });
});

describe('medios de pago', () => {
  test('el código público no menciona Stripe ni Norton', () => {
    expect(offenders(PUBLIC_SOURCES, /Stripe/)).toEqual([]);
    expect(offenders(PUBLIC_SOURCES, /Norton/)).toEqual([]);
  });

  test('el código público no anuncia dLocal (el checkout no está operativo)', () => {
    // `lib/site.js` sí lo nombra, dentro del console.warn del bloqueo de
    // publicación: es un mensaje para el log de BUILD dirigido a quien
    // despliega ("NO enviar la URL a dLocal en este estado"), nunca texto
    // renderizado al visitante. Exento a propósito y de forma explícita, para
    // que la regla siga siendo estricta para todo lo demás.
    const ALLOWED = [path.join('lib', 'site.js')];
    const hits = offenders(PUBLIC_SOURCES, /dlocal/i).filter((f) => !ALLOWED.includes(f));
    expect(hits).toEqual([]);
  });

  test('la mención exenta en lib/site.js no es contenido renderizable', () => {
    const site = SOURCES.find((s) => s.rel === path.join('lib', 'site.js'));
    // Aparece solo dentro del aviso de consola, no en un valor exportado que
    // algún componente pudiera mostrar.
    const lines = site.code.split('\n').filter((l) => /dlocal/i.test(l));
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((l) => expect(l).not.toMatch(/^export /));
  });

  test('no quedan listas de badges de tarjetas en el código público', () => {
    // El patrón de la fila que se retiró: un array de nombres de medios de pago.
    expect(offenders(PUBLIC_SOURCES, /\[\s*'VISA'/)).toEqual([]);
    expect(offenders(PUBLIC_SOURCES, /'Mastercard'/)).toEqual([]);
  });
});

describe('contenido demo y testimonios', () => {
  test('ningún archivo público usa avatares generados', () => {
    expect(offenders(PUBLIC_SOURCES, /pravatar/i)).toEqual([]);
  });

  test('no quedan las estadísticas inventadas', () => {
    for (const stat of [/'500\+'/, /'15K\+'/, /\+500 proveedores/, /miles de proveedores/]) {
      expect(offenders(PUBLIC_SOURCES, stat)).toEqual([]);
    }
  });
});

describe('credenciales demo', () => {
  test('la contraseña demo nunca aparece en un archivo sin condición de entorno', () => {
    const withDemoPassword = PUBLIC_SOURCES.filter((s) => /'123456'/.test(s.code));
    // Si algún archivo la usa, debe estar protegido por una condición explícita
    // de entorno en el mismo archivo.
    withDemoPassword.forEach((s) => {
      expect(s.code).toMatch(/NODE_ENV !== 'production'/);
      expect(s.code).toMatch(/NEXT_PUBLIC_SHOW_DEMO_LOGIN === 'true'/);
    });
  });

  test('el login no muestra el bloque demo sin la doble condición', () => {
    const login = SOURCES.find((s) => s.rel === path.join('app', 'login', 'page.js'));
    expect(login).toBeDefined();
    expect(login.code).toMatch(/showDemoLogin/);
    expect(login.code).toMatch(/NODE_ENV !== 'production'/);
    expect(login.code).toMatch(/NEXT_PUBLIC_SHOW_DEMO_LOGIN === 'true'/);
  });
});

describe('enlaces muertos', () => {
  test('ningún archivo público tiene href="#"', () => {
    expect(offenders(PUBLIC_SOURCES, /href=["']#["']/)).toEqual([]);
  });

  test('ningún archivo público define href: "#" en una lista de enlaces', () => {
    expect(offenders(PUBLIC_SOURCES, /href:\s*['"]#['"]/)).toEqual([]);
  });

  test('tampoco en las áreas privadas', () => {
    expect(offenders(SOURCES, /href=["']#["']/)).toEqual([]);
  });
});

describe('pago fuera de la plataforma', () => {
  test('el código público no describe coordinar una seña con el proveedor', () => {
    expect(offenders(PUBLIC_SOURCES, /coordinar el pago/i)).toEqual([]);
    expect(offenders(PUBLIC_SOURCES, /Seña sugerida/i)).toEqual([]);
  });

  test('el código público no promete un email de confirmación', () => {
    expect(offenders(PUBLIC_SOURCES, /email de confirmación/i)).toEqual([]);
  });
});

describe('placeholders', () => {
  test('no hay lorem ipsum en ninguna parte', () => {
    expect(offenders(SOURCES, /lorem ipsum/i)).toEqual([]);
  });
});
