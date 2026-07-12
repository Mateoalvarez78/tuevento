'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, TriangleAlert } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { api, tokenStorage, setUnauthorizedHandler } from '@/services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [favorites, setFavorites] = useState([]);  // array of service IDs
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast]     = useState(null);

  // ─── Unauthorized handler (JWT expired) ───────────────────────────────────
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setFavorites([]);
    });
  }, []);

  // ─── Rehydrate session on mount ────────────────────────────────────────────
  useEffect(() => {
    const rehydrate = async () => {
      const token = tokenStorage.get();
      if (!token) { setAuthLoading(false); return; }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        // Load favorites from backend
        try {
          const favRes = await api.get('/users/me/favorites?limit=100');
          const ids = (favRes.data || []).map((f) => f.id);
          setFavorites(ids);
        } catch {
          // favorites are non-critical
        }
      } catch {
        tokenStorage.remove();
      } finally {
        setAuthLoading(false);
      }
    };
    rehydrate();
  }, []);

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      tokenStorage.set(res.data.token);
      const userData = res.data.user;
      setUser(userData);
      // Load favorites
      try {
        const favRes = await api.get('/users/me/favorites?limit=100');
        setFavorites((favRes.data || []).map((f) => f.id));
      } catch {
        setFavorites([]);
      }
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.message || 'Email o contraseña incorrectos.' };
    }
  }, []);

  // Registro público — siempre crea un cliente. Los proveedores se dan de
  // alta únicamente desde el panel de administración.
  const register = useCallback(async (data) => {
    try {
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || '',
      });
      tokenStorage.set(res.data.token);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      return { success: false, error: err.message || 'Error al crear la cuenta.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout', {}); } catch { /* ignore */ }
    tokenStorage.remove();
    setUser(null);
    setFavorites([]);
  }, []);

  // ─── FAVORITES (API-backed) ────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (serviceId) => {
    const already = favorites.includes(serviceId);
    // Optimistic update
    setFavorites((prev) =>
      already ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
    try {
      if (already) {
        await api.delete(`/favorites/${serviceId}`);
      } else {
        await api.post(`/favorites/${serviceId}`, {});
      }
    } catch {
      // Revert on error
      setFavorites((prev) =>
        already ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
      );
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (serviceId) => favorites.includes(serviceId),
    [favorites]
  );

  // ─── RESERVATIONS ─────────────────────────────────────────────────────────
  // Booking creation lives in the service layer (bookingService.create), which
  // maps the UI shape to the backend contract. Components call it directly.
  // getUserReservations now fetches from API (use bookingService directly for paginated results)
  const getUserReservations = useCallback(async (params = {}) => {
    if (!user) return { data: [], pagination: null };
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await api.get(`/users/me/bookings${qs ? `?${qs}` : ''}`);
      return { data: res.data || [], pagination: res.pagination };
    } catch {
      return { data: [], pagination: null };
    }
  }, [user]);

  // ─── TOAST ────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        favorites,
        authLoading,
        login,
        logout,
        register,
        toggleFavorite,
        isFavorite,
        getUserReservations,
        showToast,
      }}
    >
      {children}
      {toast && <Toast toast={toast} />}
    </AppContext.Provider>
  );
}

const TOAST_ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: TriangleAlert,
};

function Toast({ toast }) {
  const colorMap = {
    success: 'bg-green-500',
    error:   'bg-red-500',
    info:    'bg-blue-500',
    warning: 'bg-yellow-500',
  };
  const Icon = TOAST_ICON[toast.type] || TOAST_ICON.success;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-xl ${colorMap[toast.type] || colorMap.success}`}
      role="alert"
    >
      <AppIcon icon={Icon} size={16} className="shrink-0" aria-hidden="true" />
      <span>{toast.message}</span>
    </div>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
