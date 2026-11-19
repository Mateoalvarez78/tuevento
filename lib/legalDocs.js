// ─── REGISTRO DE DOCUMENTOS LEGALES ──────────────────────────────────────────
//
// Fuente única de qué documentos legales existen, su versión, su fecha y su
// estado. La consumen el Centro legal (/legal), el footer, los enlaces
// cruzados entre documentos y el encabezado de cada página. Agregar o
// versionar un documento es editar este archivo — no hay otro paso.
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
    href: '/terminos',
    title: 'Términos y condiciones',
    shortTitle: 'Términos',
    audience: 'Clientes y proveedores',
    summary: 'Las reglas generales de la plataforma: cómo se solicita, acepta, reserva y paga cada servicio, y qué rol cumple Eventonow.',
    version: '0.2',
    updatedOn: '2026-11-19',
    effectiveOn: null,
    status: 'preliminary',
  }),
  cancelaciones: Object.freeze({
    key: 'cancelaciones',
    href: '/terminos/cancelaciones',
    title: 'Política de cancelaciones y reembolsos',
    shortTitle: 'Cancelaciones',
    audience: 'Clientes',
    summary: 'Qué pasa si cancelás vos, si cancela el proveedor o si ocurre algo fuera de control: devoluciones, créditos y derecho de arrepentimiento.',
    version: '0.1',
    updatedOn: '2026-11-19',
    effectiveOn: null,
    status: 'preliminary',
  }),
  proveedores: Object.freeze({
    key: 'proveedores',
    href: '/terminos/proveedores',
    title: 'Condiciones para proveedores',
    shortTitle: 'Proveedores',
    audience: 'Proveedores',
    summary: 'Comisión, cobros, seña y saldo, obligaciones en cada reserva, cancelaciones, penalidades y procedimiento de revisión.',
    version: '0.2',
    updatedOn: '2026-11-19',
    effectiveOn: null,
    status: 'preliminary',
  }),
  privacidad: Object.freeze({
    key: 'privacidad',
    href: '/privacidad',
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

/** Orden de presentación en el Centro legal y en el footer. */
export const LEGAL_DOCS_ORDER = ['terminos', 'cancelaciones', 'proveedores', 'privacidad'];

export const LEGAL_DOCS_LIST = LEGAL_DOCS_ORDER.map((k) => LEGAL_DOCS[k]);

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

/** Documentos relacionados con uno dado (todos los demás, en orden). */
export function relatedDocs(key) {
  return LEGAL_DOCS_LIST.filter((d) => d.key !== key);
}
