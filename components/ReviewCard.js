import RatingStars from '@/components/RatingStars';
import { safeFormatDate } from '@/lib/date';

// `review` con la forma que devuelve reviewService (mapReview): clientName,
// clientAvatar, createdAt, rating, title, comment, providerReply.
export default function ReviewCard({ review }) {
  const initial = (review.clientName || 'C').charAt(0).toUpperCase();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        {review.clientAvatar ? (
          <img
            src={review.clientAvatar}
            alt={review.clientName}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-gray-900">{review.clientName}</span>
            <span className="text-xs text-gray-400 shrink-0">{safeFormatDate(review.createdAt)}</span>
          </div>
          <RatingStars rating={review.rating} size={13} />
        </div>
      </div>
      {review.title && <p className="text-sm font-bold text-gray-900 mt-2 mb-1">{review.title}</p>}
      {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
      {review.providerReply && (
        <div className="mt-3 bg-gray-50 rounded-xl px-3.5 py-2.5 border-l-2 border-primary/30">
          <p className="text-xs font-bold text-primary mb-0.5">Respuesta del proveedor</p>
          <p className="text-xs text-gray-600 leading-relaxed">{review.providerReply}</p>
        </div>
      )}
    </div>
  );
}
