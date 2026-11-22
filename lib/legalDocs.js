// ─── REGISTRO DE DOCUMENTOS LEGALES ──────────────────────────────────────────
//
// Fuente única de qué documentos legales existen, su versión, su fecha, su
// estado y EN QUÉ ÁREA se publican. Lo consumen los centros legales, el footer,
// los documentos relacionados y el encabezado de cada página. Agregar o
// versionar un documento es editar este archivo — no hay otro paso.
//
// ÁREAS (LEGAL_SPACES) — los documentos de cliente y de proveedor NO se cruzan:
//   cliente   → eventonow.com            /legal, /terminos, /terminos/cancelaciones, /privacidad
//   proveedor → proveedores.eventonow.com /provider/legal, /provider/legal/condiciones,
//                                         /provider/legal/privacidad
// El proxy (proxy.js) solo deja pasar /provider/* en el host de proveedores, por
// eso los documentos de proveedor viven bajo /provider/legal. La Política de
// privacidad es una sola (un único responsable de los datos) y se publica en las
// dos áreas con el mismo contenido.
//
// Estados:
//   'preliminary' → versión preliminar publicada, en revisión legal, sin valor
//                   contractual. Muestra aviso visible y no se puede aceptar.
//   'published'   → versión vigente (requiere fecha de vigencia y la compuerta
//                   de lib/site.js abierta). Ningún documento lo está hoy.
//
// Fechas: 'YYYY-MM-DD' en fecha de Uruguay. Se formatean con formatLegalDate,
// sin pasar por Date (no hay corrimiento de zona horaria).

export const LEGAL_DOCS = Object.freeze({
  terminos: Object.freeze({
    key: 'terminos',
    title: 'Términos y condiciones',
    shortTitle: 'Términos',
    audience: 'Clientes',
    summary: 'Las reglas de uso de la plataforma: cómo se solicita, reserva y paga cada servicio, y qué rol cumple Eventonow.',
    version: '0.4',
    updatedOn: '2026-11-22',
    effectiveOn: null,
    status: 'preliminary',
  }),
  cancelaciones: Object.freeze({
    key: 'cancelaciones',
    title: 'Política de cancelaciones y reembolsos',
    shortTitle: 'Cancelaciones',
    audience: 'Clientes',
    summary: 'Qué pasa si cancelás vos, si cancela el proveedor o si ocurre algo fuera de control: devoluciones, créditos y derecho de arrepentimiento.',
    version: '0.3',
    updatedOn: '2026-11-22',
    effectiveOn: null,
    status: 'preliminary',
  }),
  proveedores: Object.freeze({
    key: 'proveedores',
    title: 'Condiciones para proveedores',
    shortTitle: 'Condiciones',
    audience: 'Proveedores',
    summary: 'Tu relación con Eventonow: comisión, cobros, forma de pago del cliente, obligaciones en cada reserva, cancelaciones, penalidades y revisión.',
    version: '0.4',
    updatedOn: '2026-11-22',
    effectiveOn: null,
    status: 'preliminary',
  }),
  privacidad: Object.freeze({
    key: 'privacidad',
    title: 'Política de privacidad',
    shortTitle: 'Privacidad',
    audience: 'Clientes y proveedores',
    summary: 'Qué datos personales tratamos, para qué, con quién se comparten y cómo ejercer tus derechos.',
    version: '0.1',
    updatedOn: '2026-11-19',
    effectiveOn: null,
    status: 'preliminary',
  }),
});

/**
 * Áreas de publicación. Cada área tiene su centro legal y su lista de
 * documentos con la URL que les corresponde EN ESA ÁREA.
 */
export const LEGAL_SPACES = Object.freeze({
  cliente: Object.freeze({
    key: 'cliente',
    hub: '/legal',
    hubTitle: 'Centro legal',
    docs: Object.freeze([
      Object.freeze({ key: 'terminos',      href: '/terminos' }),
      Object.freeze({ key: 'cancelaciones', href: '/terminos/cancelaciones' }),
      Object.freeze({ key: 'privacidad',    href: '/privacidad' }),
    ]),
  }),
  proveedor: Object.freeze({
    key: 'proveedor',
    hub: '/provider/legal',
    hubTitle: 'Centro legal para proveedores',
    docs: Object.freeze([
      Object.freeze({ key: 'proveedores', href: '/provider/legal/condiciones' }),
      Object.freeze({ key: 'privacidad',  href: '/provider/legal/privacidad' }),
    ]),
  }),
});

/** Documentos de un área, con su URL en esa área, en orden de presentación. */
export function spaceDocs(spaceKey) {
  const space = LEGAL_SPACES[spaceKey];
  if (!space) throw new TypeError(`Área legal desconocida: ${spaceKey}`);
  return space.docs.map(({ key, href }) => ({ ...LEGAL_DOCS[key], href }));
}

/** URL de un documento dentro de un área. */
export function docHref(key, spaceKey) {
  const entry = LEGAL_SPACES[spaceKey]?.docs.find((d) => d.key === key);
  if (!entry) throw new TypeError(`El documento ${key} no se publica en el área ${spaceKey}`);
  return entry.href;
}

export const STATUS_LABELS = Object.freeze({
  preliminary: 'Versión preliminar',
  published: 'Vigente',
});

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

/** 'YYYY-MM-DD' → '19 de noviembre de 2026'. */
export function formatLegalDate(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12) throw new TypeError(`Fecha inválida: ${ymd}`);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}

/** Texto de la línea «Vigencia» del encabezado de cada documento. */
export function effectiveLabel(doc) {
  return doc.effectiveOn ? formatLegalDate(doc.effectiveOn) : 'pendiente — versión preliminar';
}

/** Documentos relacionados: los demás de la MISMA área. Nunca cruza áreas. */
export function relatedDocs(key, spaceKey) {
  return spaceDocs(spaceKey).filter((d) => d.key !== key);
}
