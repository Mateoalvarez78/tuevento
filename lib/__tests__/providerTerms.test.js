// Borrador de condiciones para proveedores: límites de la escala, aislamiento
// del documento y que nada transaccional dependa de él.
import { describe, test, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const PAGE = path.join('app', 'provider', 'legal', 'condiciones', 'page.js');

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

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

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Código sin comentarios: nombrar algo en prosa no es usarlo. */
const code = (rel) => read(rel)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

// ── Escala de penalizaciones ───────────────────────────────────────────────

describe('escala de penalizaciones: sin huecos ni superposiciones', () => {
  test('cada día de 0 a 400 cae en exactamente un tramo', async () => {
    const { PENALTY_SCALE } = await import('@/lib/providerTerms');
    for (let d = 0; d <= 400; d++) {
      const matches = PENALTY_SCALE.filter(
        (t) => d >= t.minDays && (t.maxDays === null || d <= t.maxDays)
      );
      expect(matches, `día ${d}`).toHaveLength(1);
    }
  });

  test.each([
    [0, 15], [6, 15],
    [7, 10], [14, 10],
    [15, 5], [30, 5],
    [31, 0], [365, 0],
  ])('%i días antes → %i %%', async (days, percent) => {
    const { penaltyTierFor } = await import('@/lib/providerTerms');
    expect(penaltyTierFor(days).percent).toBe(percent);
  });

  test('después del evento queda fuera de la escala (pendiente de definir)', async () => {
    const { penaltyTierFor } = await import('@/lib/providerTerms');
    expect(penaltyTierFor(-1)).toBeNull();
  });

  test('no admite fracciones de día: la medida son días corridos enteros', async () => {
    const { penaltyTierFor } = await import('@/lib/providerTerms');
    expect(() => penaltyTierFor(14.5)).toThrow(TypeError);
  });

  test('los porcentajes crecen al acercarse el evento', async () => {
    const { PENALTY_SCALE } = await import('@/lib/providerTerms');
    const byMin = [...PENALTY_SCALE].sort((a, b) => b.minDays - a.minDays);
    for (let i = 1; i < byMin.length; i++) {
      expect(byMin[i].percent).toBeGreaterThan(byMin[i - 1].percent);
    }
  });
});

// ── Parámetros comerciales ─────────────────────────────────────────────────

describe('parámetros comerciales', () => {
  test('pago único por el total, sin seña ni saldo', async () => {
    const { COMMERCIAL, PAYMENT_HOURS } = await import('@/lib/providerTerms');
    expect(COMMERCIAL.singlePayment).toBe(true);
    expect(PAYMENT_HOURS).toBe(48);
    expect(COMMERCIAL).not.toHaveProperty('depositPercent');
    expect(COMMERCIAL).not.toHaveProperty('balancePercent');
  });

  test('la escala del cliente conserva el efecto de la antigua seña (20 %) + mitad del saldo (40 %)', async () => {
    const { COMMERCIAL, CLIENT_CANCELLATION_SCALE } = await import('@/lib/providerTerms');
    expect(COMMERCIAL.clientRetainedPercentMid).toBe(20);
    expect(COMMERCIAL.clientRetainedPercentLate).toBe(60);
    const text = CLIENT_CANCELLATION_SCALE.map((t) => t.refund).join(' ');
    expect(text).not.toMatch(/seña|saldo/i);
    expect(text).toContain(`${COMMERCIAL.clientRetainedPercentMid} %`);
    expect(text).toContain(`${COMMERCIAL.clientRetainedPercentLate} %`);
  });

  test('cuatro escalones de reincidencia', async () => {
    const { RECIDIVISM_STEPS } = await import('@/lib/providerTerms');
    expect(RECIDIVISM_STEPS).toHaveLength(4);
  });
});

// ── Estado y compuerta ─────────────────────────────────────────────────────

describe('estado del documento', () => {
  test('versión preliminar, sin fecha de vigencia y sin publicar como definitiva', async () => {
    const m = await import('@/lib/providerTerms');
    expect(m.PROVIDER_TERMS_DOC.status).toBe('preliminary');
    expect(m.PROVIDER_TERMS_DOC.effectiveOn).toBeNull();
    expect(m.PROVIDER_TERMS_PUBLISHED).toBe(false);
  });

  test('sale del registro único de documentos', async () => {
    const { PROVIDER_TERMS_DOC } = await import('@/lib/providerTerms');
    const { LEGAL_DOCS } = await import('@/lib/legalDocs');
    expect(PROVIDER_TERMS_DOC).toBe(LEGAL_DOCS.proveedores);
  });

  test('en PRODUCCIÓN se sirve solo por la decisión de versión preliminar', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    const m = await import('@/lib/providerTerms');
    const site = await import('@/lib/site');
    expect(m.PROVIDER_TERMS_REACHABLE).toBe(m.PROVIDER_TERMS_PUBLISHED || site.LEGAL_PREVIEW_PUBLISHED);
  });

  test('en desarrollo siempre, para poder revisarlo', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');
    const m = await import('@/lib/providerTerms');
    expect(m.PROVIDER_TERMS_REACHABLE).toBe(true);
  });

  test('su compuerta definitiva no depende de la de Términos/Privacidad', () => {
    const src = code(path.join('lib', 'providerTerms.js'));
    expect(src).not.toMatch(/PUBLIC_LEGAL_READY/);
    expect(src).not.toMatch(/LEGAL_PAGES_REACHABLE/);
  });
});

