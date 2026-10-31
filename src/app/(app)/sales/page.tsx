'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DateFilter } from '@/components/DateFilter';
import { Button, Card, Empty, fmtDate, inputCls, Loading, money, Notice, PageHeader, Table } from '@/components/ui';
import { buildQuery, dateParams, defaultDateFilter } from '@/lib/dateFilter';
import { Paged, SaleRow, SalesSummary } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function SalesHistory() {
  const [date, setDate] = useState(defaultDateFilter('this_month'));
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t); }, [q]);

  const filters = { ...dateParams(date), status, paymentMethod: method, q: dq };
  const key = JSON.stringify(filters);
  useEffect(() => { setPage(1); }, [key]);

  const list = useFetch<Paged<SaleRow>>(`/sales?${buildQuery({ ...filters, page })}`);
  const summary = useFetch<SalesSummary>(`/sales/summary?${buildQuery(filters)}`);
  const s = summary.data;

  return (
    <>
      <PageHeader title="Sales history" sub="Filter by day, week, month, year or your own dates." action={<Link href="/sales/new"><Button>New sale</Button></Link>} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <DateFilter value={date} onChange={setDate} />
        <label><span className="mb-1 block text-xs font-medium text-ink-muted">Payment</span>
          <select className={`${inputCls} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All sales</option><option value="due">With due</option><option value="paid">Fully paid</option></select></label>
        <label><span className="mb-1 block text-xs font-medium text-ink-muted">Method</span>
          <select className={`${inputCls} !w-auto capitalize`} value={method} onChange={(e) => setMethod(e.target.value)}><option value="">Any method</option>{['cash', 'bkash', 'nagad', 'card', 'other'].map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-medium text-ink-muted">Invoice</span>
          <input className={`${inputCls} !w-36`} placeholder="INV-000…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </div>
      {(list.error || summary.error) && <Notice>{list.error || summary.error}</Notice>}

      {s && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Sales" value={String(s.count)} />
          <Stat label="Total sold" value={money(s.total)} />
          <Stat label="Received" value={money(s.paid)} />
          <Stat label="Added to dues" value={money(s.due)} warn={s.due > 0} />
          {s.profit !== undefined && <Stat label="Profit" value={money(s.profit)} />}
        </div>
      )}

      <Card>
        {list.loading ? <Loading /> : !list.data?.items.length ? <Empty>No sales match these filters.</Empty> : (
          <Table head={['Invoice', 'Date', 'Customer', 'Method', 'Total', 'Paid', 'Due']}>
            {list.data.items.map((r) => (
              <tr key={r._id}>
                <td className="num font-medium">{r.invoiceNo}</td><td className="whitespace-nowrap">{fmtDate(r.createdAt)}</td><td>{r.customerId?.name ?? 'Walk-in'}</td><td className="capitalize">{r.paymentMethod}</td>
                <td className="num">{money(r.total)}</td><td className="num">{money(r.paidAmount)}</td><td className={`num ${r.dueAmount ? 'font-medium text-marigold' : 'text-ink-muted'}`}>{money(r.dueAmount)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {list.data && list.data.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="num">Page {page} of {list.data.pages}</span>
          <Button variant="ghost" disabled={page >= list.data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {s && s.byDay.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-brand">Day-by-day totals ({s.byDay.length} days)</summary>
          <Card className="mt-3">
            <Table head={s.profit !== undefined ? ['Date', 'Sales', 'Total', 'Dues', 'Profit'] : ['Date', 'Sales', 'Total', 'Dues']}>
              {s.byDay.map((d) => (
                <tr key={d.date}><td>{fmtDate(d.date)}</td><td className="num">{d.count}</td><td className="num">{money(d.total)}</td><td className={`num ${d.due ? 'text-marigold' : 'text-ink-muted'}`}>{money(d.due)}</td>{d.profit !== undefined && <td className="num">{money(d.profit)}</td>}</tr>
              ))}
            </Table>
          </Card>
        </details>
      )}
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Card className={`p-4 ${warn ? 'border-marigold/40' : ''}`}>
      <div className="text-sm text-ink-muted">{label}</div>
      <div className={`num mt-1 text-xl font-semibold ${warn ? 'text-marigold' : ''}`}>{value}</div>
    </Card>
  );
}
