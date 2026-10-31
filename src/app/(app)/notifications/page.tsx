'use client';
import Link from 'next/link';
import { useState } from 'react';
import { DateFilter } from '@/components/DateFilter';
import { Button, Card, Empty, inputCls, Loading, Notice, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { buildQuery, dateParams, defaultDateFilter } from '@/lib/dateFilter';
import { useFetch } from '@/lib/useFetch';

interface N { _id: string; type: string; title: string; message?: string; link?: string; isRead: boolean; createdAt: string }
const TYPES: Record<string, string> = { low_stock: 'Low stock', customer_due: 'New dues', payment_received: 'Payments', subscription: 'Subscription', system: 'System' };

export default function Notifications() {
  const [date, setDate] = useState(defaultDateFilter('all'));
  const [type, setType] = useState('');
  const [unread, setUnread] = useState(false);
  const { data, loading, error, reload } = useFetch<{ unreadCount: number; items: N[] }>(`/notifications?${buildQuery({ ...dateParams(date), type, unread })}`);
  const markRead = async (id: string) => { await api(`/notifications/${id}/read`, { method: 'PATCH' }); reload(); };
  const markAll = async () => { await api('/notifications/read-all', { method: 'PATCH' }); reload(); };
  return (
    <>
      <PageHeader title="Notifications" sub={data ? `${data.unreadCount} unread` : undefined} action={!!data?.unreadCount && <Button variant="ghost" onClick={markAll}>Mark all as read</Button>} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <DateFilter value={date} onChange={setDate} />
        <label><span className="mb-1 block text-xs font-medium text-ink-muted">Kind</span>
          <select className={`${inputCls} !w-auto`} value={type} onChange={(e) => setType(e.target.value)}><option value="">All kinds</option>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} /> Unread only</label>
      </div>
      {error && <Notice>{error}</Notice>}
      <Card>
        {loading ? <Loading /> : !data?.items.length ? <Empty>Nothing here for these filters. Low-stock, due and payment alerts appear here.</Empty> : (
          <ul className="divide-y divide-ink-line">
            {data.items.map((n) => (
              <li key={n._id} className={`flex items-start justify-between gap-4 px-4 py-3 ${n.isRead ? '' : 'border-l-[3px] border-marigold bg-marigold-tint/40'}`}>
                <div>
                  <div className="font-medium">{n.link ? <Link href={n.link} className="hover:underline">{n.title}</Link> : n.title}</div>
                  {n.message && <div className="text-sm text-ink-muted">{n.message}</div>}
                  <div className="mt-0.5 text-xs text-ink-muted">{new Date(n.createdAt).toLocaleString('en-GB')}</div>
                </div>
                {!n.isRead && <Button variant="quiet" onClick={() => markRead(n._id)}>Mark read</Button>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
