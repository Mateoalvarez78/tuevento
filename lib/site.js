// ─── IDENTIDAD DEL SITIO ──────────────────────────────────────────────────────
// Fuente única de marca, dominio, identidad legal y canales de contacto.
//
// POR QUÉ EXISTE: antes de este módulo el nombre de la marca estaba escrito a
// mano en seis archivos (layout, page, Navbar, Footer, login, registro) y el
// correo de contacto en dos. Así fue como el sitio terminó publicado con la
// marca vieja en el <title> mientras el cuerpo decía la nueva. Todo lo que se
// muestra al público sale de acá.
//
// ⚠ NADA DE ESTE ARCHIVO ES SECRETO. Son datos destinados a publicarse (marca,
// dominio, correo de contacto, identificación del titular). No poner acá claves
// ni tokens: para eso están las variables de entorno leídas en el backend, que
// nunca llevan prefijo NEXT_PUBLIC_.

export const BRAND = 'Eventonow';

/**
 * Monograma del logo. Dos letras, derivadas de la marca — no una constante
 * suelta, para que no vuelva a quedar desincronizado ("TE" sobrevivió al
 * cambio de nombre justamente por estar hardcodeado).
 */
export const BRAND_MONOGRAM = `${BRAND[0]}${BRAND[1]}`.toUpperCase();

/**
 * Origen canónico. El apex redirige acá con 308 permanente (verificado), así
 * que esta es la forma que se publica, la que va en el canonical y la que se
 * presenta ante terceros.
 */
export const CANONICAL_ORIGIN = 'https://www.eventonow.com';

export const CONTACT_EMAIL = 'hola@eventonow.com';

/** `mailto:` del CTA de proveedores — un solo lugar, dos consumidores. */
export const PROVIDER_CONTACT_MAILTO =
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quiero ser proveedor')}`;

/**
 * `mailto:` para pedir un presupuesto personalizado. Los paquetes con precio
 * «a consultar» no se reservan directo: el pedido entra por Eventonow (no por
 * un contacto directo con el proveedor) y la reserva resultante se paga dentro
 * de la plataforma, como describen los Términos (punto 7).
 */
