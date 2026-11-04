'use client';
import Link from 'next/link';
import { useState } from 'react';
import { DateFilter } from '@/components/DateFilter';
import { Button, Card, Empty, fmtDate, inputCls, Loading, money, Notice, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { buildQuery, dateParams, defaultDateFilter } from '@/lib/dateFilter';
import { dateLocale, Key, useI18n } from '@/lib/i18n';
import { formatQty } from '@/lib/units';
import { useFetch } from '@/lib/useFetch';

interface N { _id: string; type: string; title: string; message?: string; link?: string; isRead: boolean; createdAt: string; code?: string; params?: Record<string, any> }
const TYPES = ['low_stock', 'customer_due', 'payment_received', 'subscription', 'system'];

export default function Notifications() {
  const { t } = useI18n();
  // Newer notifications carry a code + params so they can be shown in the chosen language
  function render(n: N): { title: string; message?: string } {
    const p = n.params ?? {};
    switch (n.code) {
      case 'low_stock': return { title: t('nf.low_stock.t', { name: p.name }), message: t('nf.low_stock.m', { q: formatQty(+p.stock, p.unit) }) };
      case 'customer_due': return { title: t('nf.customer_due.t', { name: p.name }), message: t('nf.customer_due.m', { amt: money(+p.amount), inv: p.invoice }) };
      case 'payment_received': return { title: t('nf.payment_received.t', { name: p.name }), message: t('nf.payment_received.m', { amt: money(+p.amount), due: money(+p.due) }) };
      case 'subscription': return { title: t('nf.subscription.t'), message: t('nf.subscription.m', { plan: p.plan, date: fmtDate(p.date) }) };
      default: return { title: n.title, message: n.message };
    }
  }
  const [date, setDate] = useState(defaultDateFilter('all'));
  const [type, setType] = useState('');
  const [unread, setUnread] = useState(false);
  const { data, loading, error, reload } = useFetch<{ unreadCount: number; items: N[] }>(`/notifications?${buildQuery({ ...dateParams(date), type, unread })}`);
  const markRead = async (id: string) => { await api(`/notifications/${id}/read`, { method: 'PATCH' }); reload(); };
  const markAll = async () => { await api('/notifications/read-all', { method: 'PATCH' }); reload(); };
  return (
    <>
      <PageHeader title={t('no.title')} sub={data ? t('no.unread', { n: data.unreadCount }) : undefined} action={!!data?.unreadCount && <Button variant="ghost" onClick={markAll}>{t('no.markAll')}</Button>} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <DateFilter value={date} onChange={setDate} />
        <label><span className="mb-1 block text-xs font-medium text-ink-muted">{t('no.kind')}</span>
          <select className={`${inputCls} !w-auto`} value={type} onChange={(e) => setType(e.target.value)}><option value="">{t('no.allKinds')}</option>{TYPES.map((k) => <option key={k} value={k}>{t(`nt.${k}` as Key)}</option>)}</select></label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} /> {t('no.unreadOnly')}</label>
      </div>
      {error && <Notice>{error}</Notice>}
      <Card>
        {loading ? <Loading /> : !data?.items.length ? <Empty>{t('no.empty')}</Empty> : (
          <ul className="divide-y divide-ink-line">
            {data.items.map((n) => { const r = render(n); return (
              <li key={n._id} className={`flex items-start justify-between gap-4 px-4 py-3 ${n.isRead ? '' : 'border-l-[3px] border-marigold bg-marigold-tint/40'}`}>
                <div>
                  <div className="font-medium">{n.link ? <Link href={n.link} className="hover:underline">{r.title}</Link> : r.title}</div>
                  {r.message && <div className="text-sm text-ink-muted">{r.message}</div>}
                  <div className="mt-0.5 text-xs text-ink-muted">{new Date(n.createdAt).toLocaleString(dateLocale())}</div>
                </div>
                {!n.isRead && <Button variant="quiet" onClick={() => markRead(n._id)}>{t('no.markRead')}</Button>}
              </li>
            ); })}
          </ul>
        )}
      </Card>
    </>
  );
}
