'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, AlertTriangle } from 'lucide-react';
import { reviewService } from '@/services/reviewService';
import EmptyState from '@/components/EmptyState';
import RatingStars from '@/components/RatingStars';
import { safeFormatDate } from '@/lib/date';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ─── REVIEWS (datos reales vía GET /reviews/mine) ─────────────────────────────
const RATING_FILTERS = [
  { value: '', label: 'Todas' },
  { value: '5', label: '5★' },
  { value: '4', label: '4★' },
  { value: '3', label: '3★' },
  { value: '2', label: '2★' },
  { value: '1', label: '1★' },
];

export function ReviewsSection({ provider }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ unanswered: 0, avgResponseHours: null });
  const [ratingFilter, setRatingFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyOpen, setReplyOpen] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    reviewService.getMine({ rating: ratingFilter || undefined })
      .then((res) => { setReviews(res.data); setStats(res.stats); setLoading(false); })
      .catch((err) => { setError(err?.message || 'No se pudieron cargar las reseñas'); setLoading(false); });
  };

  useEffect(() => { load(); }, [ratingFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReply = async (id) => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await reviewService.reply(id, reply.trim());
      setReplyOpen(null);
      setReply('');
      load();
    } catch (_) {
      // el error se muestra igual si el usuario reintenta; sin toast global acá
    } finally {
      setSending(false);
    }
  };

  const header = (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Opiniones</h3>
          {provider?.reviewCount > 0 && (
            <p className="text-xs text-gray-400">{provider.reviewCount} reseña{provider.reviewCount !== 1 ? 's' : ''} · promedio {provider.rating?.toFixed(1)}★</p>
          )}
        </div>
        {provider?.rating > 0 && (
          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 text-xs font-bold px-2.5 py-1 rounded-xl">
            <Star size={12} className="fill-current" /> {provider.rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        {stats.unanswered > 0 && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
            {stats.unanswered} sin responder
          </span>
        )}
        {stats.avgResponseHours != null && (
          <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            Responde en ~{stats.avgResponseHours}hs en promedio
          </span>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {RATING_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setRatingFilter(f.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              ratingFilter === f.value ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {header}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <AlertTriangle size={28} className="mx-auto text-amber-500 mb-3" />
        <p className="text-gray-700 font-medium mb-1">No pudimos cargar tus reseñas</p>
        <p className="text-sm text-gray-500 mb-5">{error}</p>
        <button onClick={load} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {header}
      {reviews.length === 0 ? (
        ratingFilter ? (
          <EmptyState icon={Star} title="Sin reseñas con este filtro" description="Probá con otra calificación." />
        ) : (
          <EmptyState icon={Star} title="Sin reseñas todavía" description="Cuando un cliente reseñe una reserva completada, va a aparecer acá." />
        )
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-gray-100 rounded-xl p-3.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 overflow-hidden">
                    {r.clientAvatar ? (
                      <img src={r.clientAvatar} alt={r.clientName} className="w-full h-full object-cover" />
                    ) : (
                      r.clientName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{r.clientName}</p>
                    <p className="text-[10px] text-gray-400">{r.serviceTitle}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <RatingStars rating={r.rating} size={12} />
                  {r.createdAt && <p className="text-[10px] text-gray-400">{safeFormatDate(r.createdAt)}</p>}
                </div>
              </div>
              {r.title && <p className="text-xs font-bold text-gray-800 mb-0.5">{r.title}</p>}
              {r.comment && <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{r.comment}</p>}
              {r.providerReply ? (
                <div className="mt-2.5 bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-primary/30">
                  <p className="text-[10px] font-bold text-primary mb-0.5">Tu respuesta</p>
                  <p className="text-xs text-gray-600">{r.providerReply}</p>
                </div>
              ) : (
                <div className="mt-2">
                  {replyOpen === r.id ? (
                    <div>
                      <textarea
                        className="w-full text-xs border border-gray-200 rounded-xl p-2.5 resize-none focus:outline-none focus:border-primary"
                        rows={2} placeholder="Escribí tu respuesta..."
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                      />
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => handleReply(r.id)}
                          disabled={sending || !reply.trim()}
                          className="flex items-center gap-1 text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                          <Send size={10} /> {sending ? 'Enviando...' : 'Responder'}
                        </button>
                        <button onClick={() => { setReplyOpen(null); setReply(''); }} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setReplyOpen(r.id)} className="text-[11px] font-semibold text-primary hover:underline">
                      Responder reseña
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
