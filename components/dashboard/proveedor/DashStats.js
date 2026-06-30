'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Package, MousePointerClick, Eye, Star } from 'lucide-react';
import { CURRENT_STATS } from '@/lib/proveedorDashboardData';

const STAT_CONFIG = [
  {
    key: 'revenue',
    label: 'Ingresos del mes',
    Icon: DollarSign,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    accentColor: '#0BB885',
    format: (v) => `$${(v / 1000).toFixed(0)}K`,
  },
  {
    key: 'bookings',
    label: 'Reservas activas',
    Icon: Calendar,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    accentColor: '#2563EB',
    format: (v) => String(v),
  },
  {
    key: 'services',
    label: 'Servicios publicados',
    Icon: Package,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    accentColor: '#7C3AED',
    format: (v) => String(v),
  },
  {
    key: 'conversion',
    label: 'Conversión de visitas',
    Icon: MousePointerClick,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    accentColor: '#F97316',
    format: (v) => `${v}%`,
  },
  {
    key: 'profileViews',
    label: 'Visitas al perfil',
    Icon: Eye,
    iconBg: 'bg-primary-light',
    iconColor: 'text-primary',
    accentColor: '#E84D2C',
    format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v),
  },
  {
    key: 'rating',
    label: 'Calificación promedio',
    Icon: Star,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
    accentColor: '#F5A623',
    format: (v) => v.toFixed(1),
  },
];

function Sparkline({ data, color }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${50 - ((v - min) / range) * 44}`)
    .join(' ');
  const fillPts = `0,50 ${pts} 100,50`;
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
      <polygon points={fillPts} fill={color} fillOpacity="0.12" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendBadge({ current, prev }) {
  const pct = prev > 0 ? ((current - prev) / prev) * 100 : 0;
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
      <Icon size={10} />
      {up ? '+' : ''}{pct.toFixed(1)}%
    </div>
  );
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function DashStats() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
    >
      {STAT_CONFIG.map(({ key, label, Icon, iconBg, iconColor, accentColor, format }) => {
        const stat = CURRENT_STATS[key];
        return (
          <motion.div
            key={key}
            variants={itemVariants}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex flex-col gap-3 group cursor-default"
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon size={16} className={iconColor} />
              </div>
              <TrendBadge current={stat.value} prev={stat.prev} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-0.5 leading-tight">{label}</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{format(stat.value)}</p>
            </div>
            <div className="h-9 -mx-1">
              <Sparkline data={stat.sparkline} color={accentColor} />
            </div>
            <p className="text-[11px] text-gray-400">vs. mes anterior</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
