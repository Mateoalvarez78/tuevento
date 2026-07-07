// ─── ROLES & AREAS ────────────────────────────────────────────────────────────
// Single source of truth for role-based routing across the 3 product areas:
//   marketplace (clientes) · provider (proveedores) · admin (backoffice).
//
// Fase 1 (un solo dominio): AREA_URLS quedan vacías → se usan paths relativos.
// Fase 2 (subdominios): al setear NEXT_PUBLIC_*_URL, homeForRole() devuelve URLs
// absolutas y el middleware puede enrutar por host sin cambiar este archivo.

export const ROLES = {
  CLIENT: 'client',
  PROVIDER: 'provider',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

export const AREAS = {
  MARKETPLACE: 'marketplace',
  PROVIDER: 'provider',
  ADMIN: 'admin',
};

// Base URL por área (vacío en Fase 1 → paths relativos en el mismo dominio).
export const AREA_URLS = {
  [AREAS.MARKETPLACE]: process.env.NEXT_PUBLIC_APP_URL || '',
  [AREAS.PROVIDER]:    process.env.NEXT_PUBLIC_PROVIDER_URL || '',
  [AREAS.ADMIN]:       process.env.NEXT_PUBLIC_ADMIN_URL || '',
};

export function isAdminRole(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
}

// Área "propia" de cada rol (a dónde pertenece).
export function areaForRole(role) {
  if (isAdminRole(role)) return AREAS.ADMIN;
  if (role === ROLES.PROVIDER) return AREAS.PROVIDER;
  return AREAS.MARKETPLACE;
}

// Path de aterrizaje tras login, por rol (relativo — sirve en un solo dominio).
export function homePathForRole(role) {
  if (isAdminRole(role)) return '/admin';
  if (role === ROLES.PROVIDER) return '/dashboard/proveedor';
  return '/dashboard/cliente';
}

// Destino completo tras login. Absoluto si el área tiene URL configurada
// (Fase 2, cross-subdominio); relativo en caso contrario (Fase 1).
export function homeForRole(role) {
  const path = homePathForRole(role);
  const base = AREA_URLS[areaForRole(role)];
  return base ? `${base.replace(/\/$/, '')}${path}` : path;
}

// ¿Puede un rol acceder a un área? (guard de front y futuro middleware).
export function canAccessArea(role, area) {
  if (isAdminRole(role)) return true;              // admin/superadmin: todo
  if (area === AREAS.PROVIDER) return role === ROLES.PROVIDER;
  if (area === AREAS.ADMIN) return false;          // solo admin/superadmin
  return true;                                      // marketplace: cualquiera
}
