import { Star } from 'lucide-react';

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= rating ? 'star-filled fill-current' : 'star-empty'} />
      ))}
    </div>
  );
}

export default function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <img
          src={review.avatar}
          alt={review.author}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-gray-900">{review.author}</span>
            <span className="text-xs text-gray-400 shrink-0">{review.date}</span>
          </div>
          <Stars rating={review.rating} />
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
    </div>
  );
}
