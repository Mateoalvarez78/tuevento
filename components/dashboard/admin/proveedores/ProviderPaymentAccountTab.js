'use client';

// Cuenta de cobro del proveedor en dLocal Go (Split Payments).
// Flujo: el proveedor acepta en dLocal Go la colaboración que le propone
// Eventonow → el admin carga acá el código → el backend lo verifica contra
// dLocal (activa y con la misma comisión) → el admin la habilita.
// Ver eventonow-back/docs/payments/RUNBOOK.md#conectar-un-proveedor.

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Link2, Power } from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { useApp } from '@/lib/AppContext';
import AppIcon from '@/components/AppIcon';
import Button from '@/components/Button';
import Input from '@/components/Input';

const COLLAB_LABEL = { ACTIVE: 'Activa', PENDING: 'Pendiente de aceptación', CANCELLED: 'Cancelada' };

export default function ProviderPaymentAccountTab({ providerId }) {
  const { showToast } = useApp();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAccount(await paymentService.adminGetPaymentAccount(providerId));
    } catch (e) {
      showToast(e?.message || 'No se pudo cargar la cuenta de cobro', 'error');
    } finally {
      setLoading(false);
    }
  }, [providerId, showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const connect = async () => {
    setBusy(true);
    try {
      setAccount(await paymentService.adminConnectPaymentAccount(providerId, code.trim()));
      setCode('');
      showToast('Código verificado con dLocal Go', 'success');
    } catch (e) {
      showToast(e?.message || 'No se pudo verificar el código', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (enabled) => {
    setBusy(true);
    try {
      setAccount(await paymentService.adminSetPaymentAccountEnabled(providerId, enabled));
      showToast(enabled ? 'Cobros online habilitados' : 'Cobros online deshabilitados', 'success');
    } catch (e) {
      showToast(e?.message || 'No se pudo actualizar', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Cargando…</p>;

  const ready = account?.connected && account.collaboration_status === 'ACTIVE' && account.commission_matches === true;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="rounded-xl border border-gray-800 p-5 space-y-2 text-sm text-gray-300">
        <p><span className="text-gray-500">Conexión:</span> {account?.connected ? `Conectada (${account.split_code_hint})` : 'Sin conectar'}</p>
        {account?.connected && (
          <>
            <p><span className="text-gray-500">Colaboración:</span> {COLLAB_LABEL[account.collaboration_status] || 'Desconocida'}</p>
            <p>
              <span className="text-gray-500">Comisión:</span> dLocal {account.collaborator_commission_percent ?? '—'} % · Eventonow {(Number(account.provider_commission_rate) * 100).toFixed(2)} %
              {' '}
              {account.commission_matches
                ? <AppIcon icon={CheckCircle2} size={14} className="inline text-emerald-400" aria-label="coinciden" />
                : <AppIcon icon={AlertTriangle} size={14} className="inline text-amber-400" aria-label="no coinciden" />}
            </p>
            <p><span className="text-gray-500">Cobros online:</span> {account.is_enabled ? 'Habilitados' : 'Deshabilitados'}</p>
            {account.verification_error && (
              <p className="text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2">{account.verification_error}</p>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label="Código de la colaboración (dLocal Go)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Pegá el código que generó la colaboración"
          />
        </div>
        <Button icon={Link2} loading={busy} disabled={!code.trim()} onClick={connect}>
          {account?.connected ? 'Reemplazar' : 'Verificar y conectar'}
        </Button>
      </div>

      {account?.connected && (
        account.is_enabled ? (
          <Button variant="danger" icon={Power} disabled={busy} onClick={() => toggle(false)}>Deshabilitar cobros online</Button>
        ) : (
          <Button variant="success" icon={Power} disabled={busy || !ready} onClick={() => toggle(true)}>Habilitar cobros online</Button>
        )
      )}
    </div>
  );
}
