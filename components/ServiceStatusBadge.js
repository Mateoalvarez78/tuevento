import { SERVICE_STATUS } from '@/utils/constants';

/**
 * Displays a colored badge for a service listing status.
 * size: 'sm' | 'md' (default: 'sm')
 */
export default function ServiceStatusBadge({ status, size = 'sm' }) {
  const cfg = SERVICE_STATUS[status];
  if (!cfg) return null;

  const padding = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';
  const iconSize = size === 'md' ? 14 : 12;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${padding} ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {Icon && <Icon size={iconSize} className="shrink-0" aria-hidden="true" />}
      {cfg.label}
    </span>
  );
}
