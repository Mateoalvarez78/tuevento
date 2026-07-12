'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, User, Building2, Landmark, ClipboardList,
  Check, Copy, ArrowRight,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { categoryService } from '@/services/categoryService';
import { ZONES } from '@/utils/constants';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Chip from '@/components/Chip';

const STEPS = [
  { label: 'Responsable', icon: User },
  { label: 'Negocio',     icon: Building2 },
  { label: 'Comercial',   icon: Landmark },
  { label: 'Revisión',    icon: ClipboardList },
];

const CURRENCIES = ['UYU', 'USD', 'ARS'];
const PAYMENT_METHODS = ['Transferencia bancaria', 'Mercado Pago', 'Efectivo', 'Otro'];

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const selectCls = 'w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors';

export default function NuevoProveedorPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { provider, temporaryPassword, user }
  const [copied, setCopied] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

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

  const toggleZone = (zone) => {
    setBusiness((prev) => ({
      ...prev,
      zones: prev.zones.includes(zone) ? prev.zones.filter((z) => z !== zone) : [...prev.zones, zone],
    }));
  };

  const stepValid = () => {
    if (step === 0) return account.ownerName.trim() && account.email.trim();
    if (step === 1) return business.businessName.trim();
    return true;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
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

      const res = await adminService.providers.create({
        ownerName: account.ownerName,
        email: account.email,
        phone: account.phone,
        businessName: business.businessName,
        legalName: business.legalName,
        taxId: business.taxId,
        categoryId: business.categoryId || null,
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
      setResult(res);
    } catch (err) {
      setError(err?.message || 'No se pudo crear el proveedor. Revisá los datos e intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard?.writeText(result.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="p-4 sm:p-8 max-w-lg mx-auto">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <AppIcon icon={Check} size={26} aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Proveedor creado</h1>
          <p className="text-gray-400 text-sm mb-6">
            {result.provider?.businessName || business.businessName} ya puede iniciar sesión con estas credenciales.
          </p>

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-left space-y-3 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Usuario</p>
              <p className="text-sm text-gray-200 font-mono">{result.user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Contraseña temporal</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-200 font-mono flex-1">{result.temporaryPassword}</p>
                <Button iconOnly icon={Copy} variant="ghost" theme="dark" size="sm" aria-label="Copiar" title="Copiar" onClick={copyPassword} />
              </div>
              {copied && <p className="text-xs text-emerald-400 mt-1">Copiado</p>}
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-6">
            Todavía no hay envío de email automático conectado — comunicá estas credenciales al proveedor por el canal que corresponda.
          </p>

          <div className="flex gap-2 justify-center">
            <Button href="/admin/proveedores">Volver a proveedores</Button>
            <Button variant="outline" theme="dark" href={`/admin/proveedores/${result.provider?.id}`}>Ver perfil</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <Link href="/admin/proveedores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors">
        <AppIcon icon={ArrowLeft} size={15} aria-hidden="true" /> Proveedores
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1">Nuevo proveedor</h1>
      <p className="text-gray-400 text-sm mb-8">Alta manual — el proveedor recibe sus credenciales y solo tiene que iniciar sesión.</p>

      {/* Steps */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => {
          const active = i === step;
          const complete = i < step;
          return (
            <div key={s.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                  complete ? 'bg-primary border-primary text-white' : active ? 'border-primary text-primary' : 'border-gray-700 text-gray-600'
                }`}>
                  <AppIcon icon={complete ? Check : s.icon} size={15} aria-hidden="true" />
                </div>
                <span className={`text-[11px] font-medium ${active || complete ? 'text-gray-200' : 'text-gray-600'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 -mt-5 ${complete ? 'bg-primary' : 'bg-gray-800'}`} />}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-4">
        {/* Step 0: Responsable */}
        {step === 0 && (
          <>
            <Field label="Nombre del responsable" required>
              <Input variant="dark" value={account.ownerName} onChange={(e) => setAccount({ ...account, ownerName: e.target.value })} placeholder="Nombre y apellido" />
            </Field>
            <Field label="Email" required>
              <Input variant="dark" type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} placeholder="responsable@negocio.com" />
            </Field>
            <Field label="Teléfono">
              <Input variant="dark" type="tel" value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} placeholder="+598 9..." />
            </Field>
          </>
        )}

        {/* Step 1: Negocio */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre comercial" required>
                <Input variant="dark" value={business.businessName} onChange={(e) => setBusiness({ ...business, businessName: e.target.value })} placeholder="Ej: Delicias del Sur Catering" />
              </Field>
              <Field label="Razón social">
                <Input variant="dark" value={business.legalName} onChange={(e) => setBusiness({ ...business, legalName: e.target.value })} />
              </Field>
              <Field label="RUT">
                <Input variant="dark" value={business.taxId} onChange={(e) => setBusiness({ ...business, taxId: e.target.value })} />
              </Field>
              <Field label="Categoría">
                <select className={selectCls} value={business.categoryId} onChange={(e) => setBusiness({ ...business, categoryId: e.target.value })}>
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Ciudad">
                <Input variant="dark" value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} />
              </Field>
              <Field label="Departamento">
                <select className={selectCls} value={business.department} onChange={(e) => setBusiness({ ...business, department: e.target.value })}>
                  <option value="">Seleccionar…</option>
                  {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Dirección">
              <Input variant="dark" value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} />
            </Field>
            <Field label="Descripción">
              <textarea rows={3} className={`${selectCls} resize-none`} value={business.description} onChange={(e) => setBusiness({ ...business, description: e.target.value })} />
            </Field>
            <Field label="Zonas donde trabaja">
              <div className="flex flex-wrap gap-2">
                {ZONES.map((z) => (
                  <Chip key={z} selected={business.zones.includes(z)} onClick={() => toggleZone(z)}>{z}</Chip>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* Step 2: Comercial */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Comisión Eventonow (%)">
                <Input variant="dark" type="number" min="0" max="100" step="0.1" value={commercial.commissionRate}
                  onChange={(e) => setCommercial({ ...commercial, commissionRate: e.target.value })}
                  placeholder="Default de la plataforma" />
              </Field>
              <Field label="Moneda">
                <select className={selectCls} value={commercial.currency} onChange={(e) => setCommercial({ ...commercial, currency: e.target.value })}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Método de cobro">
                <select className={selectCls} value={commercial.paymentMethod} onChange={(e) => setCommercial({ ...commercial, paymentMethod: e.target.value })}>
                  <option value="">Sin definir</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <p className="text-xs text-gray-500 pt-2 border-t border-gray-800">Cuenta bancaria (opcional, para liquidaciones)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Banco">
                <Input variant="dark" value={commercial.bankName} onChange={(e) => setCommercial({ ...commercial, bankName: e.target.value })} />
              </Field>
              <Field label="Tipo de cuenta">
                <Input variant="dark" value={commercial.accountType} onChange={(e) => setCommercial({ ...commercial, accountType: e.target.value })} placeholder="Caja de ahorro / Cuenta corriente" />
              </Field>
              <Field label="Número de cuenta">
                <Input variant="dark" value={commercial.accountNumber} onChange={(e) => setCommercial({ ...commercial, accountNumber: e.target.value })} />
              </Field>
              <Field label="Titular">
                <Input variant="dark" value={commercial.accountHolder} onChange={(e) => setCommercial({ ...commercial, accountHolder: e.target.value })} />
              </Field>
            </div>
          </>
        )}

        {/* Step 3: Notas + Revisión */}
        {step === 3 && (
          <>
            <Field label="Notas internas">
              <textarea rows={3} className={`${selectCls} resize-none`} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Solo visibles para el equipo de Eventonow" />
            </Field>
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-gray-200 font-semibold mb-2">Resumen</p>
              <SummaryRow label="Responsable" value={`${account.ownerName} · ${account.email}`} />
              <SummaryRow label="Negocio" value={business.businessName} />
              <SummaryRow label="Ubicación" value={[business.city, business.department].filter(Boolean).join(', ') || '—'} />
              <SummaryRow label="Zonas" value={business.zones.join(', ') || '—'} />
              <SummaryRow label="Comisión" value={commercial.commissionRate ? `${commercial.commissionRate}%` : 'Default de la plataforma'} />
              <SummaryRow label="Moneda" value={commercial.currency} />
            </div>
            {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
          </>
        )}

        {/* Nav buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="ghost"
            theme="dark"
            className={step === 0 ? 'opacity-0 pointer-events-none' : ''}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Atrás
          </Button>
          {step < STEPS.length - 1 ? (
            <Button icon={ArrowRight} iconPosition="right" disabled={!stepValid()} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Siguiente
            </Button>
          ) : (
            <Button loading={submitting} onClick={handleSubmit}>
              {submitting ? 'Creando…' : 'Crear proveedor'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 text-right">{value}</span>
    </div>
  );
}
