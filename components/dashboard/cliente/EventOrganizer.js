'use client';

import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export default function EventOrganizer({ categories = [] }) {
  const done = categories.filter((c) => c.done).length;
  const total = categories.length || 1;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Organizá tu evento paso a paso</h3>
          <p className="text-sm text-gray-500 mt-0.5">Marcá lo que ya tenés resuelto y completá el resto.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-extrabold text-primary leading-none">{pct}%</div>
          <div className="text-[11px] text-gray-400">completo</div>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/catalogo?categoria=${c.id}`}
            className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
              c.done
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-sm'
            }`}
          >
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.done ? 'bg-emerald-500 text-white' : 'bg-gray-100'}`}>
              {c.done ? <Check size={15} /> : <c.icon size={15} className="text-gray-500" aria-hidden="true" />}
            </span>
            <span className={`text-sm font-medium truncate ${c.done ? 'text-emerald-700' : 'text-gray-700'}`}>{c.label}</span>
          </Link>
        ))}
      </div>

      <Link href="/catalogo" className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-primary hover:underline">
        Seguir organizando <ArrowRight size={15} />
      </Link>
    </div>
  );
}
