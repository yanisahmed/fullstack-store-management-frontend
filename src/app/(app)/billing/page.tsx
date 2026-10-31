'use client';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Empty, fmtDate, Loading, money, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Plan } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

interface Pay { _id: string; amount: number; status: 'pending' | 'completed' | 'failed' | 'cancelled'; trxID?: string; createdAt: string; planId?: { name: string } }
const STATUS_MSG: Record<string, { kind: 'success' | 'error' | 'info'; text: string }> = {
  success: { kind: 'success', text: 'Payment received. Your plan is now active.' },
  failed: { kind: 'error', text: 'The bKash payment did not go through. You were not charged. Please try again.' },
  cancelled: { kind: 'info', text: 'Payment cancelled.' },
  invalid: { kind: 'error', text: 'We could not match that payment. Contact support if money was deducted.' },
};

export default function Billing() {
  const { store, expired, isRole, reload } = useAuth();
  const plans = useFetch<Plan[]>('/subscriptions/plans');
  const pays = useFetch<Pay[]>(isRole('admin') ? '/subscriptions/payments' : null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { const s = new URLSearchParams(window.location.search).get('status'); if (s) { setStatus(s); reload(); } }, [reload]);

  async function pay(planId: string) {
    setBusy(planId); setError('');
    try { const r = await api<{ bkashURL: string }>('/subscriptions/checkout', { method: 'POST', body: { planId } }); window.location.href = r.bkashURL; }
    catch (e) { setError((e as Error).message); setBusy(''); }
  }

  const sub = store?.subscription;
  return (
    <>
      <PageHeader title="Plan & billing" sub={store ? `${store.name}: ${expired ? 'expired' : sub?.status === 'trial' ? 'free trial' : 'active'}${sub?.expiresAt ? `, until ${fmtDate(sub.expiresAt)}` : ''}` : undefined} />
      {status && STATUS_MSG[status] && <Notice kind={STATUS_MSG[status].kind}>{STATUS_MSG[status].text}</Notice>}
      {error && <Notice>{error}</Notice>}
      {!isRole('admin') && <Notice kind="info">Only a shop admin can change the plan.</Notice>}

      {plans.loading ? <Loading /> : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.data?.map((p) => (
            <Card key={p._id} className="flex flex-col p-5">
              <h2 className="font-semibold">{p.name}</h2>
              <div className="num mt-2 text-3xl font-semibold">{money(p.priceBDT)}<span className="text-sm font-normal text-ink-muted"> / {p.durationDays >= 365 ? 'year' : `${p.durationDays} days`}</span></div>
              <ul className="my-4 flex-1 space-y-1 text-sm">{p.modules.map((m) => <li key={m} className="capitalize">{m}</li>)}</ul>
              {isRole('admin') && <Button disabled={!!busy} onClick={() => pay(p._id)}>{busy === p._id ? 'Opening bKash…' : 'Pay with bKash'}</Button>}
            </Card>
          ))}
        </div>
      )}

      {isRole('admin') && (
        <Card className="mt-8">
          <h2 className="px-4 pt-4 font-semibold">Payment history</h2>
          {pays.loading ? <Loading /> : !pays.data?.length ? <Empty>No payments yet.</Empty> : (
            <Table head={['Date', 'Plan', 'Amount', 'bKash trxID', 'Status']}>
              {pays.data.map((p) => (
                <tr key={p._id}><td>{fmtDate(p.createdAt)}</td><td>{p.planId?.name}</td><td className="num">{money(p.amount)}</td><td className="num">{p.trxID ?? '-'}</td>
                  <td><Badge kind={p.status === 'completed' ? 'ok' : p.status === 'pending' ? 'warn' : 'bad'}>{p.status}</Badge></td></tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}
