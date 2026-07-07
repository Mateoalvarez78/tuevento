import { NextResponse } from 'next/server';

// ─── PROXY (ex "middleware") ───────────────────────────────────────────────────
// Enruta por subdominio. En Next 16 el archivo `middleware` se renombró a `proxy`
// (por eso ESTE archivo debe llamarse proxy.js, no middleware.js).
//
//   eventonow.(local|com) / localhost      → experiencia cliente (app completa)
//   proveedores.eventonow.(local|com)      → portal proveedor
//   admin.eventonow.(local|com)            → backoffice admin
//
// No toca auth: la sesión vive en localStorage (no cruza subdominios ni llega al
// server), así que el proxy solo garantiza que cada host aterrice en SU login/área.
// Los redirects de "ya logueado → dashboard" los resuelven las páginas de login.

function getArea(host) {
  const label = (host || '').split(':')[0].toLowerCase().split('.')[0];
  if (label === 'proveedores') return 'provider';
  if (label === 'admin') return 'admin';
  return 'client';
}

// Prefijos que pertenecen a cada área (no se redirigen → evita loops).
const ALLOWED = {
  provider: ['/provider', '/dashboard/proveedor', '/proveedor'],
  admin: ['/admin'],
};
const LOGIN = { provider: '/provider/login', admin: '/admin/login' };

function isAllowed(pathname, prefixes) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request) {
  const area = getArea(request.headers.get('host'));
  const { pathname } = request.nextUrl;

  // Dominio cliente / localhost: app completa, sin redirecciones.
  if (area === 'client') return NextResponse.next();

  // Ya está en una ruta propia del área (incluido su login) → dejar pasar.
  if (isAllowed(pathname, ALLOWED[area])) return NextResponse.next();

  // Cualquier otra ruta (incluida "/") → al login del área correspondiente.
  const url = request.nextUrl.clone();
  url.pathname = LOGIN[area];
  return NextResponse.redirect(url);
}

export const config = {
  // Corre en todas las rutas de navegación; excluye estáticos, imágenes y archivos.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w]+$).*)'],
};
