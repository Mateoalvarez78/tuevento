'use client';

import { ReviewsSection } from '@/components/dashboard/proveedor/DashWidgets';
import { useProviderDashboard } from '../layout';

export default function ProviderReviewsPage() {
  const { providerData } = useProviderDashboard();
  return <ReviewsSection provider={providerData} />;
}
