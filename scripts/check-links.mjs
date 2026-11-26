#!/usr/bin/env node
// ─── CHEQUEO DE ENLACES PÚBLICOS ──────────────────────────────────────────────
// Recorre lo que ve un revisor externo (dLocal, Google) y falla si algún
// enlace no funciona. Pensado para correrlo ANTES de pedir una nueva revisión
// y después de cada deploy que toque la base:
//
//   node scripts/check-links.mjs
//   SITE_URL=https://www.eventonow.com API_URL=https://eventonow-back.onrender.com/api node scripts/check-links.mjs
//
// Por qué no alcanza con mirar el status de cada página: /catalogo y
// /proveedor/[id] se renderizan en el cliente, así que el HTML responde 200
// aunque la API detrás devuelva 500 y la página muestre "Proveedor no
// encontrado". Por eso, además de las rutas del sitio, se pide a la API el
// detalle de CADA servicio publicado y de cada proveedor destacado — que es
// exactamente lo que hace el navegador al hacer clic en una tarjeta.
//
// Sin dependencias: Node 18+ (fetch nativo).

const SITE = (process.env.SITE_URL || 'https://www.eventonow.com').replace(/\/$/, '');
const API = (process.env.API_URL || 'https://eventonow-back.onrender.com/api').replace(/\/$/, '');
const TIMEOUT_MS = 60_000; // Render free tarda ~50 s en despertar

const failures = [];
let checked = 0;

async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
  } finally {
    clearTimeout(t);
  }
}

async function expectOk(label, url) {
  checked += 1;
  try {
    const res = await get(url);
    if (!res.ok) failures.push(`${res.status}  ${label}  ${url}`);
    return res;
  } catch (err) {
    failures.push(`ERR  ${label}  ${url}  (${err.name}: ${err.message})`);
    return null;
  }
}

/** Enlaces internos (`href="/..."`) del HTML servido. */
function internalHrefs(html) {
  const out = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, '&');
    if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/_next/')) {
      out.add(href.split('#')[0] || '/');
    }
  }
  return out;
}

async function main() {
  console.log(`Sitio: ${SITE}\nAPI:   ${API}\n`);

  // Despertar la API primero, para no contar el arranque en frío como falla.
  await expectOk('API /categories', `${API}/categories`);

  // 1) Rutas del sitio: home + todo lo que la home y las páginas legales enlazan.
  const seeds = ['/', '/catalogo', '/legal', '/terminos', '/privacidad'];
  const routes = new Set(seeds);
  for (const path of seeds) {
    const res = await expectOk(`página ${path}`, SITE + path);
    if (res?.ok) internalHrefs(await res.text()).forEach((h) => routes.add(h));
  }
  for (const path of routes) {
    if (!seeds.includes(path)) await expectOk(`página ${path}`, SITE + path);
  }

  // 2) Cada tarjeta del catálogo → GET /services/:id (lo que carga /proveedor/[id]).
  const list = await expectOk('API catálogo', `${API}/services?limit=100`);
  const services = list?.ok ? (await list.json()).data || [] : [];
  for (const s of services) {
    await expectOk(`servicio "${s.title}"`, `${API}/services/${s.id}`);
  }

  // 3) Proveedores destacados de la home → su servicio principal.
  const feat = await expectOk('API destacados', `${API}/providers/featured?limit=8`);
  const featured = feat?.ok ? (await feat.json()).data || [] : [];
  for (const p of featured) {
    if (p.main_service_id) {
      await expectOk(`destacado "${p.business_name}"`, `${API}/services/${p.main_service_id}`);
    }
  }

  console.log(`${checked} enlaces revisados (${services.length} servicios, ${featured.length} destacados).`);
  if (failures.length) {
    console.error(`\n✗ ${failures.length} con problemas:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log('✓ Todos los enlaces responden.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
