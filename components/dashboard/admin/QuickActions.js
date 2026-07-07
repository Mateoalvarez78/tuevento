'use client';

import Link from 'next/link';
import { Store, Package, CalendarClock, Users, Tags, Settings } from 'lucide-react';

// Launcher de acciones. Rutas existentes → Link; futuras → deshabilitadas con "Pronto".
const ACTIONS = [
  { label: 'Proveedores',  desc: 'Aprobar y gestionar',  icon: Store,         href: '/admin/proveedores' },
  { label: 'Servicios',    desc: 'Moderar publicaciones', icon: Package,        href: '/admin/servicios' },
  { label: 'Reservas',     desc: 'Ver todas',             icon: CalendarClock,  href: '/admin/reservas' },
  { label: 'Clientes',     desc: 'Gestionar usuarios',    icon: Users,          href: null },
  { label: 'Categorías',   desc: 'Administrar catálogo',  icon: Tags,           href: null },
  { label: 'Configuración',desc: 'Ajustes globales',      icon: Settings,       href: null },
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Acciones rápidas</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const inner = (
            <>
              <span className="w-9 h-9 rounded-xl bg-gray-800 text-gray-300 flex items-center justify-center mb-2 group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                <Icon size={17} />
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-100">{a.label}</span>
                {!a.href && <span className="text-[9px] font-bold text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">Pronto</span>}
              </div>
              <span className="text-[11px] text-gray-500">{a.desc}</span>
            </>
          );
          const cls = 'group flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-4 transition-all';
          return a.href
            ? <Link key={a.label} href={a.href} className={`${cls} hover:border-primary/40 hover:-translate-y-0.5`}>{inner}</Link>
            : <div key={a.label} className={`${cls} opacity-60 cursor-not-allowed`}>{inner}</div>;
        })}
      </div>
    </div>
  );
}
