'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { serviceService } from '@/services/serviceService';
import ProviderOverview from '@/components/dashboard/proveedor/ProviderOverview';
import { useProviderDashboard } from './layout';

// Mapea los "tabs" internos que usa ProviderOverview a rutas reales del shell.
const ROUTE_MAP = {
  dashboard: '/dashboard/proveedor',
  solicitudes: '/dashboard/proveedor/reservas',
  servicios: '/dashboard/proveedor/servicios',
  calendario: '/dashboard/proveedor/calendario',
  resenas: '/dashboard/proveedor/resenas',
  comisiones: '/dashboard/proveedor/finanzas',
  perfil: '/dashboard/proveedor/perfil',
};

export default function ProveedorDashboardHome() {
  const router = useRouter();
  const { providerData } = useProviderDashboard();
  const [myServices, setMyServices] = useState([]);

  const reload = useCallback(async () => {
    try {
      const svcs = await serviceService.getByProvider();
      setMyServices(svcs || []);
    } catch (_) {
      // ProviderOverview maneja el estado vacío/de error de sus propios datos agregados
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <ProviderOverview
      provider={providerData}
      services={myServices}
      onCreateService={() => router.push('/dashboard/proveedor/servicios')}
      onGoToTab={(tab) => router.push(ROUTE_MAP[tab] || '/dashboard/proveedor')}
    />
  );
}
