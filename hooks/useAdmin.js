'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { contactService } from '@/services/contactService';

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

/**
 * Bandeja de mensajes del formulario de contacto (módulo `contact` del backend).
 * Mismo patrón que useAdminReviews: filtros en estado, recarga por clave
 * serializada y mutaciones que recargan la lista.
 *
 * `counts` trae el total por estado para las pestañas, y `newCount` alimenta el
 * indicador de mensajes sin atender — ambos vienen de la misma respuesta del
 * listado, no de una query extra por pestaña.
 */
export function useAdminContactMessages(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [counts, setCounts] = useState({});
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contactService.admin.getAll({ limit: 50, ...filters });
      setMessages(res.data);
      setPagination(res.pagination);
      setCounts(res.counts);
      setNewCount(res.newCount);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => { reload(); }, [reload]);

  const updateStatus = useCallback(async (id, status, adminNotes) => {
    await contactService.admin.updateStatus(id, { status, adminNotes });
    await reload();
    // Avisa al contador del sidebar/overview: mover un mensaje de `new` a otro
    // estado cambia el badge, y son instancias de hook distintas.
    notifyContactInboxChanged();
  }, [reload]);

  return {
    messages, pagination, counts, newCount,
    loading, error, filters, setFilters, updateStatus, reload,
  };
}

/**
 * Evento de ventana que señala "la bandeja de contacto cambió".
 *
 * El contador del sidebar y la página de mensajes son dos instancias de hook
 * distintas: sin una señal, cambiar el estado de un mensaje en la página dejaba
 * el badge del sidebar desactualizado hasta recargar. Se usa un evento del DOM
 * en lugar de un contexto nuevo porque son dos puntos sueltos del árbol y no
 * justifica un provider; y en lugar de polling porque no hay nada que sondear:
 * el único actor que cambia la bandeja desde esta UI es el propio admin.
 */
export const CONTACT_INBOX_CHANGED = 'eventonow:contact-inbox-changed';

export function notifyContactInboxChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CONTACT_INBOX_CHANGED));
  }
}

/**
 * Solo la cantidad de mensajes en estado `new`, para el badge del sidebar y la
 * tarjeta del overview.
 *
 * Pide `limit: 1` a propósito: el backend devuelve `counts`/`newCount`
 * calculados sobre toda la tabla con independencia del límite (ver
 * contact.service.js#listMessages), así que esto trae el contador con el payload
 * más chico posible en lugar de descargar 50 mensajes para contarlos.
 *
 * Un error no rompe nada: el contador queda en 0 y el layout se renderiza igual
 * (`error` queda disponible por si algún consumidor quiere mostrarlo).
 */
export function useAdminContactNewCount() {
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactService.admin.getAll({ limit: 1 });
      setNewCount(res.newCount || 0);
      setError(null);
    } catch (err) {
      setError(err);
      setNewCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Se refresca cuando la bandeja cambia en otra parte de la UI.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onChanged = () => { reload(); };
    window.addEventListener(CONTACT_INBOX_CHANGED, onChanged);
    return () => window.removeEventListener(CONTACT_INBOX_CHANGED, onChanged);
  }, [reload]);

  return { newCount, loading, error, reload };
}
