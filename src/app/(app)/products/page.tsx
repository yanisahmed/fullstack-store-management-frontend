'use client';
import { FormEvent, useEffect, useState } from 'react';
import { CategoryModal } from '@/components/CategoryModal';
import { DateFilter } from '@/components/DateFilter';
import { ImageUpload } from '@/components/ImageUpload';
import { QtyInput } from '@/components/QtyInput';
import { Thumb } from '@/components/Thumb';
import { Badge, Button, Card, Empty, Field, fmtDate, inputCls, Loading, Modal, money, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { buildQuery, dateParams, defaultDateFilter } from '@/lib/dateFilter';
import { Key, translate, useI18n } from '@/lib/i18n';
import { CategoryRow, Paged, Product, StockMovementRow } from '@/lib/types';
import { formatQty } from '@/lib/units';
import { useFetch } from '@/lib/useFetch';

type Form = { name: string; sku: string; category: string; unit: 'pcs' | 'kg'; costPrice: string; salePrice: string; stock: number; lowStockThreshold: number };
const blank: Form = { name: '', sku: '', category: '', unit: 'pcs', costPrice: '', salePrice: '', stock: 0, lowStockThreshold: 5 };
const MOVES = ['in', 'out', 'adjustment', 'sale', 'sale_return'];

export default function Products() {
  const { isRole } = useAuth();
  const { t } = useI18n();
  const canWrite = isRole('admin', 'manager');
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => { const timer = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(timer); }, [q]);
  useEffect(() => { setPage(1); }, [category, unit, stockFilter, lowOnly]);

  const cats = useFetch<CategoryRow[]>('/categories');
  const { data, loading, error, reload } = useFetch<Paged<Product>>(`/products?${buildQuery({ page, q: dq, category, unit, stock: stockFilter, lowStock: lowOnly })}`);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [stockFor, setStockFor] = useState<Product | null>(null);
  const [historyFor, setHistoryFor] = useState<Product | null>(null);
  const [showCats, setShowCats] = useState(false);
  const [msg, setMsg] = useState('');

  async function remove(p: Product) {
    if (!confirm(t('pr.confirmDelete', { name: p.name }))) return;
    try { await api(`/products/${p._id}`, { method: 'DELETE' }); reload(); } catch (e) { setMsg((e as Error).message); }
  }

  return (
    <>
      <PageHeader title={t('pr.title')} sub={t('pr.sub')} action={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowCats(true)}>{t('pr.categories')}</Button>
          {canWrite && <Button onClick={() => setEditing('new')}>{t('pr.add')}</Button>}
        </div>} />
      {(error || msg) && <Notice>{error || msg}</Notice>}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <input className={`${inputCls} max-w-xs`} placeholder={t('pr.search')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('pr.search')} />
        <select className={`${inputCls} !w-auto`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('c.category')}>
          <option value="">{t('pr.allCats')}</option>{cats.data?.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <select className={`${inputCls} !w-auto`} value={unit} onChange={(e) => setUnit(e.target.value)} aria-label={t('pr.soldBy')}>
          <option value="">{t('pr.pcsAndKg')}</option><option value="pcs">{t('pr.pcsOnly')}</option><option value="kg">{t('pr.kgOnly')}</option>
        </select>
        <select className={`${inputCls} !w-auto`} value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} aria-label={t('pr.stock')}>
          <option value="">{t('pr.anyStock')}</option><option value="in">{t('pr.inStockOpt')}</option><option value="out">{t('pr.outStockOpt')}</option>
        </select>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> {t('pr.lowOnly')}</label>
      </div>
      <Card>
        {loading ? <Loading /> : !data?.items.length ? <Empty>{dq || category || unit || stockFilter || lowOnly ? t('pr.noMatch') : t('pr.none')}</Empty> : (
          <Table head={[t('th.product'), t('c.category'), t('pr.cost'), t('pr.price'), t('pr.stock'), '']}>
            {data.items.map((p) => (
              <tr key={p._id}>
                <td><div className="flex items-center gap-3"><Thumb token={p.imageToken} name={p.name} size={40} /><div><div className="font-medium">{p.name}</div><div className="num text-xs text-ink-muted">{p.sku}</div></div></div></td>
                <td className="text-ink-muted">{p.category || '-'}</td>
                <td className="num">{money(p.costPrice)}{p.unit === 'kg' && <span className="text-xs text-ink-muted"> {t('u.perKg')}</span>}</td>
                <td className="num">{money(p.salePrice)}{p.unit === 'kg' && <span className="text-xs text-ink-muted"> {t('u.perKg')}</span>}</td>
                <td className="num">{formatQty(p.stock, p.unit)} {p.stock === 0 ? <Badge kind="bad">{t('pr.out')}</Badge> : p.stock <= p.lowStockThreshold ? <Badge kind="warn">{t('pr.low')}</Badge> : null}</td>
                <td className="whitespace-nowrap text-right">
                  <Button variant="quiet" onClick={() => setHistoryFor(p)}>{t('c.history')}</Button>
                  {canWrite && <><Button variant="quiet" onClick={() => setStockFor(p)}>{t('pr.stock')}</Button><Button variant="quiet" onClick={() => setEditing(p)}>{t('c.edit')}</Button><Button variant="quiet" className="!text-bad" onClick={() => remove(p)}>{t('c.delete')}</Button></>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('c.prev')}</Button>
          <span className="num">{t('c.page', { p: page, n: data.pages })}</span>
          <Button variant="ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>{t('c.next')}</Button>
        </div>
      )}
      {editing && <ProductModal product={editing === 'new' ? null : editing} categories={cats.data ?? []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); cats.reload(); }} />}
      {stockFor && <StockModal product={stockFor} onClose={() => setStockFor(null)} onSaved={() => { setStockFor(null); reload(); }} />}
      {historyFor && <HistoryModal product={historyFor} onClose={() => setHistoryFor(null)} />}
      {showCats && <CategoryModal canWrite={canWrite} onClose={() => setShowCats(false)} onChanged={() => { cats.reload(); reload(); }} />}
    </>
  );
}

function HistoryModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { t } = useI18n();
  const [date, setDate] = useState(defaultDateFilter('last_30_days'));
  const [type, setType] = useState('');
  const { data, loading, error } = useFetch<StockMovementRow[]>(`/products/${product._id}/movements?${buildQuery({ ...dateParams(date), type })}`);
  return (
    <Modal title={t('pr.histTitle', { name: product.name })} onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <DateFilter value={date} onChange={setDate} />
        <label><span className="mb-1 block text-xs font-medium text-ink-muted">{t('c.type')}</span>
          <select className={`${inputCls} !w-auto`} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{t('pr.allMoves')}</option>{MOVES.map((k) => <option key={k} value={k}>{t(`mv.${k}` as Key)}</option>)}
          </select>
        </label>
      </div>
      {error && <Notice>{error}</Notice>}
      {loading ? <Loading /> : !data?.length ? <Empty>{t('pr.noMoves')}</Empty> : (
        <Table head={[t('c.date'), t('pr.what'), t('pr.change'), t('pr.after'), t('c.note')]}>
          {data.map((m) => (
            <tr key={m._id}>
              <td className="whitespace-nowrap">{fmtDate(m.createdAt)}</td><td>{MOVES.includes(m.type) ? t(`mv.${m.type}` as Key) : m.type}</td>
              <td className={`num ${m.quantity < 0 ? 'text-bad' : 'text-ok'}`}>{m.quantity > 0 ? '+' : '−'}{formatQty(Math.abs(m.quantity), product.unit)}</td>
              <td className="num">{m.stockAfter !== undefined ? formatQty(m.stockAfter, product.unit) : '-'}</td><td className="text-ink-muted">{m.note}</td>
            </tr>
          ))}
        </Table>
      )}
    </Modal>
  );
}

interface DupInfo { id: string; name: string; sku: string; isActive: boolean }

