'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import Tooltip from '@/components/Tooltip';

const TONE_LIGHT = {
  gray:    'text-gray-500 bg-gray-100',
  primary: 'text-primary bg-primary-light',
  amber:   'text-amber-600 bg-amber-50',
  emerald: 'text-emerald-600 bg-emerald-50',
  blue:    'text-blue-600 bg-blue-50',
  rose:    'text-rose-500 bg-rose-50',
  violet:  'text-violet-600 bg-violet-50',
  orange:  'text-orange-600 bg-orange-50',
};

const TONE_DARK = {
  gray:    'text-gray-400 bg-gray-800',
  amber:   'text-amber-400 bg-amber-500/15',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  blue:    'text-blue-400 bg-blue-500/10',
  red:     'text-red-400 bg-red-500/10',
};

function TrendBadge({ pct, inverse = false }) {
  const up = pct >= 0;
  const good = inverse ? !up : up;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${good ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
      <AppIcon icon={up ? TrendingUp : TrendingDown} size={10} aria-hidden="true" />
      {up ? '+' : ''}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

/**
 * Card de métrica única, compartida por los dashboards de admin/proveedor/
 * cliente (antes: 3 implementaciones locales casi idénticas — `Card` en
 * AdminStats, `MetricCard` en ProviderOverview, markup inline en ClientStats
 * y en `SummaryCards` de DashCommissions).
 *
 * No inventa tendencias ni períodos: `trend`/`sub` solo se muestran si el
 * caller los pasa con datos reales.
 */
export default function MetricCard({
  icon, label, value, sub, tooltip,
  trend, trendInverse = false,
  tone = 'gray', theme = 'light', highlight = false,
  loading = false, error = null,
  className = '',
}) {
  const isDark = theme === 'dark';
  const wrapperCls = isDark
    ? `rounded-2xl border p-4 ${highlight ? 'border-amber-500/40 bg-amber-500/5' : 'border-gray-800 bg-gray-900'}`
    : 'rounded-2xl border border-gray-100 bg-white shadow-sm p-4 hover:shadow-md transition-shadow';

  if (loading) {
    return (
      <div className={`${wrapperCls} ${className}`}>
        <div className="skeleton w-8 h-8 rounded-xl mb-3" />
        <div className="skeleton h-6 w-16 rounded mb-1.5" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  const toneMap = isDark ? TONE_DARK : TONE_LIGHT;
  const toneCls = highlight
    ? (isDark ? 'text-amber-400 bg-amber-500/15' : 'text-amber-600 bg-amber-50')
    : (toneMap[tone] || toneMap.gray);
  const labelCls = isDark ? 'text-[11px] text-gray-400 font-medium leading-tight' : 'text-xs text-gray-500 font-medium leading-tight';
  const valueCls = isDark ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-gray-900';
  const subCls = isDark ? 'text-[11px] text-gray-500 mt-0.5' : 'text-[11px] text-gray-400 mt-0.5';

  return (
    <div className={`${wrapperCls} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toneCls}`}>
              <AppIcon icon={icon} size={15} aria-hidden="true" />
            </span>
          )}
          <span className={`${labelCls} truncate`}>{label}</span>
        </div>
        {trend != null ? <TrendBadge pct={trend} inverse={trendInverse} /> : (tooltip ? <Tooltip text={tooltip} /> : null)}
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        <>
          <div className={valueCls}>{value}</div>
          {sub && <div className={subCls}>{sub}</div>}
        </>
      )}
    </div>
  );
}
