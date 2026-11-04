'use client';
import { FormEvent, useState } from 'react';
import { Badge, Button, Card, Empty, Field, inputCls, Loading, Modal, money, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Key, useI18n } from '@/lib/i18n';
import { MODULE_LIST, ModuleName, Plan } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function Plans() {
  const { isRole } = useAuth();
  const { t } = useI18n();
  const { data, loading, error, reload } = useFetch<Plan[]>('/subscriptions/plans');
  const [creating, setCreating] = useState(false);
  if (!isRole('superuser')) return <Notice>{t('ap.onlySuper')}</Notice>;
  async function retire(p: Plan) { await api(`/subscriptions/plans/${p._id}`, { method: 'PATCH', body: { isActive: false } }); reload(); }
  return (
    <>
      <PageHeader title={t('ap.title')} sub={t('ap.sub')} action={<Button onClick={() => setCreating(true)}>{t('ap.create')}</Button>} />
      {error && <Notice>{error}</Notice>}
      <Card>
        {loading ? <Loading /> : !data?.length ? <Empty>{t('ap.none')}</Empty> : (
          <Table head={[t('bi.plan'), t('th.price'), t('th.duration'), t('as.modules'), '']}>
            {data.map((p) => (
              <tr key={p._id}><td className="font-medium">{p.name} <span className="text-xs text-ink-muted">{p.code}</span></td><td className="num">{money(p.priceBDT)}</td><td className="num">{t('ap.days', { n: p.durationDays })}</td>
                <td className="space-x-1">{p.modules.map((m) => <Badge key={m}>{t(`mod.${m}` as Key)}</Badge>)}</td>
                <td className="text-right"><Button variant="quiet" className="!text-bad" onClick={() => retire(p)}>{t('ap.retire')}</Button></td></tr>
            ))}
          </Table>
        )}
      </Card>
      {creating && <CreatePlan onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
    </>
  );
}

function CreatePlan({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState({ name: '', code: '', priceBDT: '', durationDays: '30' });
  const [mods, setMods] = useState<ModuleName[]>(['products', 'sales']);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    try { await api('/subscriptions/plans', { method: 'POST', body: { name: f.name, code: f.code, priceBDT: +f.priceBDT, durationDays: +f.durationDays, modules: mods } }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={t('ap.create')} onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <Field label={t('c.name')}><input className={inputCls} required value={f.name} onChange={set('name')} /></Field>
        <Field label={t('ap.code')} hint={t('ap.codeHint')}><input className={inputCls} required value={f.code} onChange={set('code')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('ap.price')}><input className={inputCls} type="number" min="0" required value={f.priceBDT} onChange={set('priceBDT')} /></Field>
          <Field label={t('ap.duration')}><input className={inputCls} type="number" min="1" required value={f.durationDays} onChange={set('durationDays')} /></Field>
        </div>
        <fieldset><legend className="mb-1 text-sm font-medium text-ink-soft">{t('ap.incl')}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">{MODULE_LIST.map((m) => <label key={m} className="flex items-center gap-1.5"><input type="checkbox" checked={mods.includes(m)} onChange={() => setMods(mods.includes(m) ? mods.filter((x) => x !== m) : [...mods, m])} />{t(`mod.${m}` as Key)}</label>)}</div>
        </fieldset>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>{t('c.cancel')}</Button><Button>{t('ap.create')}</Button></div>
      </form>
    </Modal>
  );
}
