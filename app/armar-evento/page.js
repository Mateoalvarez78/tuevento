'use client';

import Link from 'next/link';
import { Bot, Sparkles, ArrowLeft, Search } from 'lucide-react';

export default function ArmarEventoPage() {
  return (
    <div className="bg-surface min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Bot size={30} className="text-primary" />
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary-light px-2.5 py-1 rounded-full mb-3">
          <Sparkles size={12} /> Próximamente
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">Armá tu evento con ayuda inteligente</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-8">
          Muy pronto vas a poder contarnos qué evento querés organizar —por ejemplo, <span className="font-medium text-gray-700">“un cumpleaños para 50 personas”</span>— y Eventonow te va a armar la mejor combinación de proveedores, con presupuesto estimado incluido.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/catalogo" className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm">
            <Search size={16} /> Mientras tanto, explorá servicios
          </Link>
          <Link href="/dashboard/cliente" className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-white transition-colors text-sm">
            <ArrowLeft size={16} /> Volver a mi panel
          </Link>
        </div>
      </div>
    </div>
  );
}
