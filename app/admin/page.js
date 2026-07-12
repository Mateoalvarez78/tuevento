'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/AppContext';
import { adminDashboardService } from '@/services/adminDashboardService';
import { AlertTriangle } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';

import AdminHero from '@/components/dashboard/admin/AdminHero';
import AdminStats from '@/components/dashboard/admin/AdminStats';
import PlatformStatus from '@/components/dashboard/admin/PlatformStatus';
import AdminAlerts from '@/components/dashboard/admin/AdminAlerts';
import RecentProviders from '@/components/dashboard/admin/RecentProviders';
import RecentBookings from '@/components/dashboard/admin/RecentBookings';
import RecentServices from '@/components/dashboard/admin/RecentServices';
import ActivityTimeline from '@/components/dashboard/admin/ActivityTimeline';
import AdminCharts from '@/components/dashboard/admin/AdminCharts';
import QuickActions from '@/components/dashboard/admin/QuickActions';

export default function AdminOverviewPage() {
  const { user } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminDashboardService.getDashboard()
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { setError(err?.message || 'No se pudo cargar el panel'); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="skeleton h-24 w-full rounded-2xl bg-gray-800" />
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">{[...Array(10)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl bg-gray-800" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><div className="lg:col-span-2 skeleton h-64 rounded-2xl bg-gray-800" /><div className="skeleton h-64 rounded-2xl bg-gray-800" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
          <AppIcon icon={AlertTriangle} size={30} className="mx-auto text-amber-400 mb-3" aria-hidden="true" />
          <p className="text-gray-200 font-medium mb-1">No pudimos cargar el panel</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <Button onClick={load}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <AdminHero user={user} />

      <AdminAlerts alerts={data.alerts} />

      <AdminStats stats={data.stats} />

      <PlatformStatus stats={data.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentProviders providers={data.recentProviders} />
        </div>
        <ActivityTimeline activity={data.activity} />
      </div>

      <RecentBookings bookings={data.recentBookings} />

      <RecentServices services={data.recentServices} />

      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Métricas</h3>
        <AdminCharts stats={data.stats} monthly={data.monthlyMetrics} />
      </div>

      <QuickActions />
    </div>
  );
}
