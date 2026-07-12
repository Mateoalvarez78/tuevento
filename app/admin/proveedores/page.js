'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Plus, Users } from 'lucide-react';
import { useAdminProviders } from '@/hooks/useAdmin';
import ProviderStatusBadge from '@/components/ProviderStatusBadge';
import { safeFormatDate } from '@/lib/date';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Avatar from '@/components/Avatar';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { TABLE_HEAD_CLS, TABLE_ROW_HOVER_CLS } from '@/components/Table';

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'inactive', label: 'Desactivados' },
];

export default function AdminProveedoresPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');

  const { providers, loading } = useAdminProviders();

  const displayed = providers.filter((p) => {
    const matchStatus = !activeTab || p.status === activeTab;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        theme="dark"
        title="Proveedores"
        subtitle={`${providers.length} en total`}
        className="mb-5 sm:mb-6"
        action={<Button icon={Plus} href="/admin/proveedores/nuevo">Nuevo proveedor</Button>}
      />

      {/* Search */}
      <Input
        variant="dark"
        icon={Search}
        wrapperClassName="max-w-sm mb-5"
        placeholder="Buscar por nombre, dueño o email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.value
                ? 'text-primary border-b-2 border-primary -mb-px bg-primary/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded-lg bg-gray-800" />)}
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState icon={Users} title="Sin resultados" description="No hay proveedores con este filtro." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className={TABLE_HEAD_CLS.dark}>
                <th className="text-left px-5 py-3.5 font-medium">Proveedor</th>
                <th className="text-left px-4 py-3.5 font-medium hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3.5 font-medium hidden lg:table-cell">Registrado</th>
                <th className="text-left px-4 py-3.5 font-medium">Estado</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayed.map((p) => (
                <tr key={p.id} className={`${TABLE_ROW_HOVER_CLS.dark} group`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={p.images?.[0]} name={p.name} size="sm" shape="square" />
                      <div className="min-w-0">
                        <p className="text-gray-100 font-medium truncate">{p.name}</p>
                        <p className="text-gray-500 text-xs truncate">{p.ownerName || p.owner?.name || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-400 hidden md:table-cell">{p.categoryLabel}</td>
                  <td className="px-4 py-4 text-gray-500 text-xs hidden lg:table-cell">
                    {safeFormatDate(p.createdAt, '—')}
                  </td>
                  <td className="px-4 py-4">
                    <ProviderStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/proveedores/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary transition-colors group-hover:text-gray-300"
                    >
                      Ver
                      <AppIcon icon={ChevronRight} size={13} aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