function ProductModal({ product, categories, onClose, onSaved }: { product: Product | null; categories: CategoryRow[]; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState<Form>(product ? { name: product.name, sku: product.sku, category: product.category ?? '', unit: product.unit, costPrice: String(product.costPrice), salePrice: String(product.salePrice), stock: 0, lowStockThreshold: product.lowStockThreshold } : blank);
  const [error, setError] = useState('');
  const [dup, setDup] = useState<{ sku: DupInfo | null; name: DupInfo | null }>({ sku: null, name: null });
  const [checking, setChecking] = useState(false);
  const [imageToken, setImageToken] = useState<string | null>(product?.imageToken ?? null);
  const [imgChanged, setImgChanged] = useState(false);
  const set = (k: 'name' | 'sku' | 'category' | 'costPrice' | 'salePrice') => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const kg = f.unit === 'kg';

  // Look for an existing product with the same SKU or name while the user types
  useEffect(() => {
    let cancelled = false;
    if (!f.sku.trim() && !f.name.trim()) { setDup({ sku: null, name: null }); return; }
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const r = await api<{ sku: DupInfo | null; name: DupInfo | null }>(`/products/check?${buildQuery({ sku: f.sku, name: f.name, exclude: product?._id })}`);
        if (!cancelled) setDup(r);
      } catch { if (!cancelled) setDup({ sku: null, name: null }); }
      if (!cancelled) setChecking(false);
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [f.sku, f.name, product?._id]);

  const dupMsgs: { key: string; info: DupInfo; text: string }[] = [];
  if (dup.sku) dupMsgs.push({ key: 'sku', info: dup.sku, text: translate((dup.sku.isActive ? 'err.DUPLICATE_SKU' : 'err.DUPLICATE_SKU_DELETED') as Key, { sku: dup.sku.sku, name: dup.sku.name }) });
  if (dup.name && dup.name.id !== dup.sku?.id) dupMsgs.push({ key: 'name', info: dup.name, text: translate((dup.name.isActive ? 'err.DUPLICATE_NAME' : 'err.DUPLICATE_NAME_DELETED') as Key, { name: dup.name.name }) });

  async function restore(id: string) {
    try { await api(`/products/${id}/restore`, { method: 'POST' }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    // when editing, send '' for a cleared category so it is really removed
    const body: Record<string, unknown> = { name: f.name, sku: f.sku, category: f.category || (product ? '' : undefined), costPrice: +f.costPrice, salePrice: +f.salePrice, lowStockThreshold: f.lowStockThreshold };
    if (!product) { body.unit = f.unit; body.stock = f.stock; }
    if (imgChanged) body.imageToken = imageToken; // null removes the photo
    try { await api(product ? `/products/${product._id}` : '/products', { method: product ? 'PATCH' : 'POST', body }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  return (
    <Modal title={product ? t('pr.editTitle') : t('pr.addTitle')} onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <span className="mb-1 block text-sm font-medium text-ink-soft">{t('img.photo')}</span>
          <ImageUpload kind="product" token={imageToken} name={f.name} onChange={(tk) => { setImageToken(tk); setImgChanged(true); }} onError={setError} />
        </div>
        <Field label={t('c.name')}><input className={inputCls} required value={f.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('pr.sku')}><input className={inputCls} required value={f.sku} onChange={set('sku')} /></Field>
          <Field label={t('c.category')} hint={t('pr.catHint')}>
            <input className={inputCls} list="category-options" value={f.category} maxLength={60} onChange={set('category')} />
            <datalist id="category-options">{categories.map((c) => <option key={c._id} value={c.name} />)}</datalist>
          </Field>
        </div>
        {dupMsgs.map((m) => (
          <Notice key={m.key} kind="warn">
            {m.text}
            {!m.info.isActive && !product && <> <button type="button" className="font-semibold underline" onClick={() => restore(m.info.id)}>{t('dup.restore')}</button></>}
          </Notice>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label={t('pr.soldBy')} hint={product ? t('pr.unitLocked') : kg ? t('pr.kgHint') : undefined}>
              <select className={inputCls} value={f.unit} disabled={!!product}
                onChange={(e) => setF({ ...f, unit: e.target.value as 'pcs' | 'kg', stock: 0, lowStockThreshold: e.target.value === 'kg' ? 1 : 5 })}>
                <option value="pcs">{t('pr.pieces')}</option>
                <option value="kg">{t('pr.weight')}</option>
              </select>
            </Field>
          </div>
          <Field label={kg ? t('pr.costPerKg') : t('pr.costPrice')}><input className={inputCls} type="number" min="0" step="any" required value={f.costPrice} onChange={set('costPrice')} /></Field>
          <Field label={kg ? t('pr.salePerKg') : t('pr.salePrice')}><input className={inputCls} type="number" min="0" step="any" required value={f.salePrice} onChange={set('salePrice')} /></Field>
          {!product && <div className="col-span-2"><Field label={t('pr.opening')}><QtyInput unit={f.unit} label={t('pr.opening')} value={f.stock} onChange={(v) => setF({ ...f, stock: v })} /></Field></div>}
          <div className="col-span-2"><Field label={t('pr.lowAt')}><QtyInput unit={f.unit} label={t('pr.lowAt')} value={f.lowStockThreshold} onChange={(v) => setF({ ...f, lowStockThreshold: v })} /></Field></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t('c.cancel')}</Button>
          <Button disabled={checking || dupMsgs.length > 0}>{checking ? t('pr.checking') : t('pr.saveProduct')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function StockModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [qty, setQty] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    try { await api(`/products/${product._id}/stock`, { method: 'POST', body: { type, quantity: qty, note: note || undefined } }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  return (
    <Modal title={t('st.title', { name: product.name })} onClose={onClose}>
      <p className="num mb-3 text-sm text-ink-muted">{t('st.current', { q: formatQty(product.stock, product.unit) })}</p>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <Field label={t('st.action')}>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="in">{t('st.in')}</option><option value="out">{t('st.out')}</option><option value="adjustment">{t('st.adjust')}</option>
          </select>
        </Field>
        <Field label={type === 'adjustment' ? t('st.newCount') : t('st.qty')}><QtyInput unit={product.unit} value={qty} onChange={setQty} /></Field>
        <Field label={t('c.noteOpt')}><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>{t('c.cancel')}</Button><Button disabled={type !== 'adjustment' && qty <= 0}>{t('st.update')}</Button></div>
      </form>
    </Modal>
  );
}
