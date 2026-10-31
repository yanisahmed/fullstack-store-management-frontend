'use client';
import { FormEvent, useState } from 'react';
import { Badge, Button, Card, Empty, Field, inputCls, Loading, Modal, money, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MODULE_LIST, ModuleName, Plan } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function Plans() {
  const { isRole } = useAuth();
  const { data, loading, error, reload } = useFetch<Plan[]>('/subscriptions/plans');
  const [creating, setCreating] = useState(false);
  if (!isRole('superuser')) return <Notice>Only the platform superuser can manage plans.</Notice>;
  async function retire(p: Plan) { await api(`/subscriptions/plans/${p._id}`, { method: 'PATCH', body: { isActive: false } }); reload(); }
  return (
    <>
      <PageHeader title="Plans" sub="What stores can buy with bKash." action={<Button onClick={() => setCreating(true)}>Create plan</Button>} />
      {error && <Notice>{error}</Notice>}
      <Card>
        {loading ? <Loading /> : !data?.length ? <Empty>No active plans.</Empty> : (
          <Table head={['Plan', 'Price', 'Duration', 'Modules', '']}>
            {data.map((p) => (
              <tr key={p._id}><td className="font-medium">{p.name} <span className="text-xs text-ink-muted">{p.code}</span></td><td className="num">{money(p.priceBDT)}</td><td className="num">{p.durationDays} days</td>
                <td className="space-x-1">{p.modules.map((m) => <Badge key={m}>{m}</Badge>)}</td>
                <td className="text-right"><Button variant="quiet" className="!text-bad" onClick={() => retire(p)}>Retire</Button></td></tr>
            ))}
          </Table>
        )}
      </Card>
      {creating && <CreatePlan onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
    </>
  );
}

function CreatePlan({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: '', code: '', priceBDT: '', durationDays: '30' });
  const [mods, setMods] = useState<ModuleName[]>(['products', 'sales']);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    try { await api('/subscriptions/plans', { method: 'POST', body: { name: f.name, code: f.code, priceBDT: +f.priceBDT, durationDays: +f.durationDays, modules: mods } }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  const t = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Create plan" onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name"><input className={inputCls} required value={f.name} onChange={t('name')} /></Field>
        <Field label="Code" hint="Unique, e.g. pro-monthly"><input className={inputCls} required value={f.code} onChange={t('code')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (BDT)"><input className={inputCls} type="number" min="0" required value={f.priceBDT} onChange={t('priceBDT')} /></Field>
          <Field label="Duration (days)"><input className={inputCls} type="number" min="1" required value={f.durationDays} onChange={t('durationDays')} /></Field>
        </div>
        <fieldset><legend className="mb-1 text-sm font-medium text-ink-soft">Modules included</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm capitalize">{MODULE_LIST.map((m) => <label key={m} className="flex items-center gap-1.5"><input type="checkbox" checked={mods.includes(m)} onChange={() => setMods(mods.includes(m) ? mods.filter((x) => x !== m) : [...mods, m])} />{m}</label>)}</div>
        </fieldset>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button>Create plan</Button></div>
      </form>
    </Modal>
  );
}
