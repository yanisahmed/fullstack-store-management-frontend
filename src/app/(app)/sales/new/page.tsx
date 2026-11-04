'use client';
import { useEffect, useMemo, useState } from 'react';
import { QtyInput } from '@/components/QtyInput';
import { Thumb } from '@/components/Thumb';
import { formatQty, round2 } from '@/lib/units';
import { Key, useI18n } from '@/lib/i18n';
import { Badge, Button, Card, Empty, Field, inputCls, money, Notice, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Customer, Paged, Product } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

interface Line { product: Product; quantity: number; unitPrice: number }

export default function NewSale() {
  const { hasModule, isRole } = useAuth();
  const { t } = useI18n();
  const canSell = isRole('admin', 'manager', 'cashier');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t); }, [q]);
  const products = useFetch<Paged<Product>>(`/products?limit=12&q=${encodeURIComponent(dq)}`);
  const customers = useFetch<Customer[]>(hasModule('customers') ? '/customers' : null);

  const [lines, setLines] = useState<Line[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState('');
  const [paid, setPaid] = useState<string>('');
  const [method, setMethod] = useState('cash');
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ invoiceNo: string; dueAmount: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const subtotal = useMemo(() => round2(lines.reduce((s, l) => s + round2(l.quantity * l.unitPrice), 0)), [lines]);
  const total = round2(Math.max(subtotal - (+discount || 0), 0));
  const paidNum = paid === '' ? total : +paid;
  const due = round2(Math.max(total - paidNum, 0));

  function add(p: Product) {
    setDone(null);
    setLines((ls) => ls.find((l) => l.product._id === p._id) ? ls.map((l) => l.product._id === p._id ? { ...l, quantity: l.quantity + 1 } : l) : [...ls, { product: p, quantity: 1, unitPrice: p.salePrice }]);
  }
  const patch = (id: string, k: 'quantity' | 'unitPrice', v: number) => setLines((ls) => ls.map((l) => l.product._id === id ? { ...l, [k]: v } : l));

  async function submit() {
    setBusy(true); setError('');
    try {
      const sale = await api<{ invoiceNo: string; dueAmount: number }>('/sales', { method: 'POST', body: {
        customerId: customerId || undefined, discount: +discount || undefined, paidAmount: paidNum, paymentMethod: method,
        items: lines.map((l) => ({ productId: l.product._id, quantity: l.quantity, unitPrice: l.unitPrice })),
      } });
      setDone(sale); setLines([]); setDiscount(''); setPaid(''); setCustomerId(''); products.reload();
    } catch (e) { setError((e as Error).message); }
    setBusy(false);
  }

  if (!canSell) return <Notice>{t('sn.noPermission')}</Notice>;
  return (
    <>
      <PageHeader title={t('sn.title')} sub={t('sn.sub')} />
      {done && <Notice kind="success">{t('sn.saved', { inv: done.invoiceNo })}{done.dueAmount > 0 && ` ${t('sn.addedDue', { amt: money(done.dueAmount) })}`}</Notice>}
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div>
          <input className={`${inputCls} mb-3`} placeholder={t('sn.search')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('sn.search')} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.data?.items.map((p) => (
              <button key={p._id} disabled={p.stock <= 0} onClick={() => add(p)} className="rounded-lg border border-ink-line bg-white flex items-center gap-3 p-3 text-left hover:border-brand disabled:cursor-not-allowed disabled:opacity-50">
                <Thumb token={p.imageToken} name={p.name} size={52} />
                <div className="min-w-0 flex-1"><div className="truncate font-medium">{p.name}</div>
                <div className="num mt-1 flex items-center justify-between text-sm"><span>{money(p.salePrice)}{p.unit === 'kg' && ` ${t('u.perKg')}`}</span><span className="text-ink-muted">{p.stock <= 0 ? <Badge kind="bad">{t('pr.out')}</Badge> : formatQty(p.stock, p.unit)}</span></div></div>
              </button>
            ))}
          </div>
          {products.data && !products.data.items.length && <Empty>{t('sn.noProducts')}</Empty>}
        </div>

        <Card className="h-fit p-4 lg:sticky lg:top-6">
          <h2 className="mb-3 font-semibold">{t('sn.bill')}</h2>
          {!lines.length ? <p className="py-6 text-center text-sm text-ink-muted">{t('sn.empty')}</p> : (
            <ul className="divide-y divide-ink-line">
              {lines.map((l) => (
                <li key={l.product._id} className="py-2.5">
                  <div className="flex justify-between gap-2 text-sm"><span className="flex items-center gap-2 font-medium"><Thumb token={l.product.imageToken} name={l.product.name} size={28} />{l.product.name}</span><button className="text-bad" onClick={() => setLines(lines.filter((x) => x !== l))} aria-label={`${t('c.remove')} ${l.product.name}`}>{t('c.remove')}</button></div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                    <QtyInput unit={l.product.unit} value={l.quantity} onChange={(v) => patch(l.product._id, 'quantity', v)} />
                    <span className="text-ink-muted">×</span>
                    <input aria-label={l.product.unit === 'kg' ? t('sn.pricePerKg') : t('sn.unitPrice')} className={`${inputCls} num !w-24`} type="number" min="0" step="any" value={l.unitPrice} onChange={(e) => patch(l.product._id, 'unitPrice', +e.target.value)} />
                    {l.product.unit === 'kg' && <span className="text-xs text-ink-muted">{t('sn.perKg')}</span>}
                    <span className="num ml-auto font-medium">{money(round2(l.quantity * l.unitPrice))}</span>
                  </div>
                  {l.quantity > l.product.stock && <p className="mt-1 text-xs text-bad">{t('sn.onlyLeft', { q: formatQty(l.product.stock, l.product.unit) })}</p>}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 space-y-3 border-t-2 border-ink pt-3 text-sm">
            {hasModule('customers') && (
              <Field label={t('sn.customer')} hint={!customerId ? t('sn.walkinHint') : undefined}>
                <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">{t('sn.walkinOpt')}</option>
                  {customers.data?.map((c) => <option key={c._id} value={c._id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('sn.discount')}><input className={`${inputCls} num`} type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
              <Field label={t('sn.method')}>
                <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>{['cash', 'bkash', 'nagad', 'card', 'other'].map((m) => <option key={m} value={m}>{t(`pm.${m}` as Key)}</option>)}</select>
              </Field>
            </div>
            <div className="num flex justify-between text-base font-semibold"><span>{t('c.total')}</span><span>{money(total)}</span></div>
            <Field label={t('sn.received')}><input className={`${inputCls} num`} type="number" min="0" max={total} placeholder={String(total)} value={paid} onChange={(e) => setPaid(e.target.value)} /></Field>
            {due > 0 && <div className="num flex justify-between rounded-md bg-marigold-tint px-3 py-2 font-medium text-marigold"><span>{t('sn.goesDue')}</span><span>{money(due)}</span></div>}
            {error && <Notice>{error}</Notice>}
            <Button className="w-full" disabled={!lines.length || busy || (due > 0 && !customerId) || lines.some((l) => l.quantity <= 0 || l.quantity > l.product.stock)} onClick={submit}>{busy ? t('c.saving') : t('sn.complete')}</Button>
            {due > 0 && !customerId && <p className="text-xs text-marigold">{t('sn.pickCustomer')}</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
