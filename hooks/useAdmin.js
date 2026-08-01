'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';

export function useAdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await adminService.getOverviewStats();
      setStats(s);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { stats, loading, error, reload };
}

// useAdminProviders fue removido (Proveedor 360°, Fase A): la nueva página de
// listado (app/admin/proveedores/page.js) sigue el patrón inline de
// app/admin/reservas/page.js (fetch debounced + filtersKey) porque necesita
// paginación real de servidor, que este hook no soportaba (devolvía un array
// plano, sin `pagination`). Confirmado sin otros usos antes de eliminarlo.

export function useAdminServices(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminService.services.getAll(filters);
      setServices(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => { reload(); }, [reload]);

  const approve = useCallback(async (id) => {
    await adminService.services.approve(id);
    reload();
  }, [reload]);

  const reject = useCallback(async (id, reason) => {
    await adminService.services.reject(id, reason);
    reload();
  }, [reload]);

  const pause = useCallback(async (id, reason) => {
    await adminService.services.pause(id, reason);
    reload();
  }, [reload]);

  return { services, loading, error, filters, setFilters, approve, reject, pause, reload };
}

export function useAdminReviews(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.reviews.getAll({ limit: 50, ...filters });
      setReviews(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => { reload(); }, [reload]);

  const hide = useCallback(async (id) => {
    await adminService.reviews.hide(id);
    reload();
  }, [reload]);

  const restore = useCallback(async (id) => {
    await adminService.reviews.restore(id);
    reload();
  }, [reload]);

  return { reviews, pagination, loading, error, filters, setFilters, hide, restore, reload };
}
