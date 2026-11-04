'use client';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { CategoryRow } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';
import { Button, Empty, inputCls, Loading, Modal, Notice } from './ui';

/** Create, rename and delete product categories. */
export function CategoryModal({ canWrite, onClose, onChanged }: { canWrite: boolean; onClose: () => void; onChanged: () => void }) {
  const { t } = useI18n();
  const { data, loading, error, reload } = useFetch<CategoryRow[]>('/categories');
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [msg, setMsg] = useState('');

  async function run(fn: () => Promise<unknown>) {
    setMsg('');
    try { await fn(); reload(); onChanged(); } catch (e) { setMsg((e as Error).message); }
  }
  const add = (e: FormEvent) => { e.preventDefault(); run(async () => { await api('/categories', { method: 'POST', body: { name } }); setName(''); }); };
  const rename = (id: string) => run(async () => { await api(`/categories/${id}`, { method: 'PATCH', body: { name: editName } }); setEditId(null); });
  const remove = (c: CategoryRow) => { if (confirm(t('cat.confirmDelete', { name: c.name }))) run(() => api(`/categories/${c._id}`, { method: 'DELETE' })); };

  return (
    <Modal title={t('cat.title')} onClose={onClose}>
      {(error || msg) && <Notice>{error || msg}</Notice>}
      {canWrite && (
        <form onSubmit={add} className="mb-4 flex gap-2">
          <input className={inputCls} placeholder={t('cat.ph')} aria-label={t('cat.new')} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <Button disabled={!name.trim()}>{t('c.add')}</Button>
        </form>
      )}
      {loading ? <Loading /> : !data?.length ? <Empty>{t('cat.empty')}</Empty> : (
        <ul className="divide-y divide-ink-line rounded-md border border-ink-line">
          {data.map((c) => (
            <li key={c._id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              {editId === c._id ? (
                <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); rename(c._id); }}>
                  <input autoFocus className={inputCls} value={editName} maxLength={60} onChange={(e) => setEditName(e.target.value)} aria-label={t('cat.rename')} />
                  <Button disabled={!editName.trim()}>{t('c.save')}</Button>
                  <Button type="button" variant="ghost" onClick={() => setEditId(null)}>{t('c.cancel')}</Button>
                </form>
              ) : (
                <>
                  <div><span className="font-medium">{c.name}</span> <span className="text-ink-muted">· {t('cat.count', { n: c.productCount })}</span></div>
                  {canWrite && (
                    <div className="whitespace-nowrap">
                      <Button variant="quiet" onClick={() => { setEditId(c._id); setEditName(c.name); }}>{t('cat.rename')}</Button>
                      <Button variant="quiet" className="!text-bad" onClick={() => remove(c)}>{t('c.delete')}</Button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
