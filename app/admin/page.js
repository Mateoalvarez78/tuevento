'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/AppContext';
import { adminDashboardService } from '@/services/adminDashboardService';
import { adminService } from '@/services/adminService';
import { AlertTriangle } from 'lucide-react';

import AdminHero from '@/components/dashboard/admin/AdminHero';
import AdminStats from '@/components/dashboard/admin/AdminStats';
import PlatformStatus from '@/components/dashboard/admin/PlatformStatus';
import AdminAlerts from '@/components/dashboard/admin/AdminAlerts';
import PendingProviders from '@/components/dashboard/admin/PendingProviders';
import RecentBookings from '@/components/dashboard/admin/RecentBookings';
import RecentServices from '@/components/dashboard/admin/RecentServices';
import ActivityTimeline from '@/components/dashboard/admin/ActivityTimeline';
import AdminCharts from '@/components/dashboard/admin/AdminCharts';
import QuickActions from '@/components/dashboard/admin/QuickActions';

export default function AdminOverviewPage() {
  const { user, showToast } = useApp();
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

  const handleApprove = async (p) => {
    try { await adminService.providers.approve(p.id); showToast('Proveedor aprobado', 'success'); load(); }
    catch (err) { showToast(err?.message || 'No se pudo aprobar', 'error'); }
  };

  const handleReject = async (p) => {
    const reason = window.prompt(`Motivo del rechazo de "${p.businessName}":`);
    if (reason === null) return;
    try { await adminService.providers.reject(p.id, reason); showToast('Proveedor rechazado', 'info'); load(); }
    catch (err) { showToast(err?.message || 'No se pudo rechazar', 'error'); }
  };

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
          <AlertTriangle size={30} className="mx-auto text-amber-400 mb-3" />
          <p className="text-gray-200 font-medium mb-1">No pudimos cargar el panel</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button onClick={load} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">Reintentar</button>
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
          <PendingProviders providers={data.pendingProviders} onApprove={handleApprove} onReject={handleReject} />
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
