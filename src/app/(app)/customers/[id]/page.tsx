'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { DateFilter } from '@/components/DateFilter';
import { buildQuery, dateParams, defaultDateFilter } from '@/lib/dateFilter';
import { Badge, Button, Card, Empty, Field, fmtDate, inputCls, Loading, money, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { Customer, LedgerEntry } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const info = useFetch<{ customer: Customer; summary: { totalPurchased: number; totalPaid: number; purchases: number; currentDue: number } }>(`/customers/${id}`);
  const [date, setDate] = useState(defaultDateFilter('all'));
  const [entryType, setEntryType] = useState('');
  const ledger = useFetch<{ entries: LedgerEntry[]; totals: { purchased: number; paid: number } }>(`/customers/${id}/ledger?${buildQuery({ ...dateParams(date), type: entryType })}`);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  async function pay(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/customers/${id}/payments`, { method: 'POST', body: { amount: +amount, note: note || undefined } });
      setAmount(''); setNote(''); setMsg({ kind: 'success', text: 'Payment recorded.' }); info.reload(); ledger.reload();
    } catch (err) { setMsg({ kind: 'error', text: (err as Error).message }); }
  }
  async function shareWhatsApp() {
    try { const r = await api<{ url: string }>(`/customers/${id}/whatsapp-dues`); window.open(r.url, '_blank', 'noopener'); } catch (err) { setMsg({ kind: 'error', text: (err as Error).message }); }
  }

  if (info.loading) return <Loading />;
  if (!info.data) return <Notice>{info.error || 'Customer not found'}</Notice>;
  const { customer: c, summary: s } = info.data;

  return (
    <>
      <Link href="/customers" className="mb-2 inline-block text-sm text-brand">Back to customers</Link>
      <PageHeader title={c.name} sub={[c.phone, c.address].filter(Boolean).join(' • ') || undefined}
        action={c.dueBalance > 0 && <Button onClick={shareWhatsApp} disabled={!c.phone} title={c.phone ? '' : 'Add a phone number first'}>Send due on WhatsApp</Button>} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><div className="text-sm text-ink-muted">Total purchased</div><div className="num mt-1 text-2xl font-semibold">{money(s.totalPurchased)}</div></Card>
        <Card className="p-4"><div className="text-sm text-ink-muted">Total paid</div><div className="num mt-1 text-2xl font-semibold">{money(s.totalPaid)}</div></Card>
        <Card className={`p-4 ${s.currentDue > 0 ? 'border-marigold/40' : ''}`}><div className="text-sm text-ink-muted">Owes now</div><div className={`num mt-1 text-2xl font-semibold ${s.currentDue > 0 ? 'text-marigold' : ''}`}>{money(s.currentDue)}</div></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4">
            <h2 className="font-semibold">Ledger</h2>
            <div className="flex flex-wrap items-end gap-3">
              <DateFilter value={date} onChange={setDate} />
              <label><span className="mb-1 block text-xs font-medium text-ink-muted">Entries</span>
                <select className={`${inputCls} !w-auto`} value={entryType} onChange={(e) => setEntryType(e.target.value)}>
                  <option value="">All</option><option value="sale">Purchases</option><option value="payment">Payments</option>
                </select></label>
            </div>
          </div>
          {ledger.data && date.period !== 'all' && <p className="num px-4 pt-3 text-sm text-ink-muted">In this period: bought {money(ledger.data.totals.purchased)}, paid {money(ledger.data.totals.paid)}</p>}
          {ledger.loading ? <Loading /> : !ledger.data?.entries.length ? <Empty>No activity in this period.</Empty> : (
            <Table head={['Date', 'Entry', 'Amount', 'Balance']}>
              {ledger.data.entries.map((l) => (
                <tr key={l._id}>
                  <td>{fmtDate(l.createdAt)}</td>
                  <td>{l.type === 'sale' ? <Badge kind="warn">Purchase</Badge> : l.type === 'payment' ? <Badge kind="ok">Payment</Badge> : <Badge>Adjustment</Badge>} <span className="text-ink-muted">{l.note}</span></td>
                  <td className="num">{l.type === 'payment' ? '−' : '+'}{money(l.amount)}</td>
                  <td className="num">{money(l.balanceAfter)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card className="h-fit p-4">
          <h2 className="mb-3 font-semibold">Receive payment</h2>
          {c.dueBalance <= 0 ? <p className="text-sm text-ink-muted">Nothing is due from this customer.</p> : (
            <form onSubmit={pay} className="space-y-3">
              <Field label="Amount"><input className={`${inputCls} num`} type="number" min="1" max={c.dueBalance} step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
              <button type="button" className="text-sm text-brand" onClick={() => setAmount(String(c.dueBalance))}>Pay full {money(c.dueBalance)}</button>
              <Field label="Note (optional)"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              <Button className="w-full">Record payment</Button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
