// ─── CONTACT SERVICE ──────────────────────────────────────────────────────────
// Cliente del módulo `contact` del backend (POST público + lectura admin).
// Auditado contra eventonow-back/src/modules/contact/{routes,controller,service}.
//
// Ningún componente llama a `fetch` directo: todo pasa por acá (regla del repo,
// ver docs/SERVICE_LAYER.md).

import { api, buildQuery } from './api';

// Límites del formulario. Son los MISMOS que valida el backend
// (contact.routes.js) y que impone el CHECK de la migración 025. Se declaran acá
// para poder validar en el cliente y dar feedback inmediato — nunca para
// reemplazar la validación del servidor, que es la que decide.
export const CONTACT_LIMITS = {
  nameMax: 120,
  emailMax: 255,
  subjectMax: 150,
  messageMin: 10,
  messageMax: 4000,
};

/** Estados administrativos — vocabulario cerrado, espejo del CHECK de la 025. */
export const CONTACT_STATUS_LABELS = {
  new: 'Nuevo',
  in_progress: 'En curso',
  resolved: 'Resuelto',
  spam: 'Spam',
};

/** Mapea la fila del backend (snake_case) a la forma que usa la UI. */
function mapMessage(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject || null,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes || null,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const contactService = {
  /**
   * Envía el formulario público. Resuelve SOLO si el backend respondió 2xx —
   * o sea, si la fila se persistió. La UI no debe mostrar éxito antes de esto.
   *
   * `honeypot` viaja siempre (vacío en un envío humano): es el campo señuelo.
   */
  async submit({ name, email, subject, message, honeypot = '' }) {
    const res = await api.post('/contact', {
      name, email, subject, message, honeypot,
    });
    return { id: res.data?.id || null, createdAt: res.data?.createdAt || null };
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  admin: {
    /** Listado paginado + contadores por estado. */
    async getAll({ status, page, limit } = {}) {
      const res = await api.get(`/contact${buildQuery({ status, page, limit })}`);
      return {
        data: (res.data || []).map(mapMessage),
        pagination: res.pagination || null,
        counts: res.counts || {},
        newCount: res.newCount || 0,
      };
    },

    async getById(id) {
      const res = await api.get(`/contact/${id}`);
      return mapMessage(res.data);
    },

    /** Cambia el estado y, opcionalmente, las notas internas. */
    async updateStatus(id, { status, adminNotes } = {}) {
      const body = { status };
      // Solo se manda la clave si se quiere tocar: el backend interpreta su
      // ausencia como "no modificar la columna" (PATCH parcial).
      if (adminNotes !== undefined) body.admin_notes = adminNotes;
      const res = await api.patch(`/contact/${id}`, body);
      return mapMessage(res.data);
    },
  },
};
