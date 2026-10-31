'use client';
import { FormEvent, useEffect, useState } from 'react';
import { DateFilter } from '@/components/DateFilter';
import { QtyInput } from '@/components/QtyInput';
import { Badge, Button, Card, Empty, Field, fmtDate, inputCls, Loading, Modal, money, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { buildQuery, dateParams, defaultDateFilter } from '@/lib/dateFilter';
import { Paged, Product, StockMovementRow } from '@/lib/types';
import { formatQty } from '@/lib/units';
import { useFetch } from '@/lib/useFetch';

type Form = { name: string; sku: string; category: string; unit: 'pcs' | 'kg'; costPrice: string; salePrice: string; stock: number; lowStockThreshold: number };
const blank: Form = { name: '', sku: '', category: '', unit: 'pcs', costPrice: '', salePrice: '', stock: 0, lowStockThreshold: 5 };

export default function Products() {
  const { isRole } = useAuth();
  const canWrite = isRole('admin', 'manager');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [category, unit, stockFilter, lowOnly]);

  const cats = useFetch<string[]>('/products/categories');
  const { data, loading, error, reload } = useFetch<Paged<Product>>(`/products?${buildQuery({ page, q: dq, category, unit, stock: stockFilter, lowStock: lowOnly })}`);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [stockFor, setStockFor] = useState<Product | null>(null);
  const [historyFor, setHistoryFor] = useState<Product | null>(null);
  const [msg, setMsg] = useState('');

  async function remove(p: Product) {
    if (!confirm(`Delete ${p.name}? Past sales keep their record.`)) return;
    try { await api(`/products/${p._id}`, { method: 'DELETE' }); reload(); } catch (e) { setMsg((e as Error).message); }
  }

  return (
    <>
      <PageHeader title="Products" sub="Everything you sell, with live stock levels." action={canWrite && <Button onClick={() => setEditing('new')}>Add product</Button>} />
      {(error || msg) && <Notice>{error || msg}</Notice>}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <select className={`${inputCls} !w-auto`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>{cats.data?.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={`${inputCls} !w-auto`} value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Sold by">
          <option value="">Pieces and weight</option><option value="pcs">Pieces only</option><option value="kg">Weight (kg) only</option>
        </select>
        <select className={`${inputCls} !w-auto`} value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} aria-label="Stock status">
          <option value="">Any stock</option><option value="in">In stock</option><option value="out">Out of stock</option>
        </select>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only</label>
      </div>
      <Card>
        {loading ? <Loading /> : !data?.items.length ? <Empty>{dq || category || unit || stockFilter || lowOnly ? 'No products match these filters.' : 'No products yet. Add your first product to start tracking stock.'}</Empty> : (
          <Table head={['Product', 'Category', 'Cost', 'Price', 'Stock', '']}>
            {data.items.map((p) => (
              <tr key={p._id}>
                <td><div className="font-medium">{p.name}</div><div className="num text-xs text-ink-muted">{p.sku}</div></td>
                <td className="text-ink-muted">{p.category || '-'}</td>
                <td className="num">{money(p.costPrice)}{p.unit === 'kg' && <span className="text-xs text-ink-muted"> /kg</span>}</td>
                <td className="num">{money(p.salePrice)}{p.unit === 'kg' && <span className="text-xs text-ink-muted"> /kg</span>}</td>
                <td className="num">{formatQty(p.stock, p.unit)} {p.stock === 0 ? <Badge kind="bad">Out</Badge> : p.stock <= p.lowStockThreshold ? <Badge kind="warn">Low</Badge> : null}</td>
                <td className="whitespace-nowrap text-right">
                  <Button variant="quiet" onClick={() => setHistoryFor(p)}>History</Button>
                  {canWrite && <><Button variant="quiet" onClick={() => setStockFor(p)}>Stock</Button><Button variant="quiet" onClick={() => setEditing(p)}>Edit</Button><Button variant="quiet" className="!text-bad" onClick={() => remove(p)}>Delete</Button></>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="num">Page {page} of {data.pages}</span>
          <Button variant="ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
      {editing && <ProductModal product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); cats.reload(); }} />}
      {stockFor && <StockModal product={stockFor} onClose={() => setStockFor(null)} onSaved={() => { setStockFor(null); reload(); }} />}
      {historyFor && <HistoryModal product={historyFor} onClose={() => setHistoryFor(null)} />}
    </>
  );
}

const MOVE_LABEL: Record<string, string> = { in: 'Stock added', out: 'Stock removed', adjustment: 'Stock count', sale: 'Sold', sale_return: 'Sale return' };

function HistoryModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [date, setDate] = useState(defaultDateFilter('last_30_days'));
  const [type, setType] = useState('');
  const { data, loading, error } = useFetch<StockMovementRow[]>(`/products/${product._id}/movements?${buildQuery({ ...dateParams(date), type })}`);
  return (
    <Modal title={`Stock history: ${product.name}`} onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <DateFilter value={date} onChange={setDate} />
        <label><span className="mb-1 block text-xs font-medium text-ink-muted">Type</span>
          <select className={`${inputCls} !w-auto`} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All movements</option>{Object.entries(MOVE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      {error && <Notice>{error}</Notice>}
      {loading ? <Loading /> : !data?.length ? <Empty>No stock movements in this period.</Empty> : (
        <Table head={['Date', 'What happened', 'Change', 'Stock after', 'Note']}>
          {data.map((m) => (
            <tr key={m._id}>
              <td className="whitespace-nowrap">{fmtDate(m.createdAt)}</td><td>{MOVE_LABEL[m.type] ?? m.type}</td>
              <td className={`num ${m.quantity < 0 ? 'text-bad' : 'text-ok'}`}>{m.quantity > 0 ? '+' : '−'}{formatQty(Math.abs(m.quantity), product.unit)}</td>
              <td className="num">{m.stockAfter !== undefined ? formatQty(m.stockAfter, product.unit) : '-'}</td><td className="text-ink-muted">{m.note}</td>
            </tr>
          ))}
        </Table>
      )}
    </Modal>
  );
}

function ProductModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Form>(product ? { name: product.name, sku: product.sku, category: product.category ?? '', unit: product.unit, costPrice: String(product.costPrice), salePrice: String(product.salePrice), stock: 0, lowStockThreshold: product.lowStockThreshold } : blank);
  const [error, setError] = useState('');
  const set = (k: 'name' | 'sku' | 'category' | 'costPrice' | 'salePrice') => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const kg = f.unit === 'kg';

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = { name: f.name, sku: f.sku, category: f.category || undefined, costPrice: +f.costPrice, salePrice: +f.salePrice, lowStockThreshold: f.lowStockThreshold };
    if (!product) { body.unit = f.unit; body.stock = f.stock; }
    try { await api(product ? `/products/${product._id}` : '/products', { method: product ? 'PATCH' : 'POST', body }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  return (
    <Modal title={product ? 'Edit product' : 'Add product'} onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name"><input className={inputCls} required value={f.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU"><input className={inputCls} required value={f.sku} onChange={set('sku')} /></Field>
          <Field label="Category"><input className={inputCls} value={f.category} onChange={set('category')} /></Field>
          <div className="col-span-2">
            <Field label="Sold by" hint={product ? 'The unit cannot be changed after the product is created.' : kg ? 'Prices are per kg. Quantities can be entered in kg and grams.' : undefined}>
              <select className={inputCls} value={f.unit} disabled={!!product}
                onChange={(e) => setF({ ...f, unit: e.target.value as 'pcs' | 'kg', stock: 0, lowStockThreshold: e.target.value === 'kg' ? 1 : 5 })}>
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Weight (kg)</option>
              </select>
            </Field>
          </div>
          <Field label={kg ? 'Cost price per kg' : 'Cost price'}><input className={inputCls} type="number" min="0" step="any" required value={f.costPrice} onChange={set('costPrice')} /></Field>
          <Field label={kg ? 'Sale price per kg' : 'Sale price'}><input className={inputCls} type="number" min="0" step="any" required value={f.salePrice} onChange={set('salePrice')} /></Field>
          {!product && <div className="col-span-2"><Field label="Opening stock"><QtyInput unit={f.unit} label="Opening stock" value={f.stock} onChange={(v) => setF({ ...f, stock: v })} /></Field></div>}
          <div className="col-span-2"><Field label="Low-stock alert at"><QtyInput unit={f.unit} label="Low-stock level" value={f.lowStockThreshold} onChange={(v) => setF({ ...f, lowStockThreshold: v })} /></Field></div>
        </div>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button>Save product</Button></div>
      </form>
    </Modal>
  );
}

function StockModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [qty, setQty] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    try { await api(`/products/${product._id}/stock`, { method: 'POST', body: { type, quantity: qty, note: note || undefined } }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  return (
    <Modal title={`Update stock: ${product.name}`} onClose={onClose}>
      <p className="num mb-3 text-sm text-ink-muted">Currently {formatQty(product.stock, product.unit)}</p>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <Field label="Action">
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="in">Add stock (received)</option><option value="out">Remove stock (damaged, returned)</option><option value="adjustment">Set exact count (stock take)</option>
          </select>
        </Field>
        <Field label={type === 'adjustment' ? 'New stock count' : 'Quantity'}><QtyInput unit={product.unit} value={qty} onChange={setQty} /></Field>
        <Field label="Note (optional)"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={type !== 'adjustment' && qty <= 0}>Update stock</Button></div>
      </form>
    </Modal>
  );
}
