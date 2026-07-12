'use client';

import { useState } from 'react';
import RatingStars from '@/components/RatingStars';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Button from '@/components/Button';
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
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar tu valoración' : '¿Cómo fue tu experiencia?'}
      size="sm"
      footer={
        <Button className="w-full" disabled={!rating} loading={saving} onClick={handleSubmit}>
          {isEdit ? 'Guardar cambios' : 'Enviar valoración'}
        </Button>
      }
    >
      <p className="text-sm text-gray-500 mb-1">{booking.serviceTitle}</p>
      <p className="text-xs text-gray-400 mb-4">{booking.providerName}</p>

      <div className="flex flex-col items-center py-4 bg-gray-50 rounded-2xl mb-4">
        <RatingStars rating={rating} size={30} interactive onChange={setRating} />
        <p className="text-xs text-gray-400 mt-2">
          {rating > 0 ? `${rating} de 5 estrellas` : 'Elegí una calificación'}
        </p>
      </div>

      <Input
        wrapperClassName="mb-3"
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
    </Modal>
  );
}
