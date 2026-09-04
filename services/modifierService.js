// Inclusiones, grupos de adicionales y adicionales base de una opción.
//
// Las rutas conservan `/packages`: "Opción" es terminología visible, no un
// cambio de contrato. Los mappers traducen snake_case del backend a camelCase,
// mismo criterio que serviceService.js.
//
// Con PACKAGE_MODIFIERS_ENABLED apagado el backend responde 404 genérico en
// todos estos endpoints. La UI lo trata como "funcionalidad no disponible",
// nunca como un error del proveedor.
import { api } from './api';

// ── Mappers ───────────────────────────────────────────────────────────────────

export const mapInclusion = (i) => ({
  id: i.id,
  name: i.name,
  quantity: i.quantity ?? null,
  description: i.description ?? '',
  sortOrder: i.sort_order ?? 0,
  isActive: i.is_active !== false,
});

export const mapGroupItem = (it) => ({
  id: it.id,
  extraId: it.extra_id,
  // El nombre viene del extra base; el precio, del delta de esta asociación.
  name: it.extra_name ?? it.name ?? '',
  priceDelta: it.price_delta == null ? 0 : parseFloat(it.price_delta),
  sortOrder: it.sort_order ?? 0,
  isActive: it.is_active !== false,
});

export const mapGroup = (g) => {
  const items = (g.items || []).map(mapGroupItem);
  const min = Number(g.min_selections ?? 0);
  return {
    id: g.id,
    name: g.name,
    description: g.description ?? '',
    minSelections: min,
    maxSelections: g.max_selections == null ? null : Number(g.max_selections),
    // "Obligatorio" se DERIVA del mínimo: no existe una columna paralela.
    isRequired: min > 0,
    sortOrder: g.sort_order ?? 0,
    isActive: g.is_active !== false,
    items,
  };
};

export const mapExtra = (e) => ({
  id: e.id,
  name: e.name,
  price: e.price == null ? 0 : parseFloat(e.price),
  isActive: e.is_active !== false,
  // Cuántos grupos lo usan: la UI lo necesita para explicar por qué
  // "Eliminar" desactiva en lugar de borrar.
  groupUsages: Number(e.group_usages ?? 0),
});

// ── API ───────────────────────────────────────────────────────────────────────

const base = (serviceId, packageId) => `/services/${serviceId}/packages/${packageId}`;

export const modifierService = {
  // ── Inclusiones ─────────────────────────────────────────────────────────
  async getInclusions(serviceId, packageId) {
    const res = await api.get(`${base(serviceId, packageId)}/inclusions`);
    return (res.data || []).map(mapInclusion);
  },

  async createInclusion(serviceId, packageId, data) {
    const res = await api.post(`${base(serviceId, packageId)}/inclusions`, {
      name: data.name,
      quantity: data.quantity === '' || data.quantity == null ? null : Number(data.quantity),
      description: data.description || null,
    });
    return mapInclusion(res.data);
  },

  async updateInclusion(serviceId, packageId, inclusionId, data) {
    const body = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.quantity !== undefined) body.quantity = data.quantity === '' || data.quantity == null ? null : Number(data.quantity);
    if (data.description !== undefined) body.description = data.description || null;
    if (data.isActive !== undefined) body.is_active = data.isActive;
    const res = await api.put(`${base(serviceId, packageId)}/inclusions/${inclusionId}`, body);
    return mapInclusion(res.data);
  },

  async deleteInclusion(serviceId, packageId, inclusionId) {
    await api.delete(`${base(serviceId, packageId)}/inclusions/${inclusionId}`);
  },

  async reorderInclusions(serviceId, packageId, orderedIds) {
    const res = await api.patch(`${base(serviceId, packageId)}/inclusions/reorder`, { order: orderedIds });
    return (res.data || []).map(mapInclusion);
  },

  // ── Grupos de adicionales ───────────────────────────────────────────────
  async getGroups(serviceId, packageId) {
    const res = await api.get(`${base(serviceId, packageId)}/modifier-groups`);
    return (res.data || []).map(mapGroup);
  },

  async createGroup(serviceId, packageId, data) {
    const res = await api.post(`${base(serviceId, packageId)}/modifier-groups`, {
      name: data.name,
      description: data.description || null,
      min_selections: Number(data.minSelections ?? 0),
      max_selections: data.maxSelections == null || data.maxSelections === '' ? null : Number(data.maxSelections),
    });
    return mapGroup(res.data);
  },

  async updateGroup(serviceId, packageId, groupId, data) {
    const body = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.description !== undefined) body.description = data.description || null;
    if (data.minSelections !== undefined) body.min_selections = Number(data.minSelections);
    if (data.maxSelections !== undefined) {
      body.max_selections = data.maxSelections == null || data.maxSelections === '' ? null : Number(data.maxSelections);
    }
    const res = await api.put(`${base(serviceId, packageId)}/modifier-groups/${groupId}`, body);
    return mapGroup(res.data);
  },

  async setGroupStatus(serviceId, packageId, groupId, isActive) {
    const res = await api.patch(`${base(serviceId, packageId)}/modifier-groups/${groupId}/status`, { is_active: isActive });
    return res.data;
  },

  async deleteGroup(serviceId, packageId, groupId) {
    await api.delete(`${base(serviceId, packageId)}/modifier-groups/${groupId}`);
  },

  // ── Items del grupo ─────────────────────────────────────────────────────
  async addItem(serviceId, packageId, groupId, data) {
    const res = await api.post(`${base(serviceId, packageId)}/modifier-groups/${groupId}/items`, {
      extra_id: data.extraId,
      price_delta: Number(data.priceDelta ?? 0),
    });
    return mapGroupItem(res.data);
  },

  async updateItem(serviceId, packageId, groupId, itemId, data) {
    const body = {};
    // `extra_id` no se manda nunca: reapuntar un item cambiaría en silencio
    // lo que el cliente creyó elegir. Se quita y se agrega de nuevo.
    if (data.priceDelta !== undefined) body.price_delta = Number(data.priceDelta);
    if (data.isActive !== undefined) body.is_active = data.isActive;
    const res = await api.put(`${base(serviceId, packageId)}/modifier-groups/${groupId}/items/${itemId}`, body);
    return mapGroupItem(res.data);
  },

  async removeItem(serviceId, packageId, groupId, itemId) {
    await api.delete(`${base(serviceId, packageId)}/modifier-groups/${groupId}/items/${itemId}`);
  },

  // ── Adicionales base del servicio ───────────────────────────────────────
  async getExtras(serviceId) {
    const res = await api.get(`/services/${serviceId}/extras`);
    return (res.data || []).map(mapExtra);
  },

  async createExtra(serviceId, data) {
    const res = await api.post(`/services/${serviceId}/extras`, {
      name: data.name,
      price: Number(data.price ?? 0),
    });
    return mapExtra(res.data);
  },

  async updateExtra(serviceId, extraId, data) {
    const res = await api.put(`/services/${serviceId}/extras/${extraId}`, {
      name: data.name,
      price: Number(data.price ?? 0),
    });
    return mapExtra(res.data);
  },

  // "Eliminar" desactiva: el adicional puede estar referenciado en reservas y
  // snapshots históricos. No existe borrado físico para el proveedor.
  async deactivateExtra(serviceId, extraId) {
    const res = await api.delete(`/services/${serviceId}/extras/${extraId}`);
    return res.data;
  },

  async setExtraStatus(serviceId, extraId, isActive) {
    const res = await api.patch(`/services/${serviceId}/extras/${extraId}/status`, { is_active: isActive });
    return res.data;
  },
};
