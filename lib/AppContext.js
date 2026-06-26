'use client';
// ─── AppContext ───────────────────────────────────────────────────────────────
// TODO: Replace localStorage mock with real API calls (auth, favorites, reservations).

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_USERS, MOCK_RESERVATIONS } from './mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [reservations, setReservations] = useState(MOCK_RESERVATIONS);
  const [toast, setToast] = useState(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('te_user');
      const savedFavorites = localStorage.getItem('te_favorites');
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    } catch {
      // ignore parse errors
    }
  }, []);

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  // TODO: Replace with POST /api/auth/login
  const login = useCallback((email, password) => {
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) return { success: false, error: 'Email o contraseña incorrectos.' };
    const { password: _p, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem('te_user', JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  }, []);

  // TODO: Replace with POST /api/auth/register
  const register = useCallback((data) => {
    const newUser = {
      id: `u${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role || 'client',
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      phone: data.phone || '',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    localStorage.setItem('te_user', JSON.stringify(newUser));
    return { success: true, user: newUser };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('te_user');
  }, []);

  // ─── FAVORITES ────────────────────────────────────────────────────────────
  // TODO: Replace with POST/DELETE /api/favorites/:providerId
  const toggleFavorite = useCallback((providerId) => {
    setFavorites((prev) => {
      const next = prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId];
      localStorage.setItem('te_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (providerId) => favorites.includes(providerId),
    [favorites]
  );

  // ─── RESERVATIONS ─────────────────────────────────────────────────────────
  // TODO: Replace with POST /api/reservations
  const addReservation = useCallback((reservationData) => {
    const newRes = {
      id: `res${Date.now()}`,
      clientId: user?.id || 'u1',
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      requestNumber: `TE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      ...reservationData,
    };
    setReservations((prev) => [newRes, ...prev]);
    return newRes;
  }, [user]);

  // TODO: Replace with PATCH /api/reservations/:id/status  (provider action)
  const updateReservationStatus = useCallback((id, status, reason) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, ...(reason ? { rejectionReason: reason } : {}) } : r
      )
    );
  }, []);

  const getUserReservations = useCallback(() => {
    if (!user) return [];
    return reservations.filter((r) => r.clientId === user.id);
  }, [user, reservations]);

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
        reservations,
        toast,
        login,
        logout,
        register,
        toggleFavorite,
        isFavorite,
        addReservation,
        updateReservationStatus,
        getUserReservations,
        showToast,
      }}
    >
      {children}
      {toast && <Toast toast={toast} />}
    </AppContext.Provider>
  );
}

function Toast({ toast }) {
  const colorMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-xl ${colorMap[toast.type] || colorMap.success}`}
      role="alert"
    >
      <span>
        {toast.type === 'success' && '✓ '}
        {toast.type === 'error' && '✗ '}
        {toast.type === 'info' && 'ℹ '}
        {toast.message}
      </span>
    </div>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
