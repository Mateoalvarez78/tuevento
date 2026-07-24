// ─── AVAILABILITY SERVICE ─────────────────────────────────────────────────────
// Disponibilidad/agenda real del proveedor: configuración general (capacidad/
// anticipación), bloqueos (siempre de día completo — ya no hay horario
// semanal recurrente), reservas externas y calendario agregado.

import { api, buildQuery } from './api';

function mapSettings(s) {
  if (!s) return null;
  return {
    maxConcurrentEvents: s.max_concurrent_events != null ? parseInt(s.max_concurrent_events) : 1,
    maxConcurrentGuests: s.max_concurrent_guests != null ? parseInt(s.max_concurrent_guests) : null,
    defaultMinBookingNoticeHours: s.default_min_booking_notice_hours != null ? parseInt(s.default_min_booking_notice_hours) : 0,
  };
}

function mapException(e) {
  if (!e) return null;
  return {
    id: e.id,
    serviceId: e.service_id,
    exceptionType: e.exception_type,
    startDatetime: e.start_datetime,
    endDatetime: e.end_datetime,
    isFullDay: e.is_full_day,
    maxEventsOverride: e.max_events_override,
    maxGuestsOverride: e.max_guests_override,
    reason: e.reason || '',
    relatedBookingId: e.related_booking_id || null,
    createdAt: e.created_at,
  };
}

function mapExternalEvent(e) {
  if (!e) return null;
  return {
    id: e.id,
    serviceId: e.service_id,
    title: e.title,
    clientName: e.client_name || '',
    clientPhone: e.client_phone || '',
    startDatetime: e.start_datetime,
    endDatetime: e.end_datetime,
    guestCount: e.guest_count,
    capacityUsed: e.capacity_used || 1,
    notes: e.notes || '',
  };
}

function mapImpactBooking(b) {
  return {
    id: b.id,
    requestNumber: b.request_number,
    date: b.event_date,
    time: b.event_time || '',
    guestCount: b.guest_count || 0,
    serviceTitle: b.service_title || '',
  };
}

function mapCalendarDay(d) {
  return {
    date: d.date,
    status: d.status,
    eventCount: d.eventCount || 0,
    guestTotal: d.guestTotal || 0,
    pendingCount: d.pendingCount || 0,
  };
}

function mapDayDetail(d) {
  if (!d) return null;
  return {
    date: d.date,
    status: d.status,
    capacity: d.capacity,
    bookings: d.bookings || [],
    pendingRequests: d.pendingRequests || [],
    externalEvents: (d.externalEvents || []).map(mapExternalEvent),
    exceptions: (d.exceptions || []).map(mapException),
  };
}

export const availabilityService = {
  // ── Configuración general ────────────────────────────────────────────────
  async getSettings() {
    const res = await api.get('/providers/me/availability/settings');
    return mapSettings(res.data);
  },
  async updateSettings(data) {
    const res = await api.put('/providers/me/availability/settings', {
      maxConcurrentEvents: data.maxConcurrentEvents,
      maxConcurrentGuests: data.maxConcurrentGuests,
      defaultMinBookingNoticeHours: data.defaultMinBookingNoticeHours,
    });
    return mapSettings(res.data);
  },

  // ── Bloqueos / excepciones ───────────────────────────────────────────────
  async listExceptions(params = {}) {
    const res = await api.get(`/providers/me/availability/exceptions${buildQuery(params)}`);
    return (res.data || []).map(mapException);
  },
  async createException(data) {
    const res = await api.post('/providers/me/availability/exceptions', data);
    return mapException(res.data);
  },
  async updateException(id, data) {
    const res = await api.patch(`/providers/me/availability/exceptions/${id}`, data);
    return mapException(res.data);
  },
  async deleteException(id) {
    await api.delete(`/providers/me/availability/exceptions/${id}`);
  },
  async previewExceptionImpact(data) {
    const res = await api.post('/providers/me/availability/exceptions/impact-preview', data);
    return (res.data || []).map(mapImpactBooking);
  },
  async getExceptionImpact(id) {
    const res = await api.get(`/providers/me/availability/exceptions/${id}/impact`);
    return (res.data || []).map(mapImpactBooking);
  },

  // ── Reservas externas ────────────────────────────────────────────────────
  async listExternalEvents(params = {}) {
    const res = await api.get(`/providers/me/external-events${buildQuery(params)}`);
    return (res.data || []).map(mapExternalEvent);
  },
  async createExternalEvent(data) {
    const res = await api.post('/providers/me/external-events', data);
    return mapExternalEvent(res.data);
  },
  async updateExternalEvent(id, data) {
    const res = await api.patch(`/providers/me/external-events/${id}`, data);
    return mapExternalEvent(res.data);
  },
  async deleteExternalEvent(id) {
    await api.delete(`/providers/me/external-events/${id}`);
  },

  // ── Calendario ────────────────────────────────────────────────────────────
  async getCalendar(from, to) {
    const res = await api.get(`/providers/me/calendar${buildQuery({ from, to })}`);
    return (res.data || []).map(mapCalendarDay);
  },
  async getCalendarDay(date) {
    const res = await api.get(`/providers/me/calendar/day${buildQuery({ date })}`);
    return mapDayDetail(res.data);
  },

  // ── Disponibilidad pública (flujo de reserva del cliente) ───────────────
  // `time` opcional: sin horario elegido, el backend prueba a las 12:00 como
  // aproximación (puede no reflejar la noche llena o la mañana libre) — en
  // cuanto el cliente elige hora, pasarla acá para una revisión más precisa.
  // `packageId`/`extraHours`: si el paquete es de duración fija, el backend
  // usa su duración (+ horas extra) para calcular el intervalo consultado en
  // vez de la duración genérica del servicio — sin esto, la consulta previa
  // podía decir "disponible" para una ventana más corta que la real.
  async getPublicAvailability(serviceId, { date, time, guestCount, packageId, extraHours } = {}) {
    const res = await api.get(`/services/${serviceId}/availability${buildQuery({ date, time, guestCount, packageId, extraHours })}`);
    const d = res.data || {};
    return {
      available: !!d.available,
      date: d.date,
      reasonCode: d.reasonCode || null,
      reasonMessage: d.reasonMessage || null,
      remainingEventCapacity: d.remainingEventCapacity,
      remainingGuestCapacity: d.remainingGuestCapacity,
    };
  },
};
