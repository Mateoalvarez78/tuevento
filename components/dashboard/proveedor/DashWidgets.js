'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star, ChevronRight, Send, X, AlertTriangle, Lightbulb, Flame,
  Clock, CheckCircle2, TrendingDown, RefreshCcw, UserPlus, Users,
  DollarSign, CalendarClock, CreditCard, ArrowRight,
} from 'lucide-react';
import {
  REVIEWS_DATA, GOALS, PAYMENTS, ACTIVITY_FEED, ALERTS,
  PERFORMANCE, QUICK_ACTIONS,
} from '@/lib/proveedorDashboardData';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ─── ALERTS ──────────────────────────────────────────────────────────────────
const ALERT_STYLES = {
  opportunity: { bg: 'bg-orange-50 border-orange-200', icon: <Flame size={15} className="text-orange-500" />, titleColor: 'text-orange-700' },
  warning:     { bg: 'bg-amber-50  border-amber-200',  icon: <AlertTriangle size={15} className="text-amber-500" />, titleColor: 'text-amber-700' },
  tip:         { bg: 'bg-blue-50   border-blue-200',   icon: <Lightbulb size={15} className="text-blue-500" />, titleColor: 'text-blue-700' },
};

export function AlertsBar() {
  const [dismissed, setDismissed] = useState(new Set());
  const visible = ALERTS.filter((a) => !dismissed.has(a.id));
  if (!visible.length) return null;
  return (
    <div className="space-y-2">
      {visible.map((a) => {
        const styles = ALERT_STYLES[a.level];
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${styles.bg}`}
          >
            <div className="mt-0.5 shrink-0">{styles.icon}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${styles.titleColor}`}>{a.title}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{a.text}</p>
            </div>
            <button onClick={() => setDismissed((s) => new Set([...s, a.id]))} className="shrink-0 mt-0.5 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={12} className={i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-200'} />
      ))}
    </div>
  );
}

