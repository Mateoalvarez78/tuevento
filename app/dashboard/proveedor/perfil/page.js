'use client';

import ProviderStatusBadge from '@/components/ProviderStatusBadge';
import Button from '@/components/Button';
import { useProviderDashboard } from '../layout';

export default function ProviderProfilePage() {
  const { providerData, user, accountStatus } = useProviderDashboard();

  if (!providerData) {
    return <div className="skeleton h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover"
        />
        <div>
          <div className="text-lg sm:text-xl font-bold text-gray-900">{user.name}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <ProviderStatusBadge status={accountStatus} />
            <span className="text-xs text-gray-400">{providerData.categoryLabel}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Nombre del servicio', value: providerData.name },
          { label: 'Categoría', value: providerData.categoryLabel },
          { label: 'Zona de cobertura', value: providerData.zones?.length ? providerData.zones.join(', ') : '—' },
          { label: 'Email', value: user.email },
          { label: 'Teléfono', value: providerData.phone || '—' },
        ].map((f) => (
          <div key={f.label}>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
            <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50">{f.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
        <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 min-h-[80px]">
          {providerData.description}
        </div>
      </div>
      <Button className="mt-5 w-full sm:w-auto">Guardar cambios</Button>
    </div>
  );
}
