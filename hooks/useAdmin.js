'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';

/**
 * Hook for the admin overview stats card.
 */
export function useAdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setStats(adminService.getOverviewStats());
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  return { stats, loading, reload };
}

/**
 * Hook for the admin providers list with search/status filters.
 * Usage: const { providers, filters, setFilters } = useAdminProviders()
 */
export function useAdminProviders(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const filtersKey = JSON.stringify(filters);

  const reload = useCallback(() => {
    setLoading(true);
    setProviders(adminService.providers.getAll(filters));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  const approve = useCallback(
    (id) => {
      adminService.providers.approve(id);
      reload();
    },
    [reload]
  );

  const reject = useCallback(
    (id, reason) => {
      adminService.providers.reject(id, reason);
      reload();
    },
    [reload]
  );

  const suspend = useCallback(
    (id, reason) => {
      adminService.providers.suspend(id, reason);
      reload();
    },
    [reload]
  );

  const reactivate = useCallback(
    (id) => {
      adminService.providers.reactivate(id);
      reload();
    },
    [reload]
  );

  return { providers, loading, filters, setFilters, approve, reject, suspend, reactivate, reload };
}

/**
 * Hook for the admin services list.
 */
export function useAdminServices(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const filtersKey = JSON.stringify(filters);

  const reload = useCallback(() => {
    setLoading(true);
    setServices(adminService.services.getAll(filters));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  const approve = useCallback(
    (id) => {
      adminService.services.approve(id);
      reload();
    },
    [reload]
  );

  const reject = useCallback(
    (id, reason) => {
      adminService.services.reject(id, reason);
      reload();
    },
    [reload]
  );

  return { services, loading, filters, setFilters, approve, reject, reload };
}