export function quoteRequestMailto(serviceName) {
  const subject = serviceName ? `Pedido de presupuesto: ${serviceName}` : 'Pedido de presupuesto';
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/**
 * Teléfono público: NO existe todavía uno comercial confirmado. Queda como
 * `null` explícito y no como cadena vacía, para que los consumidores puedan
 * omitir el campo entero en lugar de renderizar una etiqueta sin valor.
 */
export const CONTACT_PHONE = null;

/**
 * Redes sociales oficiales: NINGUNA existe hoy.
 *
 * Deliberadamente una lista vacía y no una lista de iconos con `href: '#'`.
 * Seis iconos sin destino fue uno de los motivos de rechazo de la revisión
 * anterior. El footer itera sobre esta lista: mientras esté vacía, no renderiza
 * ninguna sección de redes. Agregar una cuenta acá (con su URL real) la publica;
 * no hay ningún otro paso.
 */
export const SOCIAL_LINKS = [];

// ── Identidad legal del titular ────────────────────────────────────────────
//
// Se incluyen ÚNICAMENTE los datos confirmados. Los que faltan NO están
// presentes como claves vacías ni con valores de relleno: están AUSENTES. Un
// `taxId: ''` termina, una refactorización más tarde, renderizado como "RUT:"
// sin número — que es peor que no mostrar nada.
//
// Lo que se publica del titular (decisión de Mateo, 26/11/2026): nombre,
// forma jurídica, razón social, RUT y país. El domicilio y la cédula NO se
// publican: para identificar a una empresa unipersonal alcanza con razón social
// y RUT. `address` y `documentId` siguen soportados por legalIdentityRows por
// si algún día se decide lo contrario, pero NO son obligatorios.
export const LEGAL_ENTITY = {
  /** Nombre del titular, tal como opera. */
  name: 'Mateo Álvarez',
  /** Descriptor de la forma jurídica, confirmado. */
  descriptor: 'empresa unipersonal',
  country: 'Uruguay',
  // TODO(Mateo): cargar la razón social EXACTA como figura en el certificado
  // de DGI/BPS. Descomentar y completar — sin este dato la compuerta legal no
  // abre y la fila «Razón social» no aparece en el sitio.
  //   legalName: '…',
  //
  // TODO(Mateo): cargar el RUT (12 dígitos) de la empresa unipersonal, el mismo
  // declarado en la cuenta del procesador de pagos. Descomentar y completar —
  // sin este dato la fila «RUT» no aparece.
  //   taxId: '…',
  //
  // NO publicar (decidido): `address` (domicilio) ni `documentId` (cédula).
};

/**
 * Campos que tienen que estar presentes para que las páginas legales puedan
 * publicarse como definitivas. `legalName` y `taxId` faltan hoy: son los datos
 * que identifican a la empresa unipersonal ante el procesador de pagos.
 * `address` y `documentId` son OPCIONALES y quedan fuera a propósito.
 */
export const REQUIRED_LEGAL_FIELDS = ['name', 'descriptor', 'legalName', 'taxId'];

// ── Secciones de política obligatorias ─────────────────────────────────────
//
// Estados de aprobación EXPLÍCITOS, uno por sección. No se infiere la
// completitud buscando palabras en el HTML renderizado: eso daría por cerrada
// una sección por el hecho de mencionarla, y es justamente lo que permitía
// publicar unos Términos incompletos.
//
// Cada bandera pasa a `true` únicamente cuando (a) Mateo tomó la decisión
// comercial, (b) el texto está escrito y (c) el abogado lo revisó. Las cinco
// quedan en `false` en esta etapa.
export const LEGAL_POLICY_SECTIONS = {
  /** Plazos, penalidades y si la política es de plataforma o por proveedor. */
  cancellations: false,
  /** Casos, plazo y medio de devolución. */
  refunds: false,
  /** Derecho de retracto y sus excepciones para servicios con fecha. */
  withdrawal: false,
  /** Si se admiten reprogramaciones y bajo qué condiciones. */
  rescheduling: false,
  /** Reparto de responsabilidad por contracargos y disputas. */
  chargebacks: false,
};

/** Etiquetas legibles, para los mensajes de bloqueo. */
export const POLICY_SECTION_LABELS = {
  cancellations: 'cancelaciones',
  refunds: 'reembolsos',
  withdrawal: 'derecho de retracto',
  rescheduling: 'reprogramaciones',
  chargebacks: 'contracargos y disputas',
};

/** Claves de las secciones que todavía no están cerradas. */
export function missingPolicySections() {
  return Object.keys(LEGAL_POLICY_SECTIONS).filter((k) => LEGAL_POLICY_SECTIONS[k] !== true);
}

/** true solo cuando las cinco secciones están aprobadas. */
export const LEGAL_SECTIONS_COMPLETE = missingPolicySections().length === 0;

/** Devuelve los campos legales obligatorios que todavía faltan. */
export function missingLegalFields() {
  return REQUIRED_LEGAL_FIELDS.filter((f) => {
    const v = LEGAL_ENTITY[f];
    return v === undefined || v === null || String(v).trim() === '';
  });
}

/** true solo cuando no falta ningún dato legal obligatorio. */
export const LEGAL_DATA_COMPLETE = missingLegalFields().length === 0;

/**
 * Revisión jurídica de Términos y Privacidad por un abogado uruguayo.
 *
 * Es una bandera MANUAL: no hay forma de derivarla del código. Se pone en
 * `true` únicamente cuando exista la devolución escrita del abogado y sus
 * cambios estén incorporados. Nadie debería cambiarla para "desbloquear" una
 * prueba local: las páginas ya se pueden ver en desarrollo con el aviso de
 * borrador puesto.
 */
export const LEGAL_DOCS_REVIEWED = false;

/**
 * FAIL-CLOSED — la compuerta única de publicación legal.
 *
 * Requiere TRES condiciones independientes, y ninguna constante sola la abre:
 *   1. datos legales completos (incluye razón social y RUT),
 *   2. revisión de un abogado uruguayo,
 *   3. las cinco secciones de política cerradas.
 *
 * La tercera condición existe porque las dos primeras no alcanzaban: con razón social y
 * RUT cargados y `LEGAL_DOCS_REVIEWED` en `true`, los Términos se habrían
 * publicado sin cancelaciones, reembolsos, retracto, reprogramaciones ni
 * contracargos.
 */
export const PUBLIC_LEGAL_READY =
  LEGAL_DATA_COMPLETE && LEGAL_DOCS_REVIEWED && LEGAL_SECTIONS_COMPLETE;

/**
 * ¿Se puede renderizar un borrador?
 *
 * Solo fuera de producción. En `next dev` y bajo los tests
 * (`NODE_ENV` = development/test) los borradores se ven, con su aviso, para
 * poder desarrollarlos y probarlos. En un build de producción
 * (`NODE_ENV=production`, que es lo que setea `next build`) vale `false`, y las
 * rutas responden 404 en lugar de servir el documento.
 *
 * Next.js inlinea `process.env.NODE_ENV` en el bundle, así que esto funciona
 * igual en componentes de servidor y de cliente.
 *
 * No hay —ni debe haber— ninguna URL secreta ni query param que lo fuerce: la
 * única forma de ver un borrador en producción es completar la compuerta.
 */
export const DRAFTS_VISIBLE = process.env.NODE_ENV !== 'production';

/**
 * VERSIÓN PRELIMINAR PUBLICADA — decisión de Mateo del 19/11/2026.
 *
 * Con la plataforma todavía sin clientes, los documentos legales se publican
 * en producción como VERSIÓN PRELIMINAR para revisarlos y ajustarlos en vivo.
 * No equivale a abrir la compuerta (`PUBLIC_LEGAL_READY` sigue en `false`):
 *
 *   · cada documento muestra un aviso visible de versión preliminar, en
 *     revisión legal y sin valor contractual;
 *   · siguen con `noindex, nofollow` y fuera del sitemap;
 *   · el registro NO presenta su lectura como aceptación;
 *   · el formulario de contacto sigue atado a la compuerta real
 *     (`PUBLIC_CONTACT_READY`), porque recolecta datos personales; la página
 *     /contacto se sirve siempre, sin formulario.
 *
 * Es una constante del repo, no una env var: apagarla es un commit visible.
 * Pasar a `false` vuelve al comportamiento fail-closed anterior (404 en
 * producción).
 */
export const LEGAL_PREVIEW_PUBLISHED = true;

/**
 * ¿Las páginas legales se pueden servir? Publicadas si la compuerta está
 * abierta; como versión preliminar si así se decidió; como borrador fuera de
 * producción.
 */
export const LEGAL_PAGES_REACHABLE = PUBLIC_LEGAL_READY || LEGAL_PREVIEW_PUBLISHED || DRAFTS_VISIBLE;

/**
 * ¿Mostrar notas internas de trabajo (qué falta decidir, bloqueos)? Solo en
 * desarrollo y test. En producción el lector ve el aviso de versión
 * preliminar, no la lista de pendientes del equipo.
 */
export const SHOW_INTERNAL_LEGAL_NOTES = DRAFTS_VISIBLE;

/**
 * Disponibilidad pública del FORMULARIO de contacto, ATADA a la compuerta
 * legal a propósito.
 *
 * El formulario recolecta datos personales (nombre, correo, mensaje) y enlaza a
 * la Política de Privacidad para explicar su tratamiento. Publicarlo mientras
 * esa política no está vigente dejaría tres piezas en estados incompatibles:
 * un formulario que recoge PII, un enlace a un documento en borrador y unos
 * Términos sin cerrar. Las tres se habilitan juntas.
 */
export const PUBLIC_CONTACT_READY = PUBLIC_LEGAL_READY;

/**
 * ¿La PÁGINA /contacto se puede servir? Siempre (decisión del 26/11/2026).
 *
 * Antes la página entera iba atada a la compuerta del formulario, y en
 * producción respondía 404: el sitio quedaba sin una página de contacto, que
 * es uno de los requisitos de la revisión del procesador de pagos. Ahora la
 * página existe siempre y muestra los canales reales (correo, teléfono si
 * existe) y la identidad del titular; el formulario es lo único que sigue
 * detrás de la compuerta (CONTACT_FORM_ENABLED).
 */
export const CONTACT_REACHABLE = true;

/**
 * ¿Se muestra el formulario dentro de /contacto? Publicado solo con la
 * compuerta real abierta; en dev/test, para poder desarrollarlo y probarlo.
 */
export const CONTACT_FORM_ENABLED = PUBLIC_CONTACT_READY || DRAFTS_VISIBLE;

/** Motivos concretos por los que la publicación está bloqueada. */
export function legalBlockers() {
  const blockers = [];
  const missing = missingLegalFields();
  if (missing.length) {
    blockers.push(`Faltan datos legales obligatorios: ${missing.join(', ')}`);
  }
  if (!LEGAL_DOCS_REVIEWED) {
    blockers.push('Términos y Privacidad sin revisión de un abogado uruguayo');
  }
  const missingSections = missingPolicySections();
  if (missingSections.length) {
    blockers.push(
      `Secciones de política sin cerrar: ${missingSections.map((k) => POLICY_SECTION_LABELS[k] || k).join(', ')}`
    );
  }
  return blockers;
}

/**
 * Filas etiqueta/valor de la identidad legal, para el footer, /contacto y los
 * documentos legales.
 *
 * Solo devuelve los campos PRESENTES: la ausencia omite la fila completa, nunca
 * renderiza una etiqueta sin valor. Al cargar `legalName` y `taxId` en
 * LEGAL_ENTITY, las filas «Razón social» y «RUT» aparecen solas en todos los
 * lugares que las consumen.
 */
export function legalIdentityRows() {
  const rows = [];
  if (LEGAL_ENTITY.name) rows.push({ label: 'Titular', value: LEGAL_ENTITY.name });
  if (LEGAL_ENTITY.descriptor) rows.push({ label: 'Forma jurídica', value: LEGAL_ENTITY.descriptor });
  if (LEGAL_ENTITY.legalName) rows.push({ label: 'Razón social', value: LEGAL_ENTITY.legalName });
  if (LEGAL_ENTITY.taxId) rows.push({ label: 'RUT', value: LEGAL_ENTITY.taxId });
  // Opcionales: hoy no se publican (ver LEGAL_ENTITY).
  if (LEGAL_ENTITY.documentId) rows.push({ label: 'Documento', value: LEGAL_ENTITY.documentId });
  if (LEGAL_ENTITY.address) rows.push({ label: 'Domicilio', value: LEGAL_ENTITY.address });
  if (LEGAL_ENTITY.country) rows.push({ label: 'País', value: LEGAL_ENTITY.country });
  return rows;
}

// ── Aviso de bloqueo en build ──────────────────────────────────────────────
// Se imprime una sola vez, al construir o arrancar en modo producción, en el
// log de build (Vercel incluido). No lanza ni rompe nada: no puede impedir un
// deploy legítimo de otras partes del sitio, pero hace imposible desplegar
// "sin darse cuenta" de que los documentos legales siguen en borrador.
// Silencioso en desarrollo y en test para no ensuciar la salida.
if (process.env.NODE_ENV === 'production' && !PUBLIC_LEGAL_READY) {
  console.warn(
    [
      '',
      '──────────────────────────────────────────────────────────────────',
      `⚠ BLOQUEO DE PUBLICACIÓN — ${BRAND}: páginas legales en BORRADOR`,
      '──────────────────────────────────────────────────────────────────',
      ...legalBlockers().map((b) => `  · ${b}`),
      '',
      ...(LEGAL_PREVIEW_PUBLISHED
        ? [
            '  LEGAL_PREVIEW_PUBLISHED = true: los documentos legales se sirven',
            '  como VERSIÓN PRELIMINAR (aviso visible, noindex, fuera del',
            '  sitemap). /contacto se sirve sin formulario hasta abrir la compuerta.',
          ]
        : [
            '  En este build /terminos y /privacidad responden 404: no se sirve',
            '  ningún borrador en producción, el footer no los enlaza y quedan',
            '  fuera del sitemap. /contacto se sirve sin formulario.',
          ]),
      '  El formulario de contacto va atado a la compuerta real porque',
      '  recolecta datos personales.',
      '  NO enviar la URL a dLocal como documentación definitiva.',
      '  Ver lib/site.js.',
      '──────────────────────────────────────────────────────────────────',
      '',
    ].join('\n')
  );
}
