'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { useAdminProviders } from '@/hooks/useAdmin';
import ProviderStatusBadge from '@/components/ProviderStatusBadge';
import { PROVIDER_STATUS } from '@/utils/constants';
import { safeFormatDate } from '@/lib/date';

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'inactive', label: 'Desactivados' },
];

export default function AdminProveedoresPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');

  const { providers, loading, filters, setFilters } = useAdminProviders();

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
      {/* Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Proveedores</h1>
          <p className="text-gray-400 text-sm mt-1">{providers.length} en total</p>
        </div>
        <Link
          href="/admin/proveedores/nuevo"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus size={16} /> Nuevo proveedor
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nombre, dueño o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60"
        />
      </div>

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
          <div className="p-12 text-center text-gray-500 text-sm">Cargando…</div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No hay proveedores con este filtro.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Proveedor</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Registrado</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayed.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden shrink-0">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg">
                            {p.name[0]}
                          </div>
                        )}
                      </div>
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
                      <ChevronRight size={13} />
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
