'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { isAdminRole, homePathForRole } from '@/lib/roles';

/**
 * Client-side role guard for a protected area.
 * @param {string[]} allow - roles permitidos (admin/superadmin siempre pasan).
 * @returns {'loading'|'unauth'|'denied'|'ok'}
 *   - 'loading': sesión aún cargando.
 *   - 'unauth' : no hay sesión (la página decide: mostrar prompt o link a /login).
 *   - 'denied' : rol equivocado → redirige automáticamente a su home.
 *   - 'ok'     : acceso permitido.
 */
export function useRequireRole(allow = []) {
  const { user, authLoading } = useApp();
  const router = useRouter();

  const wrongRole = !!user && !isAdminRole(user.role) && !allow.includes(user.role);

  useEffect(() => {
    if (authLoading) return;
    if (wrongRole) router.replace(homePathForRole(user.role));
  }, [authLoading, wrongRole, user, router]);

  if (authLoading) return 'loading';
  if (!user) return 'unauth';
  if (wrongRole) return 'denied';
  return 'ok';
}
