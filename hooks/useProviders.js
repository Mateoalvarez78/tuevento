'use client';

import { useState, useEffect, useCallback } from 'react';
import { providerService } from '@/services/providerService';

export function useProviders(filters = {}) {
  const [providers, setProviders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    providerService.getAll(filters)
      .then((res) => {
        if (!cancelled) {
          setProviders(res.data || []);
          setPagination(res.pagination || { total: 0, totalPages: 1 });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { providers, pagination, loading, error };
}

export function useProvider(id) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    providerService.getById(id)
      .then((p) => {
        if (!cancelled) { setProvider(p); setLoading(false); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [id]);

  return { provider, loading, error };
}

export function useMyProvider(userId) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const p = await providerService.getByUserId(userId);
      setProvider(p);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { provider, loading, error, reload };
}
