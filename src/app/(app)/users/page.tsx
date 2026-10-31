'use client';
import { FormEvent, useState } from 'react';
import { Badge, Button, Card, Empty, Field, inputCls, Loading, Modal, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ROLE_LIST, Role, User } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function Team() {
  const { user: me, isRole } = useAuth();
  const { data, loading, error, reload } = useFetch<User[]>('/users');
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [msg, setMsg] = useState('');
  if (!isRole('admin')) return <Notice>Only shop admins can manage the team.</Notice>;

  async function toggle(u: User) {
    try { await api(`/users/${u._id}`, { method: 'PATCH', body: { isActive: !u.isActive } }); reload(); } catch (e) { setMsg((e as Error).message); }
  }
  return (
    <>
      <PageHeader title="Team" sub="Give each person only the access they need. A person can have more than one role." action={<Button onClick={() => setEditing('new')}>Add team member</Button>} />
      {(error || msg) && <Notice>{error || msg}</Notice>}
      <Card>
        {loading ? <Loading /> : !data?.length ? <Empty>No team members yet.</Empty> : (
          <Table head={['Name', 'Email', 'Roles', 'Status', '']}>
            {data.map((u) => (
              <tr key={u._id}>
                <td className="font-medium">{u.name}</td><td className="text-ink-muted">{u.email}</td>
                <td className="space-x-1">{u.roles.map((r) => <Badge key={r}>{r}</Badge>)}</td>
                <td>{u.isActive ? <Badge kind="ok">Active</Badge> : <Badge kind="bad">Disabled</Badge>}</td>
                <td className="whitespace-nowrap text-right">
                  <Button variant="quiet" onClick={() => setEditing(u)}>Edit</Button>
                  {u._id !== me?._id && <Button variant="quiet" className={u.isActive ? '!text-bad' : ''} onClick={() => toggle(u)}>{u.isActive ? 'Disable' : 'Enable'}</Button>}
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
  const [f, setF] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', password: '' });
  const [roles, setRoles] = useState<Role[]>(user?.roles ?? ['cashier']);
  const [error, setError] = useState('');
  const toggle = (r: Role) => setRoles(roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!roles.length) return setError('Choose at least one role.');
    try {
      if (user) await api(`/users/${user._id}`, { method: 'PATCH', body: { name: f.name, phone: f.phone || undefined, password: f.password || undefined, ...(self ? {} : { roles }) } });
      else await api('/users', { method: 'POST', body: { ...f, phone: f.phone || undefined, roles } });
      onSaved();
    } catch (err) { setError((err as Error).message); }
  }
  return (
    <Modal title={user ? 'Edit team member' : 'Add team member'} onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name"><input className={inputCls} required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        {!user && <Field label="Email"><input className={inputCls} type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>}
        <Field label="Phone"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label={user ? 'New password (leave empty to keep)' : 'Password'}><input className={inputCls} type="password" minLength={8} required={!user} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" /></Field>
        {!self && (
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-ink-soft">Roles</legend>
            <div className="space-y-1.5 text-sm">
              {ROLE_LIST.map((r) => (
                <label key={r} className="flex gap-2"><input type="checkbox" checked={roles.includes(r)} onChange={() => toggle(r)} />
                  <span><b className="capitalize">{r}</b> <span className="text-ink-muted">{{ admin: 'full access, team and billing', manager: 'products, customers, sales', cashier: 'make sales, record payments', viewer: 'view only' }[r]}</span></span></label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button>Save</Button></div>
      </form>
    </Modal>
  );
}