// ── Aislamiento de lo transaccional ───────────────────────────────────────

describe('los parámetros no se usan en lógica transaccional', () => {
  const FILES = ['app', 'components', 'lib', 'services', 'hooks', 'utils'].flatMap((d) => walk(d));

  test('solo las páginas legales importan lib/providerTerms', () => {
    const LEGAL_ROUTES = [path.join('app', 'terminos') + path.sep, path.join('app', 'legal') + path.sep, path.join('app', 'provider', 'legal') + path.sep];
    const importers = FILES
      .filter((f) => f !== path.join('lib', 'providerTerms.js'))
      .filter((f) => /from '@\/lib\/providerTerms'/.test(read(f)));
    expect(importers.length).toBeGreaterThan(0);
    importers.forEach((f) => {
      expect(LEGAL_ROUTES.some((r) => f.startsWith(r)), f).toBe(true);
    });
  });

  test('la página responde 404 sin compuerta y siempre lleva noindex', () => {
    const src = read(PAGE);
    expect(src).toMatch(/if \(!PROVIDER_TERMS_REACHABLE\) notFound\(\)/);
    expect(src).toMatch(/robots: \{ index: false, follow: false \}/);
  });

  test('el sitemap no incluye documentos preliminares', () => {
    expect(code(path.join('app', 'sitemap.js'))).not.toMatch(/proveedores|cancelaciones|\/legal/);
  });
});

// ── Escala de cancelación del cliente (propuesta) ─────────────────────────

describe('escala de cancelación del cliente: sin huecos ni superposiciones', () => {
  test('cada día de 0 a 400 cae en exactamente un tramo', async () => {
    const { CLIENT_CANCELLATION_SCALE } = await import('@/lib/providerTerms');
    for (let d = 0; d <= 400; d++) {
      const matches = CLIENT_CANCELLATION_SCALE.filter(
        (t) => d >= t.minDays && (t.maxDays === null || d <= t.maxDays)
      );
      expect(matches, `día ${d}`).toHaveLength(1);
    }
  });

  test.each([[0, 0], [6, 0], [7, 7], [30, 7], [31, 31]])('%i días → tramo que empieza en %i', async (d, min) => {
    const { clientCancellationTierFor } = await import('@/lib/providerTerms');
    expect(clientCancellationTierFor(d).minDays).toBe(min);
  });
});

// ── Índice ─────────────────────────────────────────────────────────────────

describe('índice del documento', () => {
  const src = read(PAGE);
  const ids = [...src.matchAll(/\{ id: '([^']+)',\s+title:/g)].map((m) => m[1]);

  test('tiene las 16 secciones pedidas + contenido, cambios y ley aplicable', () => {
    expect(ids).toHaveLength(19);
  });

  test('cada entrada del índice apunta a un encabezado que existe', () => {
    ids.forEach((id) => expect(src).toContain(`id="${id}"`));
  });

  test('las cláusulas abiertas se rotulan con el componente de pendiente', () => {
    expect((src.match(/<PendingLegal/g) || []).length).toBeGreaterThanOrEqual(10);
  });
});
