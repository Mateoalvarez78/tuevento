'use client';

import { Store, Package, CalendarClock } from 'lucide-react';
import { formatRelativeDate } from '@/lib/date';

const TYPE_ICON = { provider: Store, service: Package, booking: CalendarClock };

function relative(dateStr) {
  return formatRelativeDate(dateStr, '');
}

export default function ActivityTimeline({ activity = [] }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Actividad reciente</h3>
      {activity.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Sin actividad reciente.</div>
      ) : (
        <ol className="relative border-l border-gray-800 ml-2 space-y-4">
          {activity.map((a, i) => {
            const Icon = TYPE_ICON[a.type] || CalendarClock;
            return (
              <li key={i} className="ml-4">
                <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <Icon size={9} className="text-gray-400" aria-hidden="true" />
                </span>
                <p className="text-sm text-gray-200 leading-tight">{a.text}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{relative(a.date)}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
