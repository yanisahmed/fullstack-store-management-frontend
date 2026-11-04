'use client';
import { FormEvent, useState } from 'react';
import { Badge, Button, Card, Empty, Field, fmtDate, inputCls, Loading, Modal, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Key, useI18n } from '@/lib/i18n';
import { MODULE_LIST, ModuleName, Store } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function Stores() {
  const { isRole } = useAuth();
  const { t } = useI18n();
  const { data, loading, error, reload } = useFetch<Store[]>('/stores');
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  if (!isRole('superuser')) return <Notice>{t('as.onlySuper')}</Notice>;

  async function setModules(s: Store, m: ModuleName) {
    const enabledModules = s.enabledModules.includes(m) ? s.enabledModules.filter((x) => x !== m) : [...s.enabledModules, m];
    try { await api(`/stores/${s._id}/modules`, { method: 'PATCH', body: { enabledModules } }); reload(); } catch (e) { setMsg((e as Error).message); }
  }
  async function setStatus(s: Store) {
    try { await api(`/stores/${s._id}/status`, { method: 'PATCH', body: { status: s.status === 'active' ? 'suspended' : 'active' } }); reload(); } catch (e) { setMsg((e as Error).message); }
  }
  return (
    <>
      <PageHeader title={t('as.title')} sub={t('as.sub')} action={<Button onClick={() => setCreating(true)}>{t('as.create')}</Button>} />
      {(error || msg) && <Notice>{error || msg}</Notice>}
      <Card>
        {loading ? <Loading /> : !data?.length ? <Empty>{t('as.none')}</Empty> : (
          <Table head={[t('as.title'), t('as.subscription'), t('as.modules'), t('c.status')]}>
            {data.map((s) => (
              <tr key={s._id}>
                <td className="font-medium">{s.name}</td>
                <td className="text-sm"><Badge kind={s.subscription?.status === 'active' ? 'ok' : s.subscription?.status === 'trial' ? 'warn' : 'bad'}>{t(`ss.${s.subscription?.status ?? 'expired'}` as Key)}</Badge> <span className="text-ink-muted">{t('as.until', { date: fmtDate(s.subscription?.expiresAt) })}</span></td>
                <td><div className="flex flex-wrap gap-x-4 gap-y-1">{MODULE_LIST.map((m) => <label key={m} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={s.enabledModules.includes(m)} onChange={() => setModules(s, m)} />{t(`mod.${m}` as Key)}</label>)}</div></td>
                <td><Button variant="quiet" className={s.status === 'active' ? '' : '!text-bad'} onClick={() => setStatus(s)}>{s.status === 'active' ? t('as.suspend') : t('as.reactivate')}</Button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {creating && <CreateStore onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
    </>
  );
}

function CreateStore({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState({ name: '', adminName: '', adminEmail: '', adminPassword: '', validDays: '30' });
  const [mods, setMods] = useState<ModuleName[]>([...MODULE_LIST]);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    try { await api('/stores', { method: 'POST', body: { ...f, validDays: +f.validDays, enabledModules: mods } }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title={t('as.create')} onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <Field label={t('as.storeName')}><input className={inputCls} required value={f.name} onChange={set('name')} /></Field>
        <Field label={t('as.adminName')}><input className={inputCls} required value={f.adminName} onChange={set('adminName')} /></Field>
        <Field label={t('as.adminEmail')}><input className={inputCls} type="email" required value={f.adminEmail} onChange={set('adminEmail')} /></Field>
        <Field label={t('as.adminPw')}><input className={inputCls} type="password" minLength={8} required value={f.adminPassword} onChange={set('adminPassword')} /></Field>
        <Field label={t('as.validDays')}><input className={inputCls} type="number" min="1" required value={f.validDays} onChange={set('validDays')} /></Field>
        <fieldset><legend className="mb-1 text-sm font-medium text-ink-soft">{t('as.modules')}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">{MODULE_LIST.map((m) => <label key={m} className="flex items-center gap-1.5"><input type="checkbox" checked={mods.includes(m)} onChange={() => setMods(mods.includes(m) ? mods.filter((x) => x !== m) : [...mods, m])} />{t(`mod.${m}` as Key)}</label>)}</div>
        </fieldset>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>{t('c.cancel')}</Button><Button>{t('as.create')}</Button></div>
      </form>
    </Modal>
  );
}
