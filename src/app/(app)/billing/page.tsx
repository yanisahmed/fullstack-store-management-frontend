'use client';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Empty, fmtDate, Loading, money, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Key, useI18n } from '@/lib/i18n';
import { Plan } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

interface Pay { _id: string; amount: number; status: 'pending' | 'completed' | 'failed' | 'cancelled'; trxID?: string; createdAt: string; planId?: { name: string } }
const STATUS_KIND: Record<string, 'success' | 'error' | 'info'> = { success: 'success', failed: 'error', cancelled: 'info', invalid: 'error' };

export default function Billing() {
  const { store, expired, isRole, reload } = useAuth();
  const { t } = useI18n();
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
  const state = expired ? t('bi.expired') : sub?.status === 'trial' ? t('bi.trial') : t('bi.active');
  return (
    <>
      <PageHeader title={t('bi.title')} sub={store ? t('bi.sub', { store: store.name, state, until: sub?.expiresAt ? t('bi.until', { date: fmtDate(sub.expiresAt) }) : '' }) : undefined} />
      {status && STATUS_KIND[status] && <Notice kind={STATUS_KIND[status]}>{t(`bi.m.${status}` as Key)}</Notice>}
      {error && <Notice>{error}</Notice>}
      {!isRole('admin') && <Notice kind="info">{t('bi.onlyAdmin')}</Notice>}

      {plans.loading ? <Loading /> : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.data?.map((p) => (
            <Card key={p._id} className="flex flex-col p-5">
              <h2 className="font-semibold">{p.name}</h2>
              <div className="num mt-2 text-3xl font-semibold">{money(p.priceBDT)}<span className="text-sm font-normal text-ink-muted"> / {p.durationDays >= 365 ? t('bi.perYear') : t('bi.perDays', { n: p.durationDays })}</span></div>
              <ul className="my-4 flex-1 space-y-1 text-sm">{p.modules.map((m) => <li key={m}>{t(`mod.${m}` as Key)}</li>)}</ul>
              {isRole('admin') && <Button disabled={!!busy} onClick={() => pay(p._id)}>{busy === p._id ? t('bi.opening') : t('bi.pay')}</Button>}
            </Card>
          ))}
        </div>
      )}

      {isRole('admin') && (
        <Card className="mt-8">
          <h2 className="px-4 pt-4 font-semibold">{t('bi.history')}</h2>
          {pays.loading ? <Loading /> : !pays.data?.length ? <Empty>{t('bi.noPayments')}</Empty> : (
            <Table head={[t('c.date'), t('bi.plan'), t('c.amount'), t('bi.trx'), t('c.status')]}>
              {pays.data.map((p) => (
                <tr key={p._id}><td>{fmtDate(p.createdAt)}</td><td>{p.planId?.name}</td><td className="num">{money(p.amount)}</td><td className="num">{p.trxID ?? '-'}</td>
                  <td><Badge kind={p.status === 'completed' ? 'ok' : p.status === 'pending' ? 'warn' : 'bad'}>{t(`ps.${p.status}` as Key)}</Badge></td></tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}
