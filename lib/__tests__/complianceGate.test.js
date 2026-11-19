// Compuerta de cumplimiento: qué se publica, qué no, y qué puede verse solo en
// desarrollo.
//
// El problema que corrige: `noindex` nunca fue control de acceso. Las páginas
// legales se servían completas con un sello de borrador, y cualquiera con la
// URL —un revisor llega siguiendo el footer— las abría. Además la compuerta
// anterior solo miraba datos legales y revisión jurídica, así que con RUT y
// domicilio cargados habría publicado unos Términos sin cancelaciones,
// reembolsos, retracto, reprogramaciones ni contracargos.
//
// Varios tests re-importan el módulo con `NODE_ENV=production` para comprobar
// el comportamiento REAL de un build productivo, que es distinto del de los
// tests (donde los borradores sí se ven, a propósito).
import { describe, test, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** Carga `lib/site.js` con un NODE_ENV dado, re-evaluando el módulo. */
async function loadSiteWithEnv(nodeEnv) {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', nodeEnv);
  return import('@/lib/site');
}

// ── Secciones de política: estados explícitos ──────────────────────────────

describe('secciones de política obligatorias', () => {
  test('las cinco están modeladas de forma explícita', async () => {
    const { LEGAL_POLICY_SECTIONS } = await import('@/lib/site');
    expect(Object.keys(LEGAL_POLICY_SECTIONS).sort()).toEqual([
      'cancellations', 'chargebacks', 'refunds', 'rescheduling', 'withdrawal',
    ]);
  });

  test('las cinco siguen en false en esta etapa', async () => {
    const { LEGAL_POLICY_SECTIONS } = await import('@/lib/site');
    Object.entries(LEGAL_POLICY_SECTIONS).forEach(([, v]) => expect(v).toBe(false));
  });

  test('missingPolicySections devuelve las cinco', async () => {
    const { missingPolicySections } = await import('@/lib/site');
    expect(missingPolicySections().sort()).toEqual([
      'cancellations', 'chargebacks', 'refunds', 'rescheduling', 'withdrawal',
    ]);
  });

  test('LEGAL_SECTIONS_COMPLETE es false', async () => {
    const { LEGAL_SECTIONS_COMPLETE } = await import('@/lib/site');
    expect(LEGAL_SECTIONS_COMPLETE).toBe(false);
  });

  test('cada sección tiene etiqueta legible para el mensaje de bloqueo', async () => {
    const { LEGAL_POLICY_SECTIONS, POLICY_SECTION_LABELS } = await import('@/lib/site');
    Object.keys(LEGAL_POLICY_SECTIONS).forEach((k) => {
      expect(typeof POLICY_SECTION_LABELS[k]).toBe('string');
      expect(POLICY_SECTION_LABELS[k].length).toBeGreaterThan(0);
    });
  });

  test('una sección a medias (no estrictamente true) cuenta como faltante', async () => {
    // Fail-closed: solo `true` cierra una sección. Un valor truthy cualquiera
    // (una cadena, un objeto) no debe pasar por aprobada.
    const { missingPolicySections, LEGAL_POLICY_SECTIONS } = await import('@/lib/site');
    const original = LEGAL_POLICY_SECTIONS.refunds;
    try {
      LEGAL_POLICY_SECTIONS.refunds = 'borrador';
      expect(missingPolicySections()).toContain('refunds');
    } finally {
      LEGAL_POLICY_SECTIONS.refunds = original;
    }
  });
});

// ── La compuerta exige las tres condiciones ────────────────────────────────

describe('PUBLIC_LEGAL_READY — tres candados independientes', () => {
  test('es false hoy', async () => {
    const { PUBLIC_LEGAL_READY } = await import('@/lib/site');
    expect(PUBLIC_LEGAL_READY).toBe(false);
  });

  test('equivale exactamente a datos ∧ revisión ∧ secciones', async () => {
    const m = await import('@/lib/site');
    expect(m.PUBLIC_LEGAL_READY).toBe(
      m.LEGAL_DATA_COMPLETE && m.LEGAL_DOCS_REVIEWED && m.LEGAL_SECTIONS_COMPLETE
    );
  });

  test('completar RUT/domicilio y marcar la revisión NO alcanza por sí solo', async () => {
    // Es el gap que motivó el tercer candado: se simulan las dos primeras
    // condiciones cumplidas y se verifica que la compuerta sigue cerrada
    // porque las secciones de política están abiertas.
    const m = await import('@/lib/site');
    const dataComplete = true;
    const reviewed = true;
    const sectionsComplete = m.LEGAL_SECTIONS_COMPLETE; // false
    expect(dataComplete && reviewed && sectionsComplete).toBe(false);
  });

  test('si alguna vez es true, no puede quedar ningún bloqueo', async () => {
    const { PUBLIC_LEGAL_READY, legalBlockers } = await import('@/lib/site');
    if (PUBLIC_LEGAL_READY) expect(legalBlockers()).toEqual([]);
    else expect(legalBlockers().length).toBeGreaterThan(0);
  });

  test('legalBlockers nombra el bloqueo de secciones con etiquetas legibles', async () => {
    const { legalBlockers } = await import('@/lib/site');
    const texto = legalBlockers().join(' | ');
    for (const t of ['cancelaciones', 'reembolsos', 'retracto', 'reprogramaciones', 'contracargos']) {
      expect(texto).toContain(t);
    }
  });
});

// ── Contacto coordinado con Privacidad ─────────────────────────────────────

describe('coordinación formulario ↔ documentos legales', () => {
  test('PUBLIC_CONTACT_READY está atado a PUBLIC_LEGAL_READY', async () => {
    const { PUBLIC_CONTACT_READY, PUBLIC_LEGAL_READY } = await import('@/lib/site');
    expect(PUBLIC_CONTACT_READY).toBe(PUBLIC_LEGAL_READY);
  });

  test('el formulario no puede quedar publicado sin Privacidad vigente', async () => {
    const { PUBLIC_CONTACT_READY, PUBLIC_LEGAL_READY } = await import('@/lib/site');
    // La implicación que importa: contacto publicado ⇒ legales publicadas.
    expect(!PUBLIC_CONTACT_READY || PUBLIC_LEGAL_READY).toBe(true);
  });

  test('hoy ninguno de los dos está publicado', async () => {
    const { PUBLIC_CONTACT_READY, PUBLIC_LEGAL_READY } = await import('@/lib/site');
    expect(PUBLIC_CONTACT_READY).toBe(false);
    expect(PUBLIC_LEGAL_READY).toBe(false);
  });
});

// ── Visibilidad de borradores por entorno ──────────────────────────────────

describe('DRAFTS_VISIBLE según entorno', () => {
  test('en test los borradores se ven (para poder desarrollarlos y probarlos)', async () => {
    const { DRAFTS_VISIBLE, LEGAL_PAGES_REACHABLE, CONTACT_REACHABLE } = await loadSiteWithEnv('test');
    expect(DRAFTS_VISIBLE).toBe(true);
    expect(LEGAL_PAGES_REACHABLE).toBe(true);
    expect(CONTACT_REACHABLE).toBe(true);
  });

  test('en development también', async () => {
    const { DRAFTS_VISIBLE, LEGAL_PAGES_REACHABLE } = await loadSiteWithEnv('development');
    expect(DRAFTS_VISIBLE).toBe(true);
    expect(LEGAL_PAGES_REACHABLE).toBe(true);
  });

  test('en PRODUCCIÓN no hay borradores: solo versión preliminar si se decidió', async () => {
    const m = await loadSiteWithEnv('production');
    expect(m.DRAFTS_VISIBLE).toBe(false);
    expect(m.SHOW_INTERNAL_LEGAL_NOTES).toBe(false);
    expect(m.PUBLIC_LEGAL_READY).toBe(false);
    // Legales: alcanzables solo por la decisión explícita de versión preliminar.
    expect(m.LEGAL_PAGES_REACHABLE).toBe(m.LEGAL_PREVIEW_PUBLISHED);
    // Contacto: sigue cerrado — no depende de la versión preliminar.
    expect(m.CONTACT_REACHABLE).toBe(false);
  });

  test('en producción la alcanzabilidad depende SOLO de constantes del repo, no del entorno', async () => {
    const m = await loadSiteWithEnv('production');
    expect(m.LEGAL_PAGES_REACHABLE).toBe(m.PUBLIC_LEGAL_READY || m.LEGAL_PREVIEW_PUBLISHED);
    expect(m.CONTACT_REACHABLE).toBe(m.PUBLIC_CONTACT_READY);
  });

  test('la versión preliminar NO abre la compuerta real', async () => {
    const m = await loadSiteWithEnv('production');
    expect(m.PUBLIC_LEGAL_READY).toBe(m.LEGAL_DATA_COMPLETE && m.LEGAL_DOCS_REVIEWED && m.LEGAL_SECTIONS_COMPLETE);
    expect(m.PUBLIC_CONTACT_READY).toBe(m.PUBLIC_LEGAL_READY);
  });

  test('las notas internas de trabajo se ven en dev y test, nunca en producción', async () => {
    expect((await loadSiteWithEnv('development')).SHOW_INTERNAL_LEGAL_NOTES).toBe(true);
    expect((await loadSiteWithEnv('test')).SHOW_INTERNAL_LEGAL_NOTES).toBe(true);
    expect((await loadSiteWithEnv('production')).SHOW_INTERNAL_LEGAL_NOTES).toBe(false);
  });
});

// ── Nada de puertas traseras ───────────────────────────────────────────────

describe('sin vías de escape', () => {
  test('ninguna constante de la compuerta se controla por una env var pública', async () => {
    // Una NEXT_PUBLIC_* sería una puerta trasera: cualquiera podría leerla y,
    // peor, se podría encender por error en Vercel. La compuerta depende solo
    // de datos del repo y de NODE_ENV.
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../site.js', import.meta.url), 'utf8')
    );
    const gateBlock = src.slice(src.indexOf('DRAFTS_VISIBLE'));
    expect(gateBlock).not.toMatch(/NEXT_PUBLIC_/);
  });

  test('lib/site.js no lee query params ni headers', async () => {
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../site.js', import.meta.url), 'utf8')
    );
    for (const forbidden of ['searchParams', 'useSearchParams', 'headers()', 'cookies()', 'window.location']) {
      expect(src).not.toContain(forbidden);
    }
  });
});
