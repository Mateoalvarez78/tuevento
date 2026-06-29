'use client';

import { useState, useEffect, useCallback } from 'react';
import { providerService } from '@/services/providerService';

/**
 * Hook for listing public providers with optional filters.
 * Usage: const { providers, loading } = useProviders({ category, zone, search })
 */
export function useProviders(filters = {}) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    setLoading(true);
    // Future: replace with async fetch
    const result = providerService.getAll(filters);
    setProviders(result);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { providers, loading };
}

/**
 * Hook for a single provider profile page.
 * Usage: const { provider, loading } = useProvider(id)
 */
export function useProvider(id) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setProvider(providerService.getById(id));
    setLoading(false);
  }, [id]);

  return { provider, loading };
}

/**
 * Hook for the provider dashboard (own data + services).
 * Usage: const { provider, loading } = useMyProvider(userId)
 */
export function useMyProvider(userId) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!userId) return;
    setProvider(providerService.getByUserId(userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  return { provider, loading, reload };
}
