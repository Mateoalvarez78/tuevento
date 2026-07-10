// ─── SERVICE IMAGE SERVICE ────────────────────────────────────────────────────
// Gestión de imágenes de un servicio (provider-only en backend).
// Usa FormData para la subida. No se hace fetch directo desde componentes.

import { api, assetUrl } from './api';

// Config visible en la UI (el backend también valida).
export const IMAGE_LIMITS = {
  maxCount: 10,
  maxSizeMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedLabel: 'JPG, PNG o WEBP',
};

function mapImage(img) {
  if (!img) return null;
  // Imágenes subidas antes de la migración a Cloudinary viven en /uploads del
  // filesystem de Render, que no es persistente — pueden estar rotas (404) en
  // cualquier momento (restart/redeploy). Las identificamos por no tener
  // public_id (todo lo nuevo se sube a Cloudinary y sí lo tiene).
  const isLegacyLocal = !img.public_id && /^\/uploads\//.test(img.url || '');
  return {
    id: img.id,
    serviceId: img.service_id,
    url: assetUrl(img.url),      // absoluta contra el backend (o ya absoluta si es Cloudinary)
    rawUrl: img.url,
    publicId: img.public_id || null,
    isLegacyLocal,
    isMain: !!img.is_primary,
    sortOrder: img.sort_order || 0,
    originalName: img.original_name || img.filename || '',
    mimeType: img.mime_type || '',
    sizeBytes: img.size_bytes || 0,
  };
}

export const serviceImageService = {
  async getServiceImages(serviceId) {
    const res = await api.get(`/services/${serviceId}/images`);
    return (res.data || []).map(mapImage);
  },

  /** Sube una o varias imágenes (File[]). Campo multipart: 'images'. */
  async uploadServiceImages(serviceId, files) {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('images', f));
    const res = await api.upload(`/services/${serviceId}/images`, form);
    return (res.data || []).map(mapImage);
  },

  async setMainServiceImage(serviceId, imageId) {
    const res = await api.patch(`/services/${serviceId}/images/${imageId}/main`);
    return mapImage(res.data);
  },

  async reorderServiceImages(serviceId, imageIds) {
    const res = await api.patch(`/services/${serviceId}/images/reorder`, { imageIds });
    return (res.data || []).map(mapImage);
  },

  async deleteServiceImage(serviceId, imageId) {
    await api.delete(`/services/${serviceId}/images/${imageId}`);
    return true;
  },

  /** Validación en el cliente (además del backend). Devuelve { valid, error }. */
  validateFile(file) {
    if (!IMAGE_LIMITS.allowedTypes.includes(file.type)) {
      return { valid: false, error: `Tipo no permitido (${IMAGE_LIMITS.allowedLabel}).` };
    }
    if (file.size > IMAGE_LIMITS.maxSizeMB * 1024 * 1024) {
      return { valid: false, error: `Supera ${IMAGE_LIMITS.maxSizeMB} MB.` };
    }
    return { valid: true, error: null };
  },
};
