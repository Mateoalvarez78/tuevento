import { PROVIDER_STATUS } from '@/utils/constants';

/**
 * Displays a colored badge for a provider status.
 * size: 'sm' | 'md' (default: 'sm')
 */
export default function ProviderStatusBadge({ status, size = 'sm' }) {
  const cfg = PROVIDER_STATUS[status];
  if (!cfg) return null;

  const padding = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${padding} ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
