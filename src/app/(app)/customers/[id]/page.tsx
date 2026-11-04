'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { CustomerModal } from '@/components/CustomerModal';
import { Thumb } from '@/components/Thumb';
import { DateFilter } from '@/components/DateFilter';
import { Badge, Button, Card, Empty, Field, fmtDate, inputCls, Loading, money, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { buildQuery, dateParams, defaultDateFilter } from '@/lib/dateFilter';
import { useI18n } from '@/lib/i18n';
import { Customer, LedgerEntry } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const info = useFetch<{ customer: Customer; summary: { totalPurchased: number; totalPaid: number; purchases: number; currentDue: number } }>(`/customers/${id}`);
  const [date, setDate] = useState(defaultDateFilter('all'));
  const [entryType, setEntryType] = useState('');
  const ledger = useFetch<{ entries: LedgerEntry[]; totals: { purchased: number; paid: number } }>(`/customers/${id}/ledger?${buildQuery({ ...dateParams(date), type: entryType })}`);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  async function pay(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/customers/${id}/payments`, { method: 'POST', body: { amount: +amount, note: note || undefined } });
      setAmount(''); setNote(''); setMsg({ kind: 'success', text: t('cu.recorded') }); info.reload(); ledger.reload();
    } catch (err) { setMsg({ kind: 'error', text: (err as Error).message }); }
  }
  async function shareWhatsApp() {
    try { const r = await api<{ url: string }>(`/customers/${id}/whatsapp-dues`); window.open(r.url, '_blank', 'noopener'); } catch (err) { setMsg({ kind: 'error', text: (err as Error).message }); }
  }

  if (info.loading) return <Loading />;
  if (!info.data) return <Notice>{info.error || t('cu.notFound')}</Notice>;
  const { customer: c, summary: s } = info.data;

  return (
    <>
      <Link href="/customers" className="mb-2 inline-block text-sm text-brand">{t('cu.back')}</Link>
      <PageHeader lead={<Thumb token={c.imageToken} name={c.name} size={64} round />} title={c.name} sub={[c.phone, c.address].filter(Boolean).join(' • ') || undefined}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(true)}>{t('c.edit')}</Button>
            {c.dueBalance > 0 && <Button onClick={shareWhatsApp} disabled={!c.phone} title={c.phone ? '' : t('cu.addPhone')}>{t('cu.sendWa')}</Button>}
          </div>} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><div className="text-sm text-ink-muted">{t('cu.purchased')}</div><div className="num mt-1 text-2xl font-semibold">{money(s.totalPurchased)}</div></Card>
        <Card className="p-4"><div className="text-sm text-ink-muted">{t('cu.totalPaid')}</div><div className="num mt-1 text-2xl font-semibold">{money(s.totalPaid)}</div></Card>
        <Card className={`p-4 ${s.currentDue > 0 ? 'border-marigold/40' : ''}`}><div className="text-sm text-ink-muted">{t('cu.owes')}</div><div className={`num mt-1 text-2xl font-semibold ${s.currentDue > 0 ? 'text-marigold' : ''}`}>{money(s.currentDue)}</div></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4">
            <h2 className="font-semibold">{t('cu.ledger')}</h2>
            <div className="flex flex-wrap items-end gap-3">
              <DateFilter value={date} onChange={setDate} />
              <label><span className="mb-1 block text-xs font-medium text-ink-muted">{t('cu.entries')}</span>
                <select className={`${inputCls} !w-auto`} value={entryType} onChange={(e) => setEntryType(e.target.value)}>
                  <option value="">{t('c.all')}</option><option value="sale">{t('cu.purchasesOpt')}</option><option value="payment">{t('cu.paymentsOpt')}</option>
                </select></label>
            </div>
          </div>
          {ledger.data && date.period !== 'all' && <p className="num px-4 pt-3 text-sm text-ink-muted">{t('cu.periodTotals', { a: money(ledger.data.totals.purchased), b: money(ledger.data.totals.paid) })}</p>}
          {ledger.loading ? <Loading /> : !ledger.data?.entries.length ? <Empty>{t('cu.noActivity')}</Empty> : (
            <Table head={[t('c.date'), t('cu.entry'), t('c.amount'), t('cu.balance')]}>
              {ledger.data.entries.map((l) => (
                <tr key={l._id}>
                  <td>{fmtDate(l.createdAt)}</td>
                  <td>{l.type === 'sale' ? <Badge kind="warn">{t('cu.purchase')}</Badge> : l.type === 'payment' ? <Badge kind="ok">{t('cu.payment')}</Badge> : <Badge>{t('cu.adjustment')}</Badge>} <span className="text-ink-muted">{l.note}</span></td>
                  <td className="num">{l.type === 'payment' ? '−' : '+'}{money(l.amount)}</td>
                  <td className="num">{money(l.balanceAfter)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
        <Card className="h-fit p-4">
          <h2 className="mb-3 font-semibold">{t('cu.receive')}</h2>
          {c.dueBalance <= 0 ? <p className="text-sm text-ink-muted">{t('cu.nothingDue')}</p> : (
            <form onSubmit={pay} className="space-y-3">
              <Field label={t('c.amount')}><input className={`${inputCls} num`} type="number" min="1" max={c.dueBalance} step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
              <button type="button" className="text-sm text-brand" onClick={() => setAmount(String(c.dueBalance))}>{t('cu.payFull', { amt: money(c.dueBalance) })}</button>
              <Field label={t('c.noteOpt')}><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              <Button className="w-full">{t('cu.record')}</Button>
            </form>
          )}
        </Card>
      </div>
      {editing && <CustomerModal customer={c} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); info.reload(); }} />}
    </>
  );
}
