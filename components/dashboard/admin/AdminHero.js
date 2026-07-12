'use client';

import { ShieldCheck, Users, Package } from 'lucide-react';
import { isAdminRole, ROLES } from '@/lib/roles';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';

export default function AdminHero({ user }) {
  const today = new Date().toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const roleLabel = user?.role === ROLES.SUPERADMIN ? 'Superadmin' : 'Admin';
  const first = (user?.name || '').split(' ')[0] || '';

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AppIcon icon={ShieldCheck} size={16} className="text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Panel de administración · Eventonow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Hola, {first || roleLabel}</h1>
          <p className="text-sm text-gray-400 capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-gray-300 bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-lg">{roleLabel}</span>
          <Button variant="outline" theme="dark" size="sm" icon={Users} href="/admin/proveedores">Proveedores</Button>
          <Button variant="outline" theme="dark" size="sm" icon={Package} href="/admin/servicios">Servicios</Button>
        </div>
      </div>
    </div>
  );
}
