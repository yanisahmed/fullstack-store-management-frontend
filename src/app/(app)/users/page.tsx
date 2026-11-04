'use client';
import { FormEvent, useState } from 'react';
import { Badge, Button, Card, Empty, Field, inputCls, Loading, Modal, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Key, useI18n } from '@/lib/i18n';
import { ROLE_LIST, Role, User } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function Team() {
  const { user: me, isRole } = useAuth();
  const { t } = useI18n();
  const { data, loading, error, reload } = useFetch<User[]>('/users');
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [msg, setMsg] = useState('');
  if (!isRole('admin')) return <Notice>{t('tm.onlyAdmin')}</Notice>;

  async function toggle(u: User) {
    try { await api(`/users/${u._id}`, { method: 'PATCH', body: { isActive: !u.isActive } }); reload(); } catch (e) { setMsg((e as Error).message); }
  }
  return (
    <>
      <PageHeader title={t('tm.title')} sub={t('tm.sub')} action={<Button onClick={() => setEditing('new')}>{t('tm.add')}</Button>} />
      {(error || msg) && <Notice>{error || msg}</Notice>}
      <Card>
        {loading ? <Loading /> : !data?.length ? <Empty>{t('tm.none')}</Empty> : (
          <Table head={[t('c.name'), t('c.email'), t('tm.roles'), t('c.status'), '']}>
            {data.map((u) => (
              <tr key={u._id}>
                <td className="font-medium">{u.name}</td><td className="text-ink-muted">{u.email}</td>
                <td className="space-x-1">{u.roles.map((r) => <Badge key={r}>{t(`role.${r}` as Key)}</Badge>)}</td>
                <td>{u.isActive ? <Badge kind="ok">{t('c.active')}</Badge> : <Badge kind="bad">{t('c.disabled')}</Badge>}</td>
                <td className="whitespace-nowrap text-right">
                  <Button variant="quiet" onClick={() => setEditing(u)}>{t('c.edit')}</Button>
                  {u._id !== me?._id && <Button variant="quiet" className={u.isActive ? '!text-bad' : ''} onClick={() => toggle(u)}>{u.isActive ? t('c.disable') : t('c.enable')}</Button>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {editing && <UserModal user={editing === 'new' ? null : editing} self={editing !== 'new' && editing._id === me?._id} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

function UserModal({ user, self, onClose, onSaved }: { user: User | null; self: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', password: '' });
  const [roles, setRoles] = useState<Role[]>(user?.roles ?? ['cashier']);
  const [error, setError] = useState('');
  const toggle = (r: Role) => setRoles(roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!roles.length) return setError(t('tm.pickRole'));
    try {
      if (user) await api(`/users/${user._id}`, { method: 'PATCH', body: { name: f.name, phone: f.phone || undefined, password: f.password || undefined, ...(self ? {} : { roles }) } });
      else await api('/users', { method: 'POST', body: { ...f, phone: f.phone || undefined, roles } });
      onSaved();
    } catch (err) { setError((err as Error).message); }
  }
  return (
    <Modal title={user ? t('tm.editTitle') : t('tm.addTitle')} onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <Field label={t('c.name')}><input className={inputCls} required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        {!user && <Field label={t('c.email')}><input className={inputCls} type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>}
        <Field label={t('c.phone')}><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label={user ? t('tm.newPw') : t('c.password')}><input className={inputCls} type="password" minLength={8} required={!user} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" /></Field>
        {!self && (
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-ink-soft">{t('tm.roles')}</legend>
            <div className="space-y-1.5 text-sm">
              {ROLE_LIST.map((r) => (
                <label key={r} className="flex gap-2"><input type="checkbox" checked={roles.includes(r)} onChange={() => toggle(r)} />
                  <span><b>{t(`role.${r}` as Key)}</b> <span className="text-ink-muted">{t(`role.${r}.d` as Key)}</span></span></label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>{t('c.cancel')}</Button><Button>{t('c.save')}</Button></div>
      </form>
    </Modal>
  );
}
