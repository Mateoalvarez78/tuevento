import { SERVICE_STATUS } from '@/utils/constants';
import Badge from '@/components/Badge';

/**
 * Displays a colored badge for a service listing status.
 * size: 'sm' | 'md' (default: 'sm')
 */
export default function ServiceStatusBadge({ status, size = 'sm' }) {
  const cfg = SERVICE_STATUS[status];
  if (!cfg) return null;
  return <Badge bg={cfg.bg} text={cfg.text} border={cfg.border} icon={cfg.icon} label={cfg.label} size={size} />;
}