export function ReviewsSection() {
  const [replyOpen, setReplyOpen] = useState(null);
  const [reply, setReply] = useState('');
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Reseñas recientes</h3>
          <p className="text-xs text-gray-400">124 reseñas · promedio 4.9★</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 text-xs font-bold px-2.5 py-1 rounded-xl">
          <Star size={12} className="fill-current" /> 4.9
        </div>
      </div>
      <div className="space-y-4">
        {REVIEWS_DATA.slice(0, 3).map((r) => (
          <div key={r.id} className="border border-gray-100 rounded-xl p-3.5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <img src={r.clientAvatar} alt={r.clientName} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <p className="text-xs font-bold text-gray-800">{r.clientName}</p>
                  <p className="text-[10px] text-gray-400">{r.service}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <StarRow rating={r.rating} />
                <p className="text-[10px] text-gray-400">{new Date(r.date).toLocaleDateString('es-UY', { day:'2-digit', month:'short' })}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{r.text}</p>
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
                      <button className="flex items-center gap-1 text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors">
                        <Send size={10} /> Responder
                      </button>
                      <button onClick={() => setReplyOpen(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
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
    </motion.div>
  );
}

// ─── GOALS ───────────────────────────────────────────────────────────────────
function formatGoal(g) {
  if (g.format === 'currency') return `$${(g.current / 1000).toFixed(0)}K / $${(g.target / 1000).toFixed(0)}K`;
  if (g.format === 'decimal')  return `${g.current} / ${g.target} ${g.unit}`;
  return `${g.current} / ${g.target}`;
}

export function GoalsPanel() {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Objetivos del mes</h3>
        <span className="text-xs text-gray-400">Junio 2026</span>
      </div>
      <div className="space-y-4">
        {GOALS.map((g) => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          return (
            <div key={g.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700">{g.label}</span>
                <span className="text-xs font-bold" style={{ color: g.color }}>{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: g.color }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{formatGoal(g)}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────
export function PerformancePanel() {
  const p = PERFORMANCE;
  const metrics = [
    { icon:<Clock size={14} className="text-blue-500" />,         label:'Tiempo de respuesta', value:`${p.responseTime} min`, color:'text-blue-600',   bg:'bg-blue-50'   },
    { icon:<CheckCircle2 size={14} className="text-emerald-500" />,label:'Reservas aceptadas',  value:`${p.acceptanceRate}%`, color:'text-emerald-600', bg:'bg-emerald-50' },
    { icon:<TrendingDown size={14} className="text-red-400" />,    label:'Tasa cancelación',    value:`${p.cancellationRate}%`,color:'text-red-500',    bg:'bg-red-50'    },
    { icon:<RefreshCcw size={14} className="text-violet-500" />,   label:'Clientes repetidos',  value:`${p.repeatBookingRate}%`,color:'text-violet-600', bg:'bg-violet-50' },
    { icon:<UserPlus size={14} className="text-primary" />,        label:'Clientes nuevos',     value:String(p.newClientsThisMonth), color:'text-primary', bg:'bg-primary-light' },
    { icon:<Users size={14} className="text-gray-500" />,          label:'Clientes recurrentes',value:String(p.recurringClients), color:'text-gray-700', bg:'bg-gray-100'  },
  ];
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Rendimiento</h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className={`${m.bg} rounded-xl p-3`}>
            <div className="flex items-center gap-1.5 mb-1">{m.icon}<span className="text-[10px] text-gray-500 font-medium leading-tight">{m.label}</span></div>
            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export function PaymentsCard() {
  const pmt = PAYMENTS;
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Pagos</h3>
        <CreditCard size={16} className="text-gray-400" />
      </div>
      {/* Pending payout */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 mb-4 text-white">
        <p className="text-xs text-gray-400 mb-1">Pendiente de cobro</p>
        <p className="text-2xl font-bold">${pmt.pendingAmount.toLocaleString('es-UY')}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <CalendarClock size={12} className="text-emerald-400" />
          <p className="text-xs text-emerald-400 font-medium">Próximo depósito: {pmt.nextPayout}</p>
        </div>
      </div>
      <div className="space-y-2.5 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Procesado este mes</span>
          <span className="font-bold text-gray-900">${(pmt.thisMonthProcessed / 1000).toFixed(0)}K</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Comisión plataforma ({pmt.platformFee}%)</span>
          <span className="font-semibold text-red-500">-${((pmt.thisMonthProcessed * pmt.platformFee) / 100 / 1000).toFixed(0)}K</span>
        </div>
        <div className="flex justify-between text-xs border-t border-gray-100 pt-2">
          <span className="text-gray-600 font-semibold">Neto a cobrar</span>
          <span className="font-bold text-emerald-600">${(pmt.thisMonthProcessed * (1 - pmt.platformFee / 100) / 1000).toFixed(0)}K</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Historial reciente</p>
        <div className="space-y-1.5">
          {pmt.history.slice(0, 3).map((h) => (
            <div key={h.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-500">{h.date}</span>
              </div>
              <span className="text-xs font-bold text-gray-800">${(h.amount / 1000).toFixed(0)}K</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── ACTIVITY FEED ───────────────────────────────────────────────────────────
export function ActivityTimeline() {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Actividad reciente</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-100" />
        <div className="space-y-4">
          {ACTIVITY_FEED.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 pl-0"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 z-10 ring-4 ring-white" style={{ background: `${item.color}22` }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-medium text-gray-700 leading-snug">{item.text}</p>
                {item.amount && (
                  <p className="text-xs font-bold text-emerald-600">${item.amount.toLocaleString('es-UY')}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">{item.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── QUICK ACTIONS ───────────────────────────────────────────────────────────
export function QuickActionsGrid({ onTabChange }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Acciones rápidas</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => onTabChange?.(a.tab)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
            style={{ background: a.bg }}
          >
            <span className="text-2xl leading-none">{a.icon}</span>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight group-hover:text-gray-900">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
