'use client';
import { useEffect, useMemo, useState } from 'react';
import { QtyInput } from '@/components/QtyInput';
import { formatQty, round2 } from '@/lib/units';
import { Badge, Button, Card, Empty, Field, inputCls, money, Notice, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Customer, Paged, Product } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

interface Line { product: Product; quantity: number; unitPrice: number }

export default function NewSale() {
  const { hasModule, isRole } = useAuth();
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

  if (!canSell) return <Notice>Your role cannot create sales.</Notice>;
  return (
    <>
      <PageHeader title="New sale" sub="Tap a product to add it to the bill." />
      {done && <Notice kind="success">Saved as {done.invoiceNo}.{done.dueAmount > 0 && ` ${money(done.dueAmount)} was added to the customer's due.`}</Notice>}
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div>
          <input className={`${inputCls} mb-3`} placeholder="Search products by name or SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.data?.items.map((p) => (
              <button key={p._id} disabled={p.stock <= 0} onClick={() => add(p)} className="rounded-lg border border-ink-line bg-white p-3 text-left hover:border-brand disabled:cursor-not-allowed disabled:opacity-50">
                <div className="font-medium">{p.name}</div>
                <div className="num mt-1 flex items-center justify-between text-sm"><span>{money(p.salePrice)}{p.unit === 'kg' && ' /kg'}</span><span className="text-ink-muted">{p.stock <= 0 ? <Badge kind="bad">Out</Badge> : formatQty(p.stock, p.unit)}</span></div>
              </button>
            ))}
          </div>
          {products.data && !products.data.items.length && <Empty>No products found.</Empty>}
        </div>

        <Card className="h-fit p-4 lg:sticky lg:top-6">
          <h2 className="mb-3 font-semibold">Bill</h2>
          {!lines.length ? <p className="py-6 text-center text-sm text-ink-muted">Nothing added yet.</p> : (
            <ul className="divide-y divide-ink-line">
              {lines.map((l) => (
                <li key={l.product._id} className="py-2.5">
                  <div className="flex justify-between text-sm"><span className="font-medium">{l.product.name}</span><button className="text-bad" onClick={() => setLines(lines.filter((x) => x !== l))} aria-label={`Remove ${l.product.name}`}>Remove</button></div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                    <QtyInput unit={l.product.unit} value={l.quantity} onChange={(v) => patch(l.product._id, 'quantity', v)} />
                    <span className="text-ink-muted">×</span>
                    <input aria-label={l.product.unit === 'kg' ? 'Price per kg' : 'Unit price'} className={`${inputCls} num !w-24`} type="number" min="0" step="any" value={l.unitPrice} onChange={(e) => patch(l.product._id, 'unitPrice', +e.target.value)} />
                    {l.product.unit === 'kg' && <span className="text-xs text-ink-muted">per kg</span>}
                    <span className="num ml-auto font-medium">{money(round2(l.quantity * l.unitPrice))}</span>
                  </div>
                  {l.quantity > l.product.stock && <p className="mt-1 text-xs text-bad">Only {formatQty(l.product.stock, l.product.unit)} in stock.</p>}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 space-y-3 border-t-2 border-ink pt-3 text-sm">
            {hasModule('customers') && (
              <Field label="Customer" hint={!customerId ? 'Leave empty for a walk-in sale (must be paid in full).' : undefined}>
                <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Walk-in customer</option>
                  {customers.data?.map((c) => <option key={c._id} value={c._id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount"><input className={`${inputCls} num`} type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
              <Field label="Payment method">
                <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>{['cash', 'bkash', 'nagad', 'card', 'other'].map((m) => <option key={m} value={m}>{m}</option>)}</select>
              </Field>
            </div>
            <div className="num flex justify-between text-base font-semibold"><span>Total</span><span>{money(total)}</span></div>
            <Field label="Amount received"><input className={`${inputCls} num`} type="number" min="0" max={total} placeholder={String(total)} value={paid} onChange={(e) => setPaid(e.target.value)} /></Field>
            {due > 0 && <div className="num flex justify-between rounded-md bg-marigold-tint px-3 py-2 font-medium text-marigold"><span>Goes to customer's due</span><span>{money(due)}</span></div>}
            {error && <Notice>{error}</Notice>}
            <Button className="w-full" disabled={!lines.length || busy || (due > 0 && !customerId) || lines.some((l) => l.quantity <= 0 || l.quantity > l.product.stock)} onClick={submit}>{busy ? 'Saving…' : 'Complete sale'}</Button>
            {due > 0 && !customerId && <p className="text-xs text-marigold">Choose a customer to sell on due.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
