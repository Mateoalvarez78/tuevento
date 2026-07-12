'use client';

import { Check } from 'lucide-react';
import AppIcon from '@/components/AppIcon';

export default function PackageSelector({ packages, selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {packages.map((pkg) => {
        const selected = selectedId === pkg.id;
        return (
          <button
            key={pkg.id}
            onClick={() => onSelect(pkg.id)}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 focus:outline-none ${
              selected
                ? 'border-primary bg-primary-light shadow-md'
                : 'border-gray-200 bg-white hover:border-primary/40 hover:shadow-sm'
            } ${pkg.popular ? 'ring-2 ring-primary/20' : ''}`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Más popular
                </span>
              </div>
            )}

            <div className="flex items-start justify-between mb-2">
              <h4 className={`font-bold text-base ${selected ? 'text-primary' : 'text-gray-900'}`}>
                {pkg.name}
              </h4>
              {selected && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <AppIcon icon={Check} size={14} className="text-white" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="mb-2">
              <span className={`text-2xl font-bold ${selected ? 'text-primary' : 'text-gray-900'}`}>
                ${(pkg.adultPrice ?? pkg.price).toLocaleString('es-UY')}
              </span>
              {pkg.priceUnit && (
                <span className="text-xs text-gray-500 ml-1">{pkg.priceUnit}</span>
              )}
              {pkg.hasChildPrice && (
                <div className="text-xs text-gray-500 mt-1">
                  Niños (hasta {pkg.childAgeLimit} años):{' '}
                  <span className="font-semibold text-gray-700">${pkg.childPrice.toLocaleString('es-UY')}</span>
                  {pkg.priceUnit ? ` ${pkg.priceUnit}` : ''}
                </div>
              )}
              {pkg.isDurationPackage && (
                <div className="text-xs text-gray-500 mt-1">
                  {pkg.durationHours} horas incluidas
                  {pkg.allowsExtraHours && (
                    <> · hora extra ${Number(pkg.extraHourPrice).toLocaleString('es-UY')} (máx. {pkg.maxExtraHours}hs)</>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-3 leading-relaxed">{pkg.description}</p>

            <ul className="space-y-1.5">
              {pkg.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <AppIcon icon={Check} size={13} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
