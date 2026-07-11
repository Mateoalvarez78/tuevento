'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { categoryService } from '@/services/categoryService';
import { ZONES } from '@/utils/constants';

const CURRENCIES = ['UYU', 'USD', 'ARS'];
const PAYMENT_METHODS = ['Transferencia bancaria', 'Mercado Pago', 'Efectivo', 'Otro'];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors';

export default function EditarProveedorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  const [account, setAccount] = useState({ ownerName: '', email: '', phone: '' });
  const [business, setBusiness] = useState({
    businessName: '', legalName: '', taxId: '', categoryId: '',
    description: '', city: '', department: '', address: '', zones: [],
  });
  const [commercial, setCommercial] = useState({
    commissionRate: '', currency: 'UYU', paymentMethod: '',
    bankName: '', accountType: '', accountNumber: '', accountHolder: '',
  });
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    adminService.getProvider(id)
      .then((p) => {
        if (!active || !p) return;
        setAccount({ ownerName: p.ownerName || '', email: p.email || '', phone: p.phone || '' });
        setBusiness({
          businessName: p.businessName || '',
          legalName: p.legalName || '',
          taxId: p.taxId || '',
          categoryId: p.categoryId || '',
          description: p.description || '',
          city: p.city || '',
          department: p.department || '',
          address: p.address || '',
          zones: p.zones || [],
        });
        setCommercial({
          commissionRate: p.commissionRate != null ? (p.commissionRate * 100).toString() : '',
          currency: p.currency || 'UYU',
          paymentMethod: p.paymentMethod || '',
          bankName: p.bankAccount?.bankName || '',
          accountType: p.bankAccount?.accountType || '',
          accountNumber: p.bankAccount?.accountNumber || '',
          accountHolder: p.bankAccount?.accountHolder || '',
        });
        setInternalNotes(p.internalNotes || '');
      })
      .catch((e) => setError(e?.message || 'No se pudo cargar el proveedor'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const toggleZone = (zone) => {
    setBusiness((prev) => ({
      ...prev,
      zones: prev.zones.includes(zone) ? prev.zones.filter((z) => z !== zone) : [...prev.zones, zone],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const commissionRate = commercial.commissionRate !== ''
        ? Math.max(0, Math.min(1, parseFloat(commercial.commissionRate) / 100))
        : null;
      const bankAccount = (commercial.bankName || commercial.accountNumber || commercial.accountHolder)
        ? {
            bankName: commercial.bankName || undefined,
            accountType: commercial.accountType || undefined,
            accountNumber: commercial.accountNumber || undefined,
            accountHolder: commercial.accountHolder || undefined,
          }
        : undefined;

      await adminService.providers.update(id, {
        ownerName: account.ownerName,
        email: account.email,
        phone: account.phone,
        businessName: business.businessName,
        legalName: business.legalName,
        taxId: business.taxId,
        categoryId: business.categoryId,
        description: business.description,
        city: business.city,
        department: business.department,
        address: business.address,
        zones: business.zones,
        currency: commercial.currency,
        paymentMethod: commercial.paymentMethod,
        bankAccount,
        commissionRate,
        internalNotes,
      });
      router.push(`/admin/proveedores/${id}`);
    } catch (err) {
      setError(err?.message || 'No se pudo guardar los cambios. Revisá los datos e intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 sm:p-8 text-gray-500 text-sm">Cargando proveedor…</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href={`/admin/proveedores/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors">
        <ArrowLeft size={15} /> Volver al proveedor
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1">Editar proveedor</h1>
      <p className="text-gray-400 text-sm mb-8">Corregí datos mal anotados o actualizá información del negocio.</p>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Responsable</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre del responsable">
              <input className={inputCls} value={account.ownerName} onChange={(e) => setAccount({ ...account, ownerName: e.target.value })} />
            </Field>
            <Field label="Email">
              <input type="email" className={inputCls} value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <input type="tel" className={inputCls} value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} />
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Negocio</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Field label="Nombre comercial">
              <input className={inputCls} value={business.businessName} onChange={(e) => setBusiness({ ...business, businessName: e.target.value })} />
            </Field>
            <Field label="Razón social">
              <input className={inputCls} value={business.legalName} onChange={(e) => setBusiness({ ...business, legalName: e.target.value })} />
            </Field>
            <Field label="RUT">
              <input className={inputCls} value={business.taxId} onChange={(e) => setBusiness({ ...business, taxId: e.target.value })} />
            </Field>
            <Field label="Categoría">
              <select className={inputCls} value={business.categoryId} onChange={(e) => setBusiness({ ...business, categoryId: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Ciudad">
              <input className={inputCls} value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} />
            </Field>
            <Field label="Departamento">
              <select className={inputCls} value={business.department} onChange={(e) => setBusiness({ ...business, department: e.target.value })}>
                <option value="">Seleccionar…</option>
                {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Dirección">
            <input className={inputCls} value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} />
          </Field>
          <div className="h-4" />
          <Field label="Descripción">
            <textarea rows={3} className={`${inputCls} resize-none`} value={business.description} onChange={(e) => setBusiness({ ...business, description: e.target.value })} />
          </Field>
          <div className="h-4" />
          <Field label="Zonas donde trabaja">
            <div className="flex flex-wrap gap-2">
              {ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => toggleZone(z)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    business.zones.includes(z) ? 'bg-primary/15 border-primary/40 text-primary' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Comercial</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Field label="Comisión Eventonow (%)">
              <input type="number" min="0" max="100" step="0.1" className={inputCls} value={commercial.commissionRate}
                onChange={(e) => setCommercial({ ...commercial, commissionRate: e.target.value })}
                placeholder="Default de la plataforma" />
            </Field>
            <Field label="Moneda">
              <select className={inputCls} value={commercial.currency} onChange={(e) => setCommercial({ ...commercial, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Método de cobro">
              <select className={inputCls} value={commercial.paymentMethod} onChange={(e) => setCommercial({ ...commercial, paymentMethod: e.target.value })}>
                <option value="">Sin definir</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>
          <p className="text-xs text-gray-500 mb-3">Cuenta bancaria (opcional, para liquidaciones)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Banco">
              <input className={inputCls} value={commercial.bankName} onChange={(e) => setCommercial({ ...commercial, bankName: e.target.value })} />
            </Field>
            <Field label="Tipo de cuenta">
              <input className={inputCls} value={commercial.accountType} onChange={(e) => setCommercial({ ...commercial, accountType: e.target.value })} placeholder="Caja de ahorro / Cuenta corriente" />
            </Field>
            <Field label="Número de cuenta">
              <input className={inputCls} value={commercial.accountNumber} onChange={(e) => setCommercial({ ...commercial, accountNumber: e.target.value })} />
            </Field>
            <Field label="Titular">
              <input className={inputCls} value={commercial.accountHolder} onChange={(e) => setCommercial({ ...commercial, accountHolder: e.target.value })} />
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <Field label="Notas internas">
            <textarea rows={3} className={`${inputCls} resize-none`} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Solo visibles para el equipo de Eventonow" />
          </Field>
        </div>

        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/admin/proveedores/${id}`} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
