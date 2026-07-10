'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import RatingStars from '@/components/RatingStars';
import { reviewService } from '@/services/reviewService';

/**
 * Modal de calificación de una reserva completada. Sirve tanto para crear
 * (`existingReview` vacío) como para editar (`existingReview` presente,
 * dentro de la ventana de 30 minutos que valida el backend).
 */
export default function RateBookingModal({ booking, existingReview, onClose, onSaved }) {
  const [rating, setRating] = useState(existingReview?.reviewRating || 0);
  const [title, setTitle] = useState(existingReview?.reviewTitle || '');
  const [comment, setComment] = useState(existingReview?.reviewComment || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(existingReview?.reviewId);

  const handleSubmit = async () => {
    if (!rating) return;
    setSaving(true);
    setError(null);
    try {
      const review = isEdit
        ? await reviewService.update(existingReview.reviewId, { rating, title, comment })
        : await reviewService.create({ bookingId: booking.id, rating, title, comment });
      onSaved?.(review);
    } catch (e) {
      setError(e?.message || 'No se pudo guardar tu valoración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {isEdit ? 'Editar tu valoración' : '¿Cómo fue tu experiencia?'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-500 mb-1">{booking.serviceTitle}</p>
          <p className="text-xs text-gray-400 mb-4">{booking.providerName}</p>

          <div className="flex flex-col items-center py-4 bg-gray-50 rounded-2xl mb-4">
            <RatingStars rating={rating} size={30} interactive onChange={setRating} />
            <p className="text-xs text-gray-400 mt-2">
              {rating > 0 ? `${rating} de 5 estrellas` : 'Elegí una calificación'}
            </p>
          </div>

          <input
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm mb-3 focus:outline-none focus:border-primary"
            placeholder="Título (opcional)"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:border-primary"
            rows={4}
            maxLength={2000}
            placeholder="Contanos cómo fue tu experiencia (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!rating || saving}
            className="w-full mt-4 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Enviar valoración'}
          </button>
        </div>
      </div>
    </div>
  );
}
